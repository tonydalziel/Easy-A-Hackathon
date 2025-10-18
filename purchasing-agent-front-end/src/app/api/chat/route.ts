import { NextRequest, NextResponse } from 'next/server';
import { searchProducts, hasPaymentAccess, setupPayment, makePayment, tools } from '@/lib/tools';
import { Message, ToolCall } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const { messages, chatId } = await request.json();

    // Get the last user message
    const lastMessage = messages[messages.length - 1];

    // TODO: Replace this with actual LLM API call
    // For now, we'll create a simple mock response that demonstrates tool calling
    const response = await mockLLMResponse(lastMessage.content, messages);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}

// Mock LLM response with tool calling
async function mockLLMResponse(userMessage: string, conversationHistory: Message[]) {
  const lowerMessage = userMessage.toLowerCase();

  // Simple keyword-based tool detection (replace with actual LLM)
  if (lowerMessage.includes('search') || lowerMessage.includes('find') || lowerMessage.includes('look for')) {
    // Extract search terms (simple implementation)
    const searchTerms = extractSearchTerms(userMessage);

    const products = await searchProducts(searchTerms);

    const toolCall: ToolCall = {
      id: `tool-${Date.now()}`,
      name: 'searchProducts',
      arguments: { searchTerms },
      result: products
    };

    const responseMessage = `I found ${products.length} products:\n\n${products
      .map(p => `- **${p.name}**: $${p.price} (Vendor: ${p.vendorId})`)
      .join('\n')}\n\nWould you like to purchase any of these?`;

    return {
      message: {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: responseMessage,
        timestamp: new Date(),
        toolCalls: [toolCall]
      }
    };
  }

  if (lowerMessage.includes('buy') || lowerMessage.includes('purchase')) {
    // Mock payment flow
    const amount = extractAmount(userMessage) || 100;
    const vendorId = extractVendorId(userMessage) || 'vendor-0';

    const hasAccess = await hasPaymentAccess(amount, vendorId);

    if (!hasAccess) {
      const authorization = await setupPayment(amount, vendorId);

      const toolCall: ToolCall = {
        id: `tool-${Date.now()}`,
        name: 'setupPayment',
        arguments: { amount, vendorId },
        result: authorization
      };

      return {
        message: {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: `I need your authorization to make this payment of $${amount} to ${vendorId}. Please approve the payment request.`,
          timestamp: new Date(),
          toolCalls: [toolCall]
        },
        requiresPaymentAuth: true,
        paymentDetails: { amount, vendorId }
      };
    } else {
      const payment = await makePayment(amount, vendorId);

      const toolCall: ToolCall = {
        id: `tool-${Date.now()}`,
        name: 'makePayment',
        arguments: { amount, vendorId },
        result: payment
      };

      return {
        message: {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: payment.success
            ? `Payment of $${amount} to ${vendorId} was successful! Transaction ID: ${payment.transactionId}`
            : `Payment failed: ${payment.error}`,
          timestamp: new Date(),
          toolCalls: [toolCall]
        }
      };
    }
  }

  // Default response
  return {
    message: {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content: `I'm a purchasing agent. I can help you:\n- Search for products\n- Check prices\n- Make purchases on your behalf\n\nJust ask me to search for something or buy a product!`,
      timestamp: new Date()
    }
  };
}

// Helper functions to extract information from messages
function extractSearchTerms(message: string): string[] {
  // Simple extraction - remove common words
  const words = message
    .toLowerCase()
    .replace(/search|find|look for|show me|get me/gi, '')
    .split(/\s+/)
    .filter(word => word.length > 2);

  return words.slice(0, 3); // Take first 3 words as search terms
}

function extractAmount(message: string): number | null {
  const match = message.match(/\$?(\d+(\.\d{2})?)/);
  return match ? parseFloat(match[1]) : null;
}

function extractVendorId(message: string): string | null {
  const match = message.match(/vendor[:-]?\s*(\w+)/i);
  return match ? match[1] : null;
}
