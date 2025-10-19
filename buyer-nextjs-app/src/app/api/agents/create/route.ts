import { NextResponse } from 'next/server';
import { agentStore } from '@/lib/agentStore';
import { Agent } from '@/types/agent';

export const EXPRESS_SERVER_URL = process.env.EXPRESS_SERVER_URL || 'http://localhost:3000';
const DEFAULT_MODEL_ID = process.env.DEFAULT_MODEL_ID || 'qwen3:4b';
const DEFAULT_PROVIDER_ID = process.env.DEFAULT_PROVIDER_ID || 'ollama';

// API endpoint to create a new agent with a prompt
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { prompt, model_id, provider_id, user_wallet_id, walletBalance } = body;

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt required' }, { status: 400 });
    }

    if (!user_wallet_id) {
      return NextResponse.json({ error: 'User wallet ID required' }, { status: 400 });
    }

    if (!walletBalance || walletBalance <= 0) {
      return NextResponse.json({ error: 'Valid wallet balance required' }, { status: 400 });
    }

    // Generate agent ID
    const agentId = `agent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

	// Create agent object
    const agent: Agent = {
      id: agentId,
      prompt: prompt.trim(),
      model_id: model_id || DEFAULT_MODEL_ID,
      provider_id: provider_id || DEFAULT_PROVIDER_ID,
      wallet_id: "UNASSIGNED",
      wallet_pwd: "UNASSIGNED",
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
      // Use the wallet balance provided by the user (already in microALGO)
      const initialWalletBalance = walletBalance;

      const expressResponse = await fetch(`${EXPRESS_SERVER_URL}/agents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider_id: agent.provider_id,
          model_id: agent.model_id,
          prompt: agent.prompt,
          user_id: agent.id, // Pass agent ID as user_id
          user_wallet_id: user_wallet_id, // Pass user's wallet ID for blockchain funding
          walletBalance: initialWalletBalance // Fund with specified amount
        })
      });

      if (!expressResponse.ok) {
        console.warn('Failed to register agent with express-server:', await expressResponse.text());
        // Continue anyway - agent is still created locally
      } else {
        const expressData = await expressResponse.json();
        console.log(`Agent ${agentId} registered with express-server`);

		console.log('Express server response status:', expressData);

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
