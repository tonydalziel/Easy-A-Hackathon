// router for agent endpoints
import express, { Request, Response } from 'express';
import { postAgentToChain } from './chain';
import { AgentState, ItemState } from './types';

const router = express.Router();

export const agentConsideringPurchasePrompt = (agentState: AgentState, itemState: ItemState): string => {
    const BUY_CODE = 'BUY';
    const IGNORE_OFFER_CODE = 'IGNORE'; 1
    let prompt = `You are an autonomous agent with the following goal: ${agentState.prompt}.
    You have already acquired the following items: ${agentState.currentItemsAcquired.join(', ')}.
    Your current wallet balance is $${agentState.walletBalance}.
    You are considering purchasing a new item: ${itemState.name}.
    Decide whether to purchase the item or ignore the offer.
    Respond with only one of the following codes: ${BUY_CODE} to purchase the item or ${IGNORE_OFFER_CODE} to skip purchasing.
    `
    return prompt;
};

export const agentSpecifyingUpperBoundPrompt = (itemState: AgentState): string => {
    let prompt = `You are an autonomous agent with the following goal: ${itemState.prompt}.
    You have already acquired the following items: ${itemState.currentItemsAcquired.join(', ')}.
    Your current wallet balance is $${itemState.walletBalance}. What is the maximum amount you are willing to pay for the next item you consider purchasing? Respond with a single numerical value only.`;
    
    return prompt;
}

// Example endpoint 
router.get('/status', (req: Request, res: Response) => {
    res.json({ status: 'Agent router is running' });
});

export const agentSpecifiyingPurchaseUpperBoundPrompt = (itemState: AgentState): string => {

};

router.post('/', (req: Request, res: Response) => {
    // Agent atm consists of provider_id, model_id, prompt

    const { provider_id, model_id, prompt } = req.body;

    postAgentToChain(provider_id, model_id, prompt);
    res.json({ message: 'Agent created successfully' });
});

export default router;