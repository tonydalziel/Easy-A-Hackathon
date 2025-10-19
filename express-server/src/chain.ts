import { AlgorandClient, microAlgo, mnemonicAccount } from '@algorandfoundation/algokit-utils';
import { ItemState, AgentState } from './types';
import algosdk, { TransactionType, generateAccount, encodeAddress, secretKeyToMnemonic, mnemonicToSecretKey } from 'algosdk';
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
export async function postAgentToChain(sender: string, provider_id: string, model_id: string, prompt: string, walletBalance: number): Promise<{transactionId: string; wallet_id: string; wallet_mnemonic: string}> {
    if (!algorand) {
        throw new Error('Algorand client not initialized');
    }

    console.log(`💳 Funding from user wallet: ${sender}`);
    
    // Fetch merchant wallet information to get private key for signing
    let merchantResponse = await fetch(`http://localhost:3000/merchants/by-wallet/${sender}`);
    
    if (!merchantResponse.ok) {
        throw new Error('Failed to fetch merchant wallet information');
    }
    const merchantData = await merchantResponse.json();
    const { wallet_private_key: private_key } = merchantData.merchant;
    
    // Convert mnemonic to secret key and create signer
    const senderSecretKey = mnemonicToSecretKey(private_key);
    const signer = algosdk.makeBasicAccountTransactionSigner({
        addr: senderSecretKey.addr as any,
        sk: senderSecretKey.sk
    });
    
    // Create the new agent wallet
    const { wallet_id, account, mnemonic } = await getNewWallet();
    console.log(`✅ New agent wallet created: ${wallet_id}`);

    // Create agent data object
    const agentData: AgentState = {
        agent_id: '', // Will be set to transaction ID
        currentItemsAcquired: [],
        provider_id,
        model_id,
        prompt,
        wallet_id,
        wallet_pwd: mnemonic, // Store mnemonic so agent can sign transactions
        walletBalance,
    };

    // Encode agent data as note (must be base64 encoded)
    const noteData = new TextEncoder().encode(JSON.stringify(agentData));

    // Send payment from USER wallet to new agent wallet
    const result = await algorand.send.payment({
        sender: senderSecretKey.addr, // Address of the sender
        signer: signer, // Explicit signer
        receiver: account.addr, // New agent wallet address
        amount: microAlgo(walletBalance), // Fund the agent wallet
        note: noteData,
    });

    console.log(`✅ Agent wallet ${wallet_id} funded with ${walletBalance / 1000000} ALGO`);
    console.log(`✅ Agent metadata posted to blockchain. TX: ${result.txIds[0]}`);

    // Return the transaction ID, wallet_id, and mnemonic
    return {transactionId: result.txIds[0], wallet_id, wallet_mnemonic: mnemonic };
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
    // account.addr is already the Algorand address string (convert from Address type)
    const wallet_id = account.addr.toString();
    // Convert secret key to mnemonic for storage
    const mnemonic = secretKeyToMnemonic(account.sk);

    return {
        wallet_id,
        address: wallet_id,
        account,
        mnemonic
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
 * Open a listing on the smart contract - deploys a NEW contract instance for each item
 * @param targetWallet - The wallet address that will receive funds
 * @param targetAmount - The target amount in microAlgos
 * @param deployerAddress - Address to deploy contract
 * @param deployerPrivateKey - Private key for deployment
 * @returns Object containing the listing message, appId, and appAddress
 */
export async function openListingOnChain(
    targetWallet: string, 
    targetAmount: number,
    deployerAddress?: string,
    deployerPrivateKey?: Uint8Array
): Promise<{ message: string; appId: number; appAddress: string }> {
    if (!algorand) {
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
            console.log(`🔷 Deploying NEW contract instance for this item with merchant: ${deployerAddress}`);
        } else {
            // Fallback to environment deployer (for testing)
            deployerAccount = await algorand.account.fromEnvironment('DEPLOYER');
            console.log(`🔷 Deploying NEW contract instance with DEPLOYER: ${deployerAccount.addr}`);
        }

        // Create factory - each item gets its own contract instance
        const factory = new ChAiNFactory({
            algorand: algorand,
            defaultSender: deployerAccount.addr,
        });

        // CREATE a brand new contract instance for this listing (not deploy which may reuse)
        console.log(`📝 Creating NEW ChAiN contract instance for this item...`);
        const { appClient: newAppClient, result } = await factory.send.create.bare({});

        const newContractAppId = Number(newAppClient.appId);
        
        console.log(`✅ New contract created!`);
        console.log(`   App ID: ${newContractAppId}`);
        console.log(`   App Address: ${newAppClient.appAddress}`);

        // Now open the listing on this new contract
        const response = await newAppClient.send.openListing({
            args: { 
                targetWallet,
                targetAmount: targetAmount.toString()
            }
        });

        console.log(`✅ Listing opened on new contract: ${response.return}`);
        
        return {
            message: response.return || 'Listing opened',
            appId: newContractAppId,
            appAddress: newAppClient.appAddress.toString()
        };
    } catch (error) {
        console.error('Failed to deploy contract and open listing:', error);
        throw error;
    }
}

/**
 * Process a payment through a SPECIFIC smart contract instance
 * @param appId - The app ID of the contract for this specific item
 * @param senderMnemonic - The mnemonic of the agent's wallet
 * @param amount - The payment amount
 */
export async function processListingPayment(appId: number, senderMnemonic: string, amount: number): Promise<string> {
    if (!algorand) {
        throw new Error('Algorand client not initialized');
    }

    try {
        // Import the generated client
        const { ChAiNFactory } = await import('../../algokit/ch_ai_n/projects/ch_ai_n/artifacts/ch_ai_n/ChAiNClient');

        // Reconstruct the agent's account from mnemonic
        const senderAccount = mnemonicToSecretKey(senderMnemonic);
        const algosdk = await import('algosdk');
        const signer = algosdk.makeBasicAccountTransactionSigner({
            addr: senderAccount.addr as any,
            sk: senderAccount.sk
        });

        // Create factory to get client for specific app
        const factory = new ChAiNFactory({
            algorand: algorand,
        });

        // Get client for the specific app instance
        const specificAppClient = factory.getAppClientById({ appId: BigInt(appId) });

        console.log(`💰 Processing payment on contract ${appId} from sender ${senderAccount.addr}...`);
        const response = await specificAppClient.send.processPayment({
            sender: senderAccount.addr,
            signer: signer, // Provide the signer with private key
            args: { 
                sender: senderAccount.addr.toString(), 
                amount: amount.toString() 
            }
        });

        console.log(`✅ Payment processed on contract ${appId}: ${response.return}`);
        return response.return || 'Payment processed';
    } catch (error) {
        console.error(`❌ Payment failed on contract ${appId}:`, error);
        throw error;
    }
}

/**
 * Get listing status from a specific smart contract instance
 * @param appId - The app ID of the contract
 * @param senderAddress - The address of the sender (optional, for read operations)
 * @param senderMnemonic - The mnemonic of the sender's wallet (optional, required if senderAddress is provided)
 */
export async function getListingStatusFromChain(appId: number, senderAddress?: string, senderMnemonic?: string): Promise<string> {
    if (!algorand) {
        throw new Error('Algorand client not initialized');
    }

    try {
        const { ChAiNFactory } = await import('../../algokit/ch_ai_n/projects/ch_ai_n/artifacts/ch_ai_n/ChAiNClient');

        const factory = new ChAiNFactory({
            algorand: algorand,
        });

        const specificAppClient = factory.getAppClientById({ appId: BigInt(appId) });

        let callSender: any;
        let signer: any = undefined;

        if (senderAddress && senderMnemonic) {
            // Use the provided sender with their mnemonic
            const senderAccount = mnemonicToSecretKey(senderMnemonic);
            
            signer = algosdk.makeBasicAccountTransactionSigner({
                addr: senderAccount.addr as any,
                sk: senderAccount.sk
            });
            // Use the Address object directly, not a string
            callSender = senderAccount.addr;
            console.log(`🔍 Using agent sender: ${algosdk.encodeAddress(senderAccount.addr.publicKey)}`);
        } else {
            // Use default deployer account
            const deployerAccount = await algorand.account.fromEnvironment('DEPLOYER');
            callSender = deployerAccount.addr;
            console.log(`🔍 Using DEPLOYER sender: ${deployerAccount.addr}`);
        }

        const response = await specificAppClient.send.getListingStatus({
            sender: callSender,
            signer: signer, // Provide signer if available
            args: {}
        });

        return response.return || 'Unknown status';
    } catch (error) {
        console.error(`Failed to get status from contract ${appId}:`, error);
        throw error;
    }
}
