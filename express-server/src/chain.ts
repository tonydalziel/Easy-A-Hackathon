import { AlgorandClient, microAlgo, mnemonicAccount } from '@algorandfoundation/algokit-utils';
import { ItemState, AgentState } from './types';
import algosdk, { TransactionType, generateAccount, encodeAddress } from 'algosdk';
import { AlgoAmount } from '@algorandfoundation/algokit-utils/types/amount';

const SENDER_ADDR = process.env.SENDER_ADDR || '';

// Initialize Algorand client with error handling
let algorand: AlgorandClient | null = null;

try {
    algorand = AlgorandClient.fromEnvironment();
    console.log('✅ Algorand client initialized successfully');
} catch (error) {
    console.error('⚠️  Failed to initialize Algorand client:', error instanceof Error ? error.message : error);
    console.error('⚠️  Blockchain features will be disabled. Server will continue without Algorand integration.');
}

// Export function to get Algorand client (required by blockchainSubscriber)
export function getAlgorandClient(): AlgorandClient {
    if (!algorand) {
        throw new Error('Algorand client not initialized. Check environment configuration.');
    }
    return algorand;
}

// Message types that can be received on the blockchain
export enum MessageType {
    BID = 'BID',
    ASK = 'ASK',
    BUY = 'BUY',
    SELL = 'SELL',
    QUERY = 'QUERY',
    RESPONSE = 'RESPONSE',
    UNKNOWN = 'UNKNOWN'
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

export async function transferIntoWallet(wallet_id: string, sender_addr: string, amount: number, prompt: string): Promise<string> {
    if (!algorand) {
        throw new Error('Algorand client not initialized');
    }

    let merchantResponse = await fetch(`http://localhost:3000/merchants/by-wallet/${sender_addr}`);

    console.log(`Sender ${sender_addr}`);
    if (!merchantResponse.ok) {
        throw new Error('Failed to fetch merchant wallet information');
    }
    const merchantData = await merchantResponse.json();
    const { wallet_address, wallet_private_key: private_key } = merchantData.merchant;

    const senderMnemonic = private_key;

    console.log(senderMnemonic);
    // Create account from mnemonic to sign the transaction
    const senderAccount = mnemonicAccount(senderMnemonic);

    const result = await algorand.send.payment({
        sender: senderAccount.addr,
        receiver: wallet_id, // Send to the new agent wallet
        amount: (amount).microAlgo(), // Convert to microAlgos
        note: prompt,
    });

    console.log(`💰 Transferred ${amount / 1000000} ALGO to wallet ${wallet_id}`);
    return result.txIds[0];
};

/**
 * Post agent information to the chain using a payment transaction with note field
 */
export async function postAgentToChain(sender: string, provider_id: string, model_id: string, prompt: string, walletBalance: number): Promise<{transactionId: string; wallet_id: string}> {
    if (!algorand) {
        throw new Error('Algorand client not initialized');
    }

    // Fetch merchant information by wallet address

    console.log(sender);
    let merchantResponse = await fetch(`http://localhost:3000/merchants/by-wallet/${sender}`);

    if (!merchantResponse.ok) {
        console.error(`Failed to fetch merchant wallet information for sender: ${sender}`);
        console.error('Response status:', merchantResponse.status);
        console.error('Response body:', await merchantResponse.text());
        throw new Error('Failed to fetch merchant wallet information');
    }
    const merchantData = await merchantResponse.json();
    const { wallet_private_key: private_key } = merchantData.merchant;

    const senderMnemonic = private_key;

    // Create account from mnemonic to sign transactions
    const senderAccount = algorand.account.fromMnemonic(senderMnemonic);

    const { wallet_id, account } = await getNewWallet();
    console.log(`New agent wallet created: ${wallet_id}`);

    //await transferIntoWallet(wallet_id, sender, walletBalance, prompt);

    // Create agent data object
    const agentData: AgentState = {
        agent_id: '', // Will be set to transaction ID
        currentItemsAcquired: [],
        provider_id,
        model_id,
        prompt,
        wallet_id,
        wallet_pwd: '', // Not used in this context
        walletBalance,
    };

    // Encode agent data as note (must be base64 encoded)
    const noteData = new TextEncoder().encode(JSON.stringify(agentData));

    // Send a payment transaction with the agent data in the note field
    const result = await algorand.send.payment({
        sender: senderAccount.addr, // Use mnemonic account to sign
        receiver: account.addr, // Send to self to just store data
        amount: microAlgo(walletBalance), // Minimum amount
        note: noteData,
    });

    console.log(`✅ Agent metadata posted to blockchain. TX: ${result.txIds[0]}`);

    // Return the transaction ID as the agent_id
    return {transactionId: result.txIds[0], wallet_id };
}

/**
 * Post a response to the chain
 */
export async function postResponseToChain(originalTxId: string, messageType: MessageType, response: string) {
    if (!algorand) {
        throw new Error('Algorand client not initialized');
    }

    // Get or create account from environment
    const sender = await algorand.account.fromEnvironment('SENDER_ACCOUNT');

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

        if (messageType !== MessageType.UNKNOWN) {
            throw new Error('Not a valid message');
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
async function getNewWallet() {
    // Generate a new wallet using Algorand SDK
    const account = generateAccount();
    console.log(account);
    // Convert the public key bytes to an Algorand address string
    const wallet_id = encodeAddress(account.addr.publicKey);

    return {
        wallet_id,
        address: wallet_id,
        account
    };
}

// Smart contract integration functions
let appClient: any = null;
let appFactory: any = null;
let contractAppId: number | null = null;

/**
 * Initialize smart contract client with a specific deployer account
 * @param deployerAddress - The address of the account that will deploy the contract
 * @param deployerPrivateKey - The private key of the deployer account (optional, uses KMD if not provided)
 */
export async function initializeSmartContract(deployerAddress?: string, deployerPrivateKey?: Uint8Array) {
    if (!algorand) {
        console.error('Algorand client not initialized');
        throw new Error('Algorand client not initialized');
    }

    try {
        // Import the generated client
        const { ChAiNFactory } = await import('../../algokit/ch_ai_n/projects/ch_ai_n/artifacts/ch_ai_n/ChAiNClient');

        let deployerAccount;
        
        if (deployerAddress && deployerPrivateKey) {
            // Use provided merchant account
            const algosdk = await import('algosdk');
            deployerAccount = {
                addr: deployerAddress,
                signer: algosdk.makeBasicAccountTransactionSigner({
                    addr: deployerAddress as any,
                    sk: deployerPrivateKey
                })
            };
            console.log(`Using merchant account as deployer: ${deployerAddress}`);
        } else {
            // Fallback to environment deployer (for testing)
            deployerAccount = await algorand.account.fromEnvironment('DEPLOYER');
            console.log(`Using DEPLOYER account: ${deployerAccount.addr}`);
        }

        // Create factory with algorand client (v9 uses 'algorand' not 'algorandClient')
        const factory = new ChAiNFactory({
            algorand: algorand,
            defaultSender: deployerAccount.addr,
        });

        appFactory = factory;

        // Deploy or get existing contract
        const { result, appClient: client } = await factory.deploy({
            onUpdate: 'append',
            onSchemaBreak: 'append',
            deployTimeParams: {},
        });

        appClient = client;
        contractAppId = Number(appClient.appId);
        
        console.log('✅ Smart contract initialized');
        console.log(`   App ID: ${contractAppId}`);
        console.log(`   App Address: ${appClient.appAddress}`);
        
        return client;
    } catch (error) {
        console.error('Failed to initialize smart contract:', error);
        throw error;
    }
}

/**
 * Get smart contract information
 */
export function getSmartContractInfo() {
    if (!appClient) {
        return {
            initialized: false,
            appId: null,
            appAddress: null,
        };
    }

    return {
        initialized: true,
        appId: contractAppId,
        appAddress: appClient.appAddress,
        appName: 'ChAiN',
    };
}

/**
 * Open a listing on the smart contract
 * @param targetWallet - The wallet address that will receive funds
 * @param targetAmount - The target amount in microAlgos
 * @param deployerAddress - Optional: Address to deploy contract if not yet deployed
 * @param deployerPrivateKey - Optional: Private key for deployment
 */
export async function openListingOnChain(
    targetWallet: string, 
    targetAmount: number,
    deployerAddress?: string,
    deployerPrivateKey?: Uint8Array
): Promise<string> {
    if (!appClient) {
        await initializeSmartContract(deployerAddress, deployerPrivateKey);
    }

    const response = await appClient.send.openListing({
        args: { 
            targetWallet,
            targetAmount: targetAmount.toString()
        }
    });

    console.log('✅ Listing opened on chain:', response.return);
    return response.return;
}

/**
 * Process a payment through the smart contract
 */
export async function processListingPayment(sender: string, amount: number): Promise<string> {
    if (!appClient) {
        await initializeSmartContract();
    }

    try {
        const response = await appClient.send.processPayment({
            args: { sender, amount }
        });

        console.log('Payment processed:', response.return);
        return response.return;
    } catch (error) {
        console.log('Payment not for active listing or no listing open');
        return 'No active listing';
    }
}

/**
 * Get listing status from smart contract
 */
export async function getListingStatusFromChain(): Promise<string> {
    if (!appClient) {
        await initializeSmartContract();
    }

    const response = await appClient.send.getListingStatus({
        args: {}
    });

    return response.return;
}
