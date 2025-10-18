//@ts-nocheck
import { get } from 'http';
import OpenAI from 'openai';
import { AgentState, ItemState } from './types';

const API_KEY = process.env.LLM_API_KEY || 'ollama';
const BASE_URL = process.env.LLM_API_URL || 'http://127.0.0.1:11434/v1';
const MODEL = process.env.LLM_MODEL || 'gemma3';


const openai = new OpenAI({
    apiKey: API_KEY,
    baseURL: BASE_URL
});

async function getLlmResponse<T>(prompt: string): Promise<T> {
    console.log('=== LLM API Call ===');
    console.log('Endpoint:', BASE_URL);
    console.log('Model:', MODEL);
    console.log('Prompt:', prompt);
    console.log('Timestamp:', new Date().toISOString());
    
    const response = await openai.chat.completions.create({
        model: MODEL,
        messages: [{ role: 'user', content: prompt }],
    });
    
    console.log('Response:', response.choices[0].message.content);
    console.log('===================\n');
    
    return response.choices[0].message.content as T;
}

export const registerPurchaseIntent = (wallet_id: string, item_id: string, price: number): Promise<number> => {
    // Placeholder implementation
    console.log(`Registered purchase intent for wallet ${wallet_id} to buy item ${item_id} at price $${price}`);
    return Promise.resolve(Date.now());
}

// Step 1: Get reasoning for purchase decision
export const agentConsideringPurchaseReasoningPrompt = (agentState: AgentState, walletBalance: number, itemState: ItemState): string => {
    let prompt = `You are an autonomous agent with the following goal: ${agentState.prompt}.
    You have already acquired the following items: ${agentState.currentItemsAcquired.join(', ')}.
    Your current wallet balance is $${walletBalance}.
    You are considering purchasing a new item: ${itemState.name} for $${itemState.price}.
    
    Think through whether you should purchase this item or ignore the offer. 
    Explain your reasoning process (in maximum 2 sentences) and come to a conclusion.`;
    
    return prompt;
};

// Step 2: Extract formatted decision from reasoning
export const agentConsideringPurchaseFormatPrompt = (reasoning: string): string => {
    let prompt = `Based on the following reasoning: "${reasoning}"
    
    Respond with exactly one word: either "BUY" if the decision is to purchase, or "IGNORE" if the decision is to not purchase.
    Respond with only the word, nothing else.`;
    
    return prompt;
};

// Step 1: Get reasoning for price decision
export const agentSpecifyingUpperBoundReasoningPrompt = (agentState: AgentState, itemState: ItemState, walletBalance: number): string => {
    let prompt = `You are an autonomous agent with the following goal: ${agentState.prompt}.
    You have already acquired the following items: ${agentState.currentItemsAcquired.join(', ')}.
    Your current wallet balance is $${walletBalance}. 
    
    The following item is for sale:
    Item Name: ${itemState.name}

    Think through what the maximum amount you are willing to pay for this item should be. 
    Explain your reasoning (in maximum two sentences) and come to a conclusion about the maximum price.`;

    return prompt;
}

// Step 2: Extract formatted price from reasoning
export const agentSpecifyingUpperBoundFormatPrompt = (reasoning: string): string => {
    let prompt = `Based on the following reasoning: "${reasoning}"
    
    Extract the maximum price amount as a single numerical value only. 
    Respond with just the number, no currency symbols or other text.`;
    
    return prompt;
}

export const haveLLMConsiderPurchase = async (agentState: AgentState, itemState: ItemState): Promise<number | null> => {
    console.log('\n🤖 === Starting LLM Purchase Consideration ===');
    console.log('Agent ID:', agentState.id);
    console.log('Item:', itemState.name, '($' + itemState.price + ')');
    
    let walletBalance: number = await getBalanceForWallet(agentState.wallet_id);
    console.log('Wallet Balance:', walletBalance);

    // Step 1: Get reasoning for purchase decision
    const reasoningPrompt = agentConsideringPurchaseReasoningPrompt(agentState, walletBalance, itemState);
    
    console.log('\n=== LLM API Call 1: Purchase Reasoning ===');
    console.log('Endpoint:', BASE_URL);
    console.log('Model:', MODEL);
    console.log('Prompt:', reasoningPrompt);
    console.log('Timestamp:', new Date().toISOString());

    const reasoningResponse = await openai.chat.completions.create({
        model: MODEL,
        messages: [{ role: 'user', content: reasoningPrompt }],
        max_tokens: 300,
        temperature: 0.7,
    });

    const reasoning = reasoningResponse.choices[0].message.content.trim();
    console.log('Reasoning:', reasoning);
    console.log('===================\n');

    // Step 2: Extract formatted decision
    const formatPrompt = agentConsideringPurchaseFormatPrompt(reasoning);
    
    console.log('=== LLM API Call 2: Format Decision ===');
    console.log('Endpoint:', BASE_URL);
    console.log('Model:', MODEL);
    console.log('Prompt:', formatPrompt);
    console.log('Timestamp:', new Date().toISOString());

    const formatResponse = await openai.chat.completions.create({
        model: MODEL,
        messages: [{ role: 'user', content: formatPrompt }],
        max_tokens: 10,
        temperature: 0.3,
    });

    const decision = formatResponse.choices[0].message.content.trim().toUpperCase();
    console.log('Decision Response:', decision);
    console.log('===================\n');

    switch (decision) {
        case 'BUY':
            console.log('✅ Agent decided to BUY - Getting price limit...');
            
            // Step 1: Get reasoning for price
            const priceReasoningPrompt = agentSpecifyingUpperBoundReasoningPrompt(agentState, itemState, walletBalance);
            
            console.log('\n=== LLM API Call 3: Price Reasoning ===');
            console.log('Endpoint:', BASE_URL);
            console.log('Model:', MODEL);
            console.log('Prompt:', priceReasoningPrompt);
            console.log('Timestamp:', new Date().toISOString());
            
            const priceReasoningResponse = await openai.chat.completions.create({
                model: MODEL,
                messages: [{ role: 'user', content: priceReasoningPrompt }],
                max_tokens: 300,
                temperature: 0.7,
            });
            
            const priceReasoning = priceReasoningResponse.choices[0].message.content.trim();
            console.log('Price Reasoning:', priceReasoning);
            console.log('===================\n');
            
            // Step 2: Extract formatted price
            const priceFormatPrompt = agentSpecifyingUpperBoundFormatPrompt(priceReasoning);
            
            console.log('=== LLM API Call 4: Format Price ===');
            console.log('Endpoint:', BASE_URL);
            console.log('Model:', MODEL);
            console.log('Prompt:', priceFormatPrompt);
            console.log('Timestamp:', new Date().toISOString());
            
            const priceFormatResponse = await openai.chat.completions.create({
                model: MODEL,
                messages: [{ role: 'user', content: priceFormatPrompt }],
                max_tokens: 20,
                temperature: 0.3,
            });
            
            const priceString = priceFormatResponse.choices[0].message.content.trim();
            console.log('Price Response:', priceString);
            console.log('===================\n');
            
            const price = parseFloat(priceString);
            console.log('Maximum price agent willing to pay:', price);

            const id = await registerPurchaseIntent(agentState.wallet_id, itemState.id, price);
            console.log('Purchase intent registered with ID:', id);
            console.log('=== Purchase Consideration Complete ===\n');
            return id;
        case 'IGNORE':
            console.log('❌ Agent decided to IGNORE the offer');
            console.log('=== Purchase Consideration Complete ===\n');
            return null;
        default:
            console.log('⚠️  Unexpected response from LLM:', decision);
            console.log('=== Purchase Consideration Complete ===\n');
            return null;
    }
}

function getBalanceForWallet(wallet_addr: any): number {
    return 1000;
}
