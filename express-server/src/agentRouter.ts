// router for agent endpoints
import express, { Request, Response } from 'express';
import { postAgentToChain } from './chain';
import { AgentState, ItemState } from './types';
import { haveLLMConsiderPurchase } from './llms';

const router = express.Router();

// In-memory storage for registered agents
const registeredAgents = new Map<string, AgentState>();

// Example endpoint 
router.get('/status', (req: Request, res: Response) => {
    res.json({ status: 'Agent router is running' });
});

// Get all registered agents
router.get('/', (req: Request, res: Response) => {
    const agents = Array.from(registeredAgents.values());
    res.json({
        agents,
        count: agents.length
    });
});

// Get specific agent
router.get('/:agentId', (req: Request, res: Response) => {
    const { agentId } = req.params;
    const agent = registeredAgents.get(agentId);
    
    if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
    }
    
    res.json({ agent });
});

// Create/Register a new agent
router.post('/', (req: Request, res: Response) => {
    try {
        const { provider_id, model_id, prompt, user_id } = req.body;

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

        // Create agent state (wallet info would come from buyer-nextjs-app or be generated here)
        const agentState: AgentState = {
            agent_id: user_id,
            prompt,
            model_id,
            provider_id,
            currentItemsAcquired: [],
            wallet_id: `wallet-${Date.now()}`,
            wallet_pwd: 'temp-pwd' // In production, this should be properly managed
        };

        // Store agent
        registeredAgents.set(user_id, agentState);
        
        console.log(`✅ Registered agent: ${user_id} - "${prompt}"`);

        // Optionally post to blockchain
        // postAgentToChain(provider_id, model_id, prompt, user_id);

        res.json({
            success: true,
            message: 'Agent registered successfully',
            agentId: user_id,
            agent: agentState
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

export default router;