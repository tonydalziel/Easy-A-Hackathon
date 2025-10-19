import { NextResponse } from 'next/server';
import { agentStore } from '@/lib/agentStore';
import { Agent } from '@/types/agent';

export const EXPRESS_SERVER_URL = process.env.EXPRESS_SERVER_URL || 'http://localhost:3000';
const DEFAULT_MODEL_ID = process.env.DEFAULT_MODEL_ID || 'gemma3';
const DEFAULT_PROVIDER_ID = process.env.DEFAULT_PROVIDER_ID || 'ollama';

// API endpoint to create a new agent with a prompt
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { prompt, model_id, provider_id } = body;

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt required' }, { status: 400 });
    }

    // Generate agent ID
    const agentId = `agent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Generate wallet credentials (in production, use proper crypto)
    const walletId = `wallet-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const walletPwd = Math.random().toString(36).substr(2, 15);

    // Create agent object
    const agent: Agent = {
      id: agentId,
      prompt: prompt.trim(),
      model_id: model_id || DEFAULT_MODEL_ID,
      provider_id: provider_id || DEFAULT_PROVIDER_ID,
      wallet_id: walletId,
      wallet_pwd: walletPwd,
      currentItemsAcquired: [],
      createdAt: Date.now(),
      status: 'active'
    };

    // Store agent in memory
    const storeResult = agentStore.createAgent(agent);

    if (!storeResult.success) {
      return NextResponse.json(
        { error: storeResult.message },
        { status: 409 }
      );
    }

    // Register agent with express-server (with blockchain funding)
    try {
      // Default: 1000 ALGO = 1,000,000,000 microALGO
      const initialWalletBalance = 1000000000;

      const expressResponse = await fetch(`${EXPRESS_SERVER_URL}/agents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider_id: agent.provider_id,
          model_id: agent.model_id,
          prompt: agent.prompt,
          user_id: agent.id, // Pass agent ID as user_id
          walletBalance: initialWalletBalance // Fund with 1000 ALGO
        })
      });

      if (!expressResponse.ok) {
        console.warn('Failed to register agent with express-server:', await expressResponse.text());
        // Continue anyway - agent is still created locally
      } else {
        const expressData = await expressResponse.json();
        console.log(`Agent ${agentId} registered with express-server`);

        // Update local agent with blockchain info
        if (expressData.agent) {
          agent.wallet_id = expressData.agent.wallet_id || agent.wallet_id;
          agent.walletBalance = expressData.agent.walletBalance || initialWalletBalance;
        }

        if (expressData.blockchainTxId) {
          console.log(`Agent funded on blockchain! Tx: ${expressData.blockchainTxId}`);
          agent.blockchainTxId = expressData.blockchainTxId;
        }

        // Update the agent in the store with blockchain info
        agentStore.createAgent(agent);
      }
    } catch (error) {
      console.error('Error calling express-server:', error);
      // Continue anyway - agent is still created locally
    }

    return NextResponse.json({
      success: true,
      agentId: agent.id,
      agent,
      message: 'Agent created successfully'
    });

  } catch (error) {
    console.error('Error creating agent:', error);
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  }
}
