import OpenAI from 'openai';
import { Message } from '@/types';

// Initialize OpenAI client with environment variables
const openai = new OpenAI({
  apiKey: process.env.LLM_API_KEY || 'ollama',
  baseURL: process.env.LLM_API_URL || 'http://127.0.0.1:11434/v1',
});

const MODEL = process.env.LLM_MODEL || 'gemma2';

console.log('[LLM] Initialized with config:', {
  baseURL: process.env.LLM_API_URL || 'http://127.0.0.1:11434/v1',
  model: MODEL,
  hasApiKey: !!(process.env.LLM_API_KEY),
});

export interface LLMResponse {
  message: {
    id: string;
    role: 'assistant';
    content: string;
    timestamp: Date;
  };
}

/**
 * Call the LLM with conversation history - simplified version without tool calling
 */
export async function callLLM(
  messages: Message[],
  userMessage: string
): Promise<LLMResponse> {
  try {
    console.log('[LLM] Starting API call...');
    console.log(`[LLM] Model: ${MODEL}`);
    console.log(`[LLM] Base URL: ${process.env.LLM_API_URL}`);
    console.log(`[LLM] Message count: ${messages.length}`);
    console.log(`[LLM] User message: "${userMessage}"`);
    
    // Convert messages to OpenAI format
    const openAIMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.content,
    }));

    const startTime = Date.now();
    
    // Make the API call - simple chat completion without tools
    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: openAIMessages,
      temperature: 0.7,
      max_tokens: 2000,
    });

    const duration = Date.now() - startTime;
    console.log(`[LLM] API call completed in ${duration}ms`);
    console.log(`[LLM] Tokens used - Prompt: ${completion.usage?.prompt_tokens}, Completion: ${completion.usage?.completion_tokens}, Total: ${completion.usage?.total_tokens}`);

    const choice = completion.choices[0];
    const assistantMessage = choice.message;
    
    console.log(`[LLM] Finish reason: ${choice.finish_reason}`);
    console.log(`[LLM] Response: ${assistantMessage.content?.substring(0, 100)}...`);

    return {
      message: {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content:
          assistantMessage.content ||
          "I'm here to help you with your purchasing needs.",
        timestamp: new Date(),
      },
    };
  } catch (error) {
    console.error('[LLM] Error calling LLM:', error);
    if (error instanceof Error) {
      console.error('[LLM] Error message:', error.message);
      console.error('[LLM] Error stack:', error.stack);
    }
    throw new Error('Failed to get response from LLM');
  }
}
