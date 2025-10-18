import { AlgorandClient } from '@algorandfoundation/algokit-utils';
import { TransactionType } from 'algosdk';
import

// Initialize Algorand client
const algorand = AlgorandClient.fromEnvironment();

// Message types that can be received on the blockchain
export enum MessageType {
    BID = 'BID',
    ASK = 'ASK'
}

// Interface for blockchain messages
export interface BlockchainMessage {
    type: MessageType;
    content: string;
    sender: string;
    timestamp: number;
    txId: string;
}

// Interface for response data
export interface ResponseData {
    originalTxId: string;
    messageType: MessageType;
    response: string;
    timestamp: number;
}

/**
 * Post agent information to the chain using a payment transaction with note field
 */
export async function postAgentToChain(provider_id: string, model_id: string, prompt: string) {
    // Get or create account from environment
    const sender = algorand.account.fromEnvironment('SENDER_ACCOUNT');

    // Create agent data object
    const agentData: AgentData = {
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

/**
 * Post a response to the chain
 */
export async function postResponseToChain(originalTxId: string, messageType: MessageType, response: string) {
    // Get or create account from environment
    const sender = algorand.account.fromEnvironment('SENDER_ACCOUNT');

    // Create response data object
    const responseData: ResponseData = {
        originalTxId,
        messageType,
        response,
        timestamp: Date.now()
    };

    // Encode response data as note
    const noteData = new TextEncoder().encode(JSON.stringify(responseData));

    // Send a payment transaction with the response data in the note field
    const result = await algorand.send.payment({
        sender: sender.addr,
        receiver: sender.addr, // Send to self to just store data
        amount: (0).microAlgo(), // Minimum amount
        note: noteData,
    });

    console.log(`Response posted to chain. TxID: ${result.txIds[0]}`);
    return result.txIds[0];
}

/**
 * Parse a message from transaction note field
 */
export function parseMessage(note: Uint8Array | undefined, sender: string, txId: string): BlockchainMessage | null {
    if (!note || note.length === 0) {
        return null;
    }

    try {
        // Decode the note data
        const noteString = new TextDecoder().decode(note);
        const data = JSON.parse(noteString);

        // Check if this is a message (not an agent registration or response)
        if (data.type && Object.values(MessageType).includes(data.type)) {
            return {
                type: data.type as MessageType,
                content: data.content || noteString,
                sender,
                timestamp: data.timestamp || Date.now(),
                txId
            };
        }

        // Try to detect message type from content
        const upperContent = noteString.toUpperCase();
        let messageType = MessageType.UNKNOWN;

        if (upperContent.includes('BUY')) {
            messageType = MessageType.BUY;
        } else if (upperContent.includes('SELL')) {
            messageType = MessageType.SELL;
        } else if (upperContent.includes('QUERY') || upperContent.includes('?')) {
            messageType = MessageType.QUERY;
        }

        return {
            type: messageType,
            content: noteString,
            sender,
            timestamp: Date.now(),
            txId
        };
    } catch (error) {
        console.error('Error parsing message:', error);
        return null;
    }
}
