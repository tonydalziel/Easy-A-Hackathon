// router for agent endpoints
import express, { Request, Response } from 'express';
import { postAgentToChain } from './chain';
import { AgentState, ItemState } from './types';
import { haveLLMConsiderPurchase } from './llms';
import { itemProcessor } from './itemProcessor';

const router = express.Router();

// In-memory storage for registered agents
const registeredAgents = new Map<string, AgentState>();

// In-memory storage for items for sale
const registeredItems = new Map<string, ItemState>();

// Example endpoint
router.get('/status', (req: Request, res: Response) => {
    const processorStatus = itemProcessor.getQueueStatus();
    res.json({
        status: 'Agent router is running',
        agents: registeredAgents.size,
        items: registeredItems.size,
        processor: processorStatus
    });
});

// ========== ITEM ENDPOINTS (must come before /:agentId to avoid conflicts) ==========

// Get all items for sale
router.get('/items', (req: Request, res: Response) => {
    console.log('📥 GET /agents/items');
    const items = Array.from(registeredItems.values());
    console.log(`📊 Returning ${items.length} items`);
    res.json({
        items,
        count: items.length
    });
});

// Get specific item
router.get('/items/:itemId', (req: Request, res: Response) => {
    console.log('📥 GET /agents/items/:itemId - Item ID:', req.params.itemId);
    const { itemId } = req.params;
    const item = registeredItems.get(itemId);

    if (!item) {
        console.log('❌ Item not found:', itemId);
        return res.status(404).json({ error: 'Item not found' });
    }

    console.log('✅ Found item:', item);
    res.json({ item });
});

// Register a new item for sale
router.post('/items', (req: Request, res: Response) => {
    try {
        console.log('📥 POST /agents/items - Request body:', req.body);
        const { name, description, price, seller_id } = req.body;

        // Validate required fields
        if (!name || price === undefined) {
            console.log('❌ Validation failed: Missing required fields');
            return res.status(400).json({
                error: 'Missing required fields: name, price'
            });
        }

        // Validate price is a positive number
        const itemPrice = parseFloat(price);
        if (isNaN(itemPrice) || itemPrice < 0) {
            console.log('❌ Validation failed: Invalid price:', price);
            return res.status(400).json({
                error: 'price must be a valid positive number'
            });
        }

        // Generate unique item ID
        const itemId = `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Create item state
        const itemState: ItemState = {
            id: itemId,
            name,
            price: itemPrice
        };

        // Store item
        registeredItems.set(itemId, itemState);

        console.log(`✅ Registered item: ${itemId} - "${name}" ($${itemPrice})`);
        console.log(`📊 Total items registered: ${registeredItems.size}`);

        // Process this new item with all existing agents
        const allAgents = Array.from(registeredAgents.values());
        if (allAgents.length > 0) {
            // Process asynchronously, don't block the response
            itemProcessor.processItemWithAllAgents(itemState, allAgents)
                .catch(error => console.error('Error processing item with agents:', error));
        }

        res.json({
            success: true,
            message: 'Item registered successfully',
            itemId: itemId,
            name: itemState.name,
            price: itemState.price,
            item: itemState,
            agentsNotified: allAgents.length
        });
    } catch (error) {
        console.error('❌ Error registering item:', error);
        res.status(500).json({
            error: 'Failed to register item',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// Delete an item
router.delete('/items/:itemId', (req: Request, res: Response) => {
    console.log('📥 DELETE /agents/items/:itemId - Item ID:', req.params.itemId);
    const { itemId } = req.params;

    if (!registeredItems.has(itemId)) {
        console.log('❌ Item not found:', itemId);
        return res.status(404).json({ error: 'Item not found' });
    }

    const item = registeredItems.get(itemId);
    registeredItems.delete(itemId);
    console.log(`✅ Deleted item: ${itemId} - "${item?.name}"`);
    console.log(`📊 Remaining items: ${registeredItems.size}`);

    res.json({
        success: true,
        message: 'Item deleted successfully'
    });
});

// ========== AGENT ENDPOINTS ==========

// Get all registered agents
router.get('/', (req: Request, res: Response) => {
    const agents = Array.from(registeredAgents.values());
    res.json({
        agents,
        count: agents.length
    });
});

// Create/Register a new agent
router.post('/', async (req: Request, res: Response) => {
    try {
        const { provider_id, model_id, prompt, user_id, walletBalance } = req.body;

        // Validate required fields
        if (!provider_id || !model_id || !prompt || !user_id) {
            return res.status(400).json({
                error: 'Missing required fields: provider_id, model_id, prompt, user_id'
            });
        }

        // Check if agent already exists
        if (registeredAgents.has(user_id)) {
            return res.status(409).json({
                error: 'Agent already registered',
                agent: registeredAgents.get(user_id)
            });
        }

        // Default wallet balance: 1000 ALGO (in microALGO)
        const initialBalance = walletBalance || 1000000000; // 1000 ALGO = 1,000,000,000 microALGO

        // Hardcoded master wallet address (the DISPENSER account with funds)
        const masterWalletAddress = process.env.SENDER_ADDR || 'VQKN6Y336A26P4EUGNLKW2KO7WF5K7OO3DODUCSSYFCXF35JBSJ6EHMSMU';

        let blockchainAgentId: string | null = null;
        let wallet_id = `wallet-${Date.now()}`;

        // Post agent to blockchain with funding
        try {
            console.log(`💰 Creating agent on blockchain with ${initialBalance / 1000000} ALGO...`);
            blockchainAgentId = await postAgentToChain(
                masterWalletAddress,
                provider_id,
                model_id,
                prompt,
                initialBalance
            );

            console.log(`✅ Agent posted to blockchain! Transaction ID: ${blockchainAgentId}`);

            // Use blockchain transaction ID as wallet_id
            wallet_id = blockchainAgentId;
        } catch (error) {
            console.error('⚠️  Failed to post agent to blockchain:', error);
            // Continue with local registration even if blockchain fails
        }

        // Create agent state
        const agentState: AgentState = {
            agent_id: user_id,
            prompt,
            model_id,
            provider_id,
            currentItemsAcquired: [],
            wallet_id,
            wallet_pwd: 'temp-pwd', // In production, this should be properly managed
            walletBalance: initialBalance
        };

        // Store agent
        registeredAgents.set(user_id, agentState);

        console.log(`✅ Registered agent: ${user_id} - "${prompt}" with ${initialBalance / 1000000} ALGO`);

        // Process all existing items with this new agent
        const allItems = Array.from(registeredItems.values());
        if (allItems.length > 0) {
            // Process asynchronously, don't block the response
            itemProcessor.processAllItemsWithAgent(agentState, allItems)
                .catch(error => console.error('Error processing items with new agent:', error));
        }

        res.json({
            success: true,
            message: 'Agent registered successfully',
            agentId: user_id,
            agent: agentState,
            blockchainTxId: blockchainAgentId,
            itemsToProcess: allItems.length
        });
    } catch (error) {
        console.error('Error registering agent:', error);
        res.status(500).json({
            error: 'Failed to register agent',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// Endpoint to have LLM consider a purchase
router.post('/consider-purchase', async (req: Request, res: Response) => {
    try {
        const { agentState, itemState } = req.body;

        // Validate request body
        if (!agentState || !itemState) {
            return res.status(400).json({
                error: 'Missing required fields: agentState and itemState'
            });
        }

        // Call the LLM function
        const purchaseIntentId = await haveLLMConsiderPurchase(agentState, itemState);

        if (purchaseIntentId === null) {
            return res.json({
                decision: 'IGNORE',
                purchaseIntentId: null,
                message: 'Agent decided not to purchase the item'
            });
        }

        res.json({
            decision: 'BUY',
            purchaseIntentId,
            message: 'Purchase intent registered successfully'
        });
    } catch (error) {
        console.error('Error in consider-purchase endpoint:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// Endpoint to manually trigger processing (useful for debugging)
router.post('/process-all', async (req: Request, res: Response) => {
    try {
        const allAgents = Array.from(registeredAgents.values());
        const allItems = Array.from(registeredItems.values());

        console.log(`🔄 Manual trigger: Processing ${allItems.length} items with ${allAgents.length} agents`);

        if (allAgents.length === 0 || allItems.length === 0) {
            return res.json({
                success: true,
                message: 'No processing needed',
                agents: allAgents.length,
                items: allItems.length
            });
        }

        // Process asynchronously
        const promises = allAgents.map(agent =>
            itemProcessor.processAllItemsWithAgent(agent, allItems)
        );

        // Wait for all to complete
        await Promise.all(promises);

        res.json({
            success: true,
            message: 'Processing completed',
            agents: allAgents.length,
            items: allItems.length,
            totalProcessed: allAgents.length * allItems.length
        });
    } catch (error) {
        console.error('Error in process-all endpoint:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// Get specific agent (must come AFTER all specific routes like /items, /status, /consider-purchase)
router.get('/:agentId', (req: Request, res: Response) => {
    console.log('📥 GET /agents/:agentId - Agent ID:', req.params.agentId);
    const { agentId } = req.params;
    const agent = registeredAgents.get(agentId);

    if (!agent) {
        console.log('❌ Agent not found:', agentId);
        return res.status(404).json({ error: 'Agent not found' });
    }

    console.log('✅ Found agent:', agent.agent_id);
    res.json({ agent });
});

// Import listing functions
import { openListingOnChain, getListingStatusFromChain } from './chain';

// Open a new listing
router.post('/listings', async (req: Request, res: Response) => {
    try {
        const { merchantUsername, targetAmount } = req.body;
        
        if (!merchantUsername || !targetAmount) {
            return res.status(400).json({ error: 'merchantUsername and targetAmount are required' });
        }
        
        // Get merchant wallet address
        const merchantResponse = await fetch(`http://localhost:3000/merchants/${merchantUsername}/wallet`);
        if (!merchantResponse.ok) {
            return res.status(404).json({ error: 'Merchant not found' });
        }
        
        const { wallet_address } = await merchantResponse.json();
        
        const result = await openListingOnChain(wallet_address, targetAmount);
        res.json({ 
            message: 'Listing opened successfully',
            merchant: merchantUsername,
            wallet_address: wallet_address,
            result: result
        });
    } catch (error) {
        console.error('Error opening listing:', error);
        res.status(500).json({ error: 'Failed to open listing' });
    }
});

// Get listing status
router.get('/listings/status', async (req: Request, res: Response) => {
    try {
        const status = await getListingStatusFromChain();
        res.json({
            status: status
        });
    } catch (error) {
        console.error('Error getting listing status:', error);
        res.status(500).json({ error: 'Failed to get listing status' });
    }
});

export default router;
