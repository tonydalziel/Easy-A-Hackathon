import { get } from 'http';
import OpenAI from 'openai';
import { agentConsideringPurchasePrompt } from './agentRouter';
import { AgentState } from './types';
const openai = new OpenAI();

const API_KEY = process.env.LLM_API_KEY || 'ollama';
const BASE_URL = process.env.LLM_API_URL || 'http://127.0.0.1:11434/v1';
const MODEL = process.env.LLM_MODEL || 'gemma3';

export const haveLLMConsiderPurchase = async (agentState: AgentState, itemState: ItemState): Promise<string> => {
    // Placeholder implementation
    // Call out to OLamma using OpenAI API module

    const prompt =  await agentConsideringPurchasePrompt(agentState, itemState);

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

    
    return response;
};