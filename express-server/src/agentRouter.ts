// router for agent endpoints
import express, { Request, Response } from 'express';
import { postAgentToChain } from './chain';
import { AgentState, ItemState } from './types';
import { haveLLMConsiderPurchase } from './llms';

const router = express.Router();

// Example endpoint 
router.get('/status', (req: Request, res: Response) => {
    res.json({ status: 'Agent router is running' });
});

router.post('/', (req: Request, res: Response) => {
    // Agent atm consists of provider_id, model_id, prompt

    const { provider_id, model_id, prompt } = req.body;

    // postAgentToChain(provider_id, model_id, prompt);
    res.json({ message: 'Agent created successfully' });
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