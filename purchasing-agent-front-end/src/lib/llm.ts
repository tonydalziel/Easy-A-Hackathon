import OpenAI from 'openai';
import { Message, ToolCall } from '@/types';
import { tools } from './tools';

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
    toolCalls?: ToolCall[];
  };
  requiresPaymentAuth?: boolean;
  paymentDetails?: {
    amount: number;
    vendorId: string;
  };
}

/**
 * Call the LLM with conversation history and available tools
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

    console.log(`[LLM] Available tools: ${tools.map(t => t.name).join(', ')}`);

    const startTime = Date.now();
    
    // Make the API call with tool definitions
    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: openAIMessages,
      tools: tools.map(tool => ({
        type: 'function' as const,
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters,
        },
      })),
      tool_choice: 'auto',
    });

    const duration = Date.now() - startTime;
    console.log(`[LLM] API call completed in ${duration}ms`);
    console.log(`[LLM] Tokens used - Prompt: ${completion.usage?.prompt_tokens}, Completion: ${completion.usage?.completion_tokens}, Total: ${completion.usage?.total_tokens}`);

    const choice = completion.choices[0];
    const assistantMessage = choice.message;
    
    console.log(`[LLM] Finish reason: ${choice.finish_reason}`);

    // Handle tool calls if present
    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      console.log(`[LLM] Processing ${assistantMessage.tool_calls.length} tool call(s)`);
      const toolCalls: ToolCall[] = [];

      for (const toolCall of assistantMessage.tool_calls) {
        if (toolCall.type !== 'function') continue;
        
        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments);

        console.log(`[LLM] Executing tool: ${functionName}`);
        console.log(`[LLM] Tool arguments:`, functionArgs);

        // Execute the tool
        const result = await executeToolCall(functionName, functionArgs);
        
        console.log(`[LLM] Tool ${functionName} completed`);
        console.log(`[LLM] Tool result:`, result);

        toolCalls.push({
          id: toolCall.id,
          name: functionName,
          arguments: functionArgs,
          result,
        });
      }

      // Check if payment authorization is needed
      const needsPaymentAuth = toolCalls.some(
        tc => tc.name === 'setupPayment'
      );

      if (needsPaymentAuth) {
        const setupPaymentCall = toolCalls.find(
          tc => tc.name === 'setupPayment'
        );
        console.log('[LLM] Payment authorization required');
        return {
          message: {
            id: `msg-${Date.now()}`,
            role: 'assistant',
            content:
              assistantMessage.content ||
              `I need your authorization to make this payment of $${setupPaymentCall?.arguments.amount} to ${setupPaymentCall?.arguments.vendorId}. Please approve the payment request.`,
            timestamp: new Date(),
            toolCalls,
          },
          requiresPaymentAuth: true,
          paymentDetails: {
            amount: setupPaymentCall?.arguments.amount || 0,
            vendorId: setupPaymentCall?.arguments.vendorId || '',
          },
        };
      }

      // If we made tool calls, we need to get the final response from the LLM
      console.log('[LLM] Making follow-up API call with tool results');
      const toolResultMessages = toolCalls.map(tc => ({
        role: 'tool' as const,
        tool_call_id: tc.id,
        content: JSON.stringify(tc.result),
      }));

      const followUpStartTime = Date.now();
      
      const finalCompletion = await openai.chat.completions.create({
        model: MODEL,
        messages: [
          ...openAIMessages,
          {
            role: 'assistant',
            content: assistantMessage.content,
            tool_calls: assistantMessage.tool_calls,
          },
          ...toolResultMessages,
        ],
      });

      const followUpDuration = Date.now() - followUpStartTime;
      console.log(`[LLM] Follow-up API call completed in ${followUpDuration}ms`);
      console.log(`[LLM] Follow-up tokens used - Prompt: ${finalCompletion.usage?.prompt_tokens}, Completion: ${finalCompletion.usage?.completion_tokens}, Total: ${finalCompletion.usage?.total_tokens}`);

      return {
        message: {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content:
            finalCompletion.choices[0].message.content ||
            'I processed your request.',
          timestamp: new Date(),
          toolCalls,
        },
      };
    }

    // No tool calls, just return the message
    console.log('[LLM] No tool calls, returning direct response');
    return {
      message: {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content:
          assistantMessage.content ||
          "I'm here to help you search for and purchase products.",
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

/**
 * Execute a tool call based on the function name
 */
async function executeToolCall(
  functionName: string,
  args: any
): Promise<any> {
  console.log(`[LLM] Executing tool function: ${functionName}`);
  
  try {
    switch (functionName) {
      case 'searchProducts':
        const { searchProducts } = await import('./tools');
        return await searchProducts(args.searchTerms);

      case 'hasPaymentAccess':
        const { hasPaymentAccess } = await import('./tools');
        return await hasPaymentAccess(args.amount, args.vendorId);

      case 'setupPayment':
        const { setupPayment } = await import('./tools');
        return await setupPayment(args.amount, args.vendorId);

      case 'makePayment':
        const { makePayment } = await import('./tools');
        return await makePayment(args.amount, args.vendorId);

      default:
        console.error(`[LLM] Unknown tool requested: ${functionName}`);
        throw new Error(`Unknown tool: ${functionName}`);
    }
  } catch (error) {
    console.error(`[LLM] Error executing tool ${functionName}:`, error);
    throw error;
  }
}
