import { AlgorandClient } from '@algorandfoundation/algokit-utils';
import { TransactionType } from 'algosdk';

// Initialize Algorand client
const algorand = AlgorandClient.fromEnvironment();

/**
 * Post agent information to the chain using a payment transaction with note field
 */
export async function postAgentToChain(provider_id: string, model_id: string, prompt: string) {
    // Get or create account from environment
    const sender = algorand.account.fromEnvironment('SENDER_ACCOUNT');

    // Create agent data object
    const agentData = {
        provider_id,
        model_id,
        prompt,
        timestamp: Date.now()
    };

    // Encode agent data as note (must be base64 encoded)
    const noteData = new TextEncoder().encode(JSON.stringify(agentData));

    // Send a payment transaction with the agent data in the note field
    const result = await algorand.send.payment({
        sender: sender.addr,
        receiver: sender.addr, // Send to self to just store data
        amount: (0).microAlgo(), // Minimum amount
        note: noteData,
    });

    // Return the transaction ID as the agent_id
    return result.txIds[0];
}

