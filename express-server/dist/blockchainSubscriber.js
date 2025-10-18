"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlockchainSubscriber = void 0;
exports.startBlockchainSubscriber = startBlockchainSubscriber;
const algosdk_1 = __importDefault(require("algosdk"));
const chain_1 = require("./chain");
const llmService_1 = require("./llmService");
/**
 * Blockchain Subscriber Service
 * Monitors the wallet for incoming transactions and processes messages
 */
class BlockchainSubscriber {
    constructor(walletAddress, pollIntervalMs = 5000) {
        this.isRunning = false;
        this.lastProcessedRound = 0;
        this.pollIntervalMs = 5000; // Poll every 5 seconds
        this.walletAddress = walletAddress;
        this.pollIntervalMs = pollIntervalMs;
        // Get algod client from AlgorandClient
        const algorandClient = (0, chain_1.getAlgorandClient)();
        this.algodClient = algorandClient.client.algod;
    }
    /**
     * Start the subscriber
     */
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isRunning) {
                console.log('Subscriber is already running');
                return;
            }
            console.log(`Starting blockchain subscriber for wallet: ${this.walletAddress}`);
            this.isRunning = true;
            // Get the current round to start from
            const status = yield this.algodClient.status().do();
            this.lastProcessedRound = status['last-round'];
            console.log(`Starting from round: ${this.lastProcessedRound}`);
            // Start polling
            this.poll();
        });
    }
    /**
     * Stop the subscriber
     */
    stop() {
        console.log('Stopping blockchain subscriber');
        this.isRunning = false;
    }
    /**
     * Poll for new transactions
     */
    poll() {
        return __awaiter(this, void 0, void 0, function* () {
            while (this.isRunning) {
                try {
                    yield this.checkForNewTransactions();
                }
                catch (error) {
                    console.error('Error polling for transactions:', error);
                }
                // Wait before next poll
                yield this.sleep(this.pollIntervalMs);
            }
        });
    }
    /**
     * Check for new transactions to the wallet
     */
    checkForNewTransactions() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Get current status
                const status = yield this.algodClient.status().do();
                const currentRound = status['last-round'];
                // If no new rounds, return
                if (currentRound <= this.lastProcessedRound) {
                    return;
                }
                console.log(`Checking rounds ${this.lastProcessedRound + 1} to ${currentRound}`);
                // Check each new round
                for (let round = this.lastProcessedRound + 1; round <= currentRound; round++) {
                    yield this.processRound(round);
                }
                this.lastProcessedRound = currentRound;
            }
            catch (error) {
                console.error('Error checking for new transactions:', error);
            }
        });
    }
    /**
     * Process a specific round
     */
    processRound(round) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Get block for the round
                const block = yield this.algodClient.block(round).do();
                if (!block.block || !block.block.txns) {
                    return;
                }
                // Process each transaction in the block
                for (const txn of block.block.txns) {
                    yield this.processTransaction(txn);
                }
            }
            catch (error) {
                console.error(`Error processing round ${round}:`, error);
            }
        });
    }
    /**
     * Process a single transaction
     */
    processTransaction(txn) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                // Only process payment transactions to our wallet
                if (((_a = txn.txn) === null || _a === void 0 ? void 0 : _a.type) !== 'pay') {
                    return;
                }
                const receiver = algosdk_1.default.encodeAddress(txn.txn.rcv);
                // Only process transactions sent to our wallet
                if (receiver !== this.walletAddress) {
                    return;
                }
                // Get sender address
                const sender = algosdk_1.default.encodeAddress(txn.txn.snd);
                // Skip if sender is the wallet itself (our own transactions)
                if (sender === this.walletAddress) {
                    return;
                }
                // Get transaction ID
                const txId = txn.txn.txID || '';
                // Parse the note field
                const note = txn.txn.note ? new Uint8Array(txn.txn.note) : undefined;
                const message = (0, chain_1.parseMessage)(note, sender, txId);
                if (!message) {
                    console.log(`Transaction ${txId} has no valid message`);
                    return;
                }
                console.log(`\n📨 New message received from ${sender}:`);
                console.log(`  Type: ${message.type}`);
                console.log(`  Content: ${message.content}`);
                console.log(`  TxID: ${txId}`);
                // Process the message with LLM
                yield this.processMessage(message);
            }
            catch (error) {
                console.error('Error processing transaction:', error);
            }
        });
    }
    /**
     * Process a message and send response back to chain
     */
    processMessage(message) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Get LLM completion
                console.log(`🤖 Getting LLM completion for message type: ${message.type}`);
                const llmResponse = yield (0, llmService_1.getLLMCompletion)({ message });
                if (!llmResponse.success) {
                    console.error(`Failed to get LLM completion: ${llmResponse.error}`);
                    return;
                }
                console.log(`✅ LLM Response: ${llmResponse.content}`);
                // Post response back to the chain
                console.log(`📤 Posting response to blockchain...`);
                const responseTxId = yield (0, chain_1.postResponseToChain)(message.txId, message.type, llmResponse.content);
                console.log(`✅ Response posted successfully! TxID: ${responseTxId}\n`);
            }
            catch (error) {
                console.error('Error processing message:', error);
            }
        });
    }
    /**
     * Sleep utility
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
exports.BlockchainSubscriber = BlockchainSubscriber;
/**
 * Create and start a blockchain subscriber
 */
function startBlockchainSubscriber(walletAddress_1) {
    return __awaiter(this, arguments, void 0, function* (walletAddress, pollIntervalMs = 5000) {
        const subscriber = new BlockchainSubscriber(walletAddress, pollIntervalMs);
        yield subscriber.start();
        return subscriber;
    });
}
