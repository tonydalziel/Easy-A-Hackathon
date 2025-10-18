import { NextRequest, NextResponse } from 'next/server';
import { callLLM } from '@/lib/llm';

export async function POST(request: NextRequest) {
  try {
    const { messages, chatId } = await request.json();

    // Get the last user message
    const lastMessage = messages[messages.length - 1];

    // Call the actual LLM with conversation history
    const response = await callLLM(messages, lastMessage.content);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}
