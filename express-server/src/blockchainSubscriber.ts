import algosdk, { Transaction } from 'algosdk';
import { getAlgorandClient, parseMessage, postResponseToChain, MessageType, processListingPayment } from './chain';
import { getLLMCompletion } from './llmService';

/**
 * Blockchain Subscriber Service
 * Monitors the wallet for incoming transactions and processes messages
 */
export class BlockchainSubscriber {
    private algodClient: algosdk.Algodv2;
    private walletAddress: string;
    private isRunning: boolean = false;
    private lastProcessedRound: number = 0;
    private pollIntervalMs: number = 5000; // Poll every 5 seconds

    constructor(walletAddress: string, pollIntervalMs: number = 5000) {
        this.walletAddress = walletAddress;
        this.pollIntervalMs = pollIntervalMs;

        // Get algod client from AlgorandClient
        const algorandClient = getAlgorandClient();
        this.algodClient = algorandClient.client.algod;
    }

    /**
     * Start the subscriber
     */
    async start(): Promise<void> {
        if (this.isRunning) {
            console.log('Subscriber is already running');
            return;
        }

        console.log(`Starting blockchain subscriber for wallet: ${this.walletAddress}`);
        this.isRunning = true;

        // Get the current round to start from
        const status = await this.algodClient.status().do();
        this.lastProcessedRound = Number(status.lastRound);
        console.log(`Starting from round: ${this.lastProcessedRound}`);

        // Start polling
        this.poll();
    }

    /**
     * Stop the subscriber
     */
    stop(): void {
        console.log('Stopping blockchain subscriber');
        this.isRunning = false;
    }

    /**
     * Poll for new transactions
     */
    private async poll(): Promise<void> {
        while (this.isRunning) {
            try {
                await this.checkForNewTransactions();
            } catch (error) {
                console.error('Error polling for transactions:', error);
            }

            // Wait before next poll
            await this.sleep(this.pollIntervalMs);
        }
    }

    /**
     * Check for new transactions to the wallet
     */
    private async checkForNewTransactions(): Promise<void> {
        try {
            // Get current status
            const status = await this.algodClient.status().do();
            const currentRound = Number(status.lastRound);

            // If no new rounds, return
            if (currentRound <= this.lastProcessedRound) {
                return;
            }

            console.log(`Checking rounds ${this.lastProcessedRound + 1} to ${currentRound}`);

            // Check each new round
            for (let round = this.lastProcessedRound + 1; round <= currentRound; round++) {
                await this.processRound(round);
            }

            this.lastProcessedRound = currentRound;
        } catch (error) {
            console.error('Error checking for new transactions:', error);
        }
    }

    /**
     * Process a specific round
     */
    private async processRound(round: number): Promise<void> {
        try {
            // Get block for the round
            const block = await this.algodClient.block(round).do();

            // Simplified block processing for testing
            console.log(`Processing round ${round} - mock implementation`);
            // In a real implementation, you would process transactions here
            // For now, we'll just log that we're monitoring
        } catch (error) {
            console.error(`Error processing round ${round}:`, error);
        }
    }

    /**
     * Process a single transaction
     */
    private async processTransaction(txn: any): Promise<void> {
        try {
            // Only process payment transactions to our wallet
            if (txn.txn?.type !== 'pay') {
                return;
            }

            const receiver = algosdk.encodeAddress(txn.txn.rcv);

            // Only process transactions sent to our wallet
            if (receiver !== this.walletAddress) {
                return;
            }

            // Get sender address
            const sender = algosdk.encodeAddress(txn.txn.snd);

            // Skip if sender is the wallet itself (our own transactions)
            if (sender === this.walletAddress) {
                return;
            }

            // Get transaction ID
            const txId = txn.txn.txID || '';

            // Parse the note field
            const note = txn.txn.note ? new Uint8Array(txn.txn.note) : undefined;
            const message = parseMessage(note, sender, txId);

            if (!message) {
                console.log(`Transaction ${txId} has no valid message`);
                return;
            }

            console.log(`\n📨 New message received from ${sender}:`);
            console.log(`  Type: ${message.type}`);
            console.log(`  Content: ${message.content}`);
            console.log(`  TxID: ${txId}`);

            // Process the message with LLM
            await this.processMessage(message);
            
            // Also check if this is a listing payment
            await this.checkListingPayment(sender, txn.txn.amt, txId);
        } catch (error) {
            console.error('Error processing transaction:', error);
        }
    }

    /**
     * Check if payment is for an active listing
     */
    private async checkListingPayment(sender: string, amount: number, txId: string): Promise<void> {
        try {
            console.log(`\n Checking listing payment: ${amount} microAlgos from ${sender}`);
            
            const result = await processListingPayment(sender, amount);
            
            if (result.includes('Listing closed')) {
                console.log('LISTING COMPLETED! Payment target reached!');
                // You can add notification logic here (webhook, email, etc.)
                await this.notifyListingCompleted(result);
            } else if (result.includes('Payment received')) {
                console.log(`Listing progress: ${result}`);
            } else {
                console.log('Payment not for active listing');
            }
        } catch (error) {
            console.log('Payment not for active listing or no listing open');
        }
    }

    /**
     * Notify when listing is completed
     */
    private async notifyListingCompleted(result: string): Promise<void> {
        try {
            // Post completion notification to chain
            await postResponseToChain('', MessageType.BID, `LISTING_COMPLETED: ${result}`);
            console.log('✅ Listing completion posted to blockchain');
            
            // You can add additional notifications here:
            // - Send webhook to your backend
            // - Send email notification
            // - Update database
            // - Trigger other business logic
        } catch (error) {
            console.error('Error notifying listing completion:', error);
        }
    }

    /**
     * Process a message and send response back to chain
     */
    private async processMessage(message: any): Promise<void> {
        try {
            // Get LLM completion
            console.log(`🤖 Getting LLM completion for message type: ${message.type}`);
            const llmResponse = await getLLMCompletion({ message });

            if (!llmResponse.success) {
                console.error(`Failed to get LLM completion: ${llmResponse.error}`);
                return;
            }

            console.log(`✅ LLM Response: ${llmResponse.content}`);

            // Post response back to the chain
            console.log(`📤 Posting response to blockchain...`);
            const responseTxId = await postResponseToChain(
                message.txId,
                message.type,
                llmResponse.content || 'No response content'
            );

            console.log(`✅ Response posted successfully! TxID: ${responseTxId}\n`);
        } catch (error) {
            console.error('Error processing message:', error);
        }
    }

    /**
     * Sleep utility
     */
    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

/**
 * Create and start a blockchain subscriber
 */
export async function startBlockchainSubscriber(walletAddress: string, pollIntervalMs: number = 5000): Promise<BlockchainSubscriber> {
    const subscriber = new BlockchainSubscriber(walletAddress, pollIntervalMs);
    await subscriber.start();
    return subscriber;
}
