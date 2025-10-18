import { get } from 'http';
import OpenAI from 'openai';
import { AgentState, ItemState } from './types';
const openai = new OpenAI();

const API_KEY = process.env.LLM_API_KEY || 'ollama';
const BASE_URL = process.env.LLM_API_URL || 'http://127.0.0.1:11434/v1';
const MODEL = process.env.LLM_MODEL || 'gemma3';



async function getLlmResponse<T>(prompt: string): Promise<T> {
    const response = await openai.chat.completions.create({
        model: MODEL,
        messages: [{ role: 'user', content: prompt }],
    });
    return response.choices[0].message.content as T;
}

export const registerPurchaseIntent = (wallet_id: string, item_id: string, price: number): Promise<number> => {
    // Placeholder implementation
    console.log(`Registered purchase intent for wallet ${wallet_id} to buy item ${item_id} at price $${price}`);
    return Promise.resolve(Date.now());
}

export const agentConsideringPurchasePrompt = (agentState: AgentState, walletBalance: number, itemState: ItemState): string => {
    const BUY_CODE = 'BUY';
    const IGNORE_OFFER_CODE = 'IGNORE';
    let prompt = `You are an autonomous agent with the following goal: ${agentState.prompt}.
    You have already acquired the following items: ${agentState.currentItemsAcquired.join(', ')}.
    Your current wallet balance is $${walletBalance}.
    You are considering purchasing a new item: ${itemState.name}.
    Decide whether to purchase the item or ignore the offer.
    Respond with only one of the following codes: ${BUY_CODE} to purchase the item or ${IGNORE_OFFER_CODE} to skip purchasing.
    `
    return prompt;
};

export const agentSpecifyingUpperBoundPrompt = (agentState: AgentState, itemState: ItemState, walletBalance: number): string => {
    let prompt = `You are an autonomous agent with the following goal: ${agentState.prompt}.
    You have already acquired the following items: ${agentState.currentItemsAcquired.join(', ')}.
    Your current wallet balance is $${walletBalance}. 
    
    The following item is for sale:
    Item Name: ${itemState.name}
    Item Price: $${itemState.price}

    What is the maximum amount you are willing to pay for the item? Respond with a single numerical value only.`;
    
    return prompt;
}

export const haveLLMConsiderPurchase = async (agentState: AgentState, itemState: ItemState): Promise<number|null> => {
    // Placeholder implementation
    // Call out to OLamma using OpenAI API module

    let walletBalance: number = await getBalanceForWallet(agentState.wallet_id);

    const prompt = await agentConsideringPurchasePrompt(agentState, walletBalance, itemState);

    const openAIMessages = [
        {
            role: 'system',
            content: prompt
        }
    ];

    const response = await openai.chat.completions.create({
        model: MODEL,
        messages: openAIMessages,
        max_tokens: 100,
        temperature: 0.7,
    });


    switch (response.choices[0].message.content.trim()) {
        case 'BUY':
            let price = await getLlmResponse<number>(agentSpecifyingUpperBoundPrompt(agentState, itemState, walletBalance));

            const id = await registerPurchaseIntent(agentState.wallet_id, itemState.id, price);
            return id;
        case 'IGNORE':
            return null;
        default:
            return null;
    }
}

function getBalanceForWallet(wallet_addr: any): number {
    throw new Error('Function not implemented.');
}
