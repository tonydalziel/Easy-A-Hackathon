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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageType = void 0;
exports.postAgentToChain = postAgentToChain;
exports.postResponseToChain = postResponseToChain;
exports.parseMessage = parseMessage;
exports.getAlgorandClient = getAlgorandClient;
const algokit_utils_1 = require("@algorandfoundation/algokit-utils");
// Initialize Algorand client
const algorand = algokit_utils_1.AlgorandClient.fromEnvironment();
// Message types that can be received on the blockchain
var MessageType;
(function (MessageType) {
    MessageType["BUY"] = "BUY";
    MessageType["SELL"] = "SELL";
    MessageType["QUERY"] = "QUERY";
    MessageType["UNKNOWN"] = "UNKNOWN";
})(MessageType || (exports.MessageType = MessageType = {}));
/**
 * Post agent information to the chain using a payment transaction with note field
 */
function postAgentToChain(provider_id, model_id, prompt) {
    return __awaiter(this, void 0, void 0, function* () {
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
        const result = yield algorand.send.payment({
            sender: sender.addr,
            receiver: sender.addr, // Send to self to just store data
            amount: (0).microAlgo(), // Minimum amount
            note: noteData,
        });
        // Return the transaction ID as the agent_id
        return result.txIds[0];
    });
}
/**
 * Post a response to the chain
 */
function postResponseToChain(originalTxId, messageType, response) {
    return __awaiter(this, void 0, void 0, function* () {
        // Get or create account from environment
        const sender = algorand.account.fromEnvironment('SENDER_ACCOUNT');
        // Create response data object
        const responseData = {
            originalTxId,
            messageType,
            response,
            timestamp: Date.now()
        };
        // Encode response data as note
        const noteData = new TextEncoder().encode(JSON.stringify(responseData));
        // Send a payment transaction with the response data in the note field
        const result = yield algorand.send.payment({
            sender: sender.addr,
            receiver: sender.addr, // Send to self to just store data
            amount: (0).microAlgo(), // Minimum amount
            note: noteData,
        });
        console.log(`Response posted to chain. TxID: ${result.txIds[0]}`);
        return result.txIds[0];
    });
}
/**
 * Parse a message from transaction note field
 */
function parseMessage(note, sender, txId) {
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
                type: data.type,
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
        }
        else if (upperContent.includes('SELL')) {
            messageType = MessageType.SELL;
        }
        else if (upperContent.includes('QUERY') || upperContent.includes('?')) {
            messageType = MessageType.QUERY;
        }
        return {
            type: messageType,
            content: noteString,
            sender,
            timestamp: Date.now(),
            txId
        };
    }
    catch (error) {
        console.error('Error parsing message:', error);
        return null;
    }
}
/**
 * Get the Algorand client instance
 */
function getAlgorandClient() {
    return algorand;
}
