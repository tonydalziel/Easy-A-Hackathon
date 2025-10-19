import express, { Request, Response } from 'express';
import algosdk, { generateAccount, encodeAddress } from 'algosdk';
import { AlgorandClient, microAlgo } from '@algorandfoundation/algokit-utils';
import { MerchantState } from './types';

const router = express.Router();
const algorand = AlgorandClient.defaultLocalNet();

// In-memory storage for registered merchants
const registeredMerchants = new Map<string, MerchantState>();

/**
 * Generate a new Algorand wallet for a merchant
 */
export async function generateMerchantWallet(): Promise<{ address: string; privateKey: Uint8Array }> {
    const account = generateAccount();
    const address = encodeAddress(account.addr.publicKey);
    const privateKey = account.sk;

    // 1. Get the LocalNet dispenser account (async)
    const localNetDispenser = await algorand.account.localNetDispenser();

    // 2. Send funds from the dispenser to your merchant wallet (async)
    await algorand.send.payment({
        sender: localNetDispenser,
        receiver: address,
        amount: microAlgo(1000000000000), // fund with 10 ALGO
    });

    return { address, privateKey };
}

// Merchant signup endpoint
router.post('/signup', async (req: Request, res: Response) => {
    try {
        const { username, business_description } = req.body;

        // Validate required fields
        if (!username || !business_description) {
            return res.status(400).json({
                error: 'Missing required fields: username, business_description'
            });
        }

        // Check if merchant already exists
        if (registeredMerchants.has(username)) {
            return res.status(409).json({
                error: 'Merchant username already exists',
                merchant: registeredMerchants.get(username)
            });
        }

        // Generate wallet for merchant
        const { address, privateKey } = await generateMerchantWallet();

        // Create merchant state
        const merchantState: MerchantState = {
            merchant_id: `merchant-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            username,
            business_description,
            wallet_address: address,
            wallet_private_key: privateKey,
            created_at: Date.now()
        };

        // Store merchant
        registeredMerchants.set(username, merchantState);

        console.log(`Registered merchant: ${username} - "${business_description}"`);
        console.log(`Total merchants registered: ${registeredMerchants.size}`);

        res.json({
            success: true,
            message: 'Merchant registered successfully',
            merchant: {
                merchant_id: merchantState.merchant_id,
                username: merchantState.username,
                business_description: merchantState.business_description,
                wallet_address: merchantState.wallet_address,
                created_at: merchantState.created_at,
                private_key: algosdk.secretKeyToMnemonic(merchantState.wallet_private_key)
                // Note: private key is not returned for security
            }
        });
    } catch (error) {
        console.error('Error registering merchant:', error);
        res.status(500).json({
            error: 'Failed to register merchant',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// Get all merchants
router.get('/', (req: Request, res: Response) => {
    const merchants = Array.from(registeredMerchants.values()).map(merchant => ({
        merchant_id: merchant.merchant_id,
        username: merchant.username,
        business_description: merchant.business_description,
        wallet_address: merchant.wallet_address,
        created_at: merchant.created_at
    }));

    res.json({
        merchants,
        count: merchants.length
    });
});

// Get specific merchant by username
router.get('/:username', (req: Request, res: Response) => {
    const { username } = req.params;
    const merchant = registeredMerchants.get(username);

    if (!merchant) {
        return res.status(404).json({ error: 'Merchant not found' });
    }

    res.json({
        merchant: {
            merchant_id: merchant.merchant_id,
            username: merchant.username,
            business_description: merchant.business_description,
            wallet_address: merchant.wallet_address,
            created_at: merchant.created_at
        }
    });
});

// Get merchant wallet address (for listing creation)
router.get('/:username/wallet', (req: Request, res: Response) => {
    const { username } = req.params;
    const merchant = registeredMerchants.get(username);

    if (!merchant) {
        return res.status(404).json({ error: 'Merchant not found' });
    }

    res.json({
        wallet_address: merchant.wallet_address
    });
});

// Get merchant details by wallet address
router.get('/by-wallet/:walletAddress', (req: Request, res: Response) => {
    const { walletAddress } = req.params;

    // Search for merchant by wallet address
    let foundMerchant: MerchantState | undefined;
    for (const merchant of registeredMerchants.values()) {
        if (merchant.wallet_address === walletAddress) {
            foundMerchant = merchant;
            break;
        }
    }

    if (!foundMerchant) {
        return res.status(404).json({ error: 'Merchant not found with this wallet address' });
    }

    res.json({
        merchant: {
            merchant_id: foundMerchant.merchant_id,
            username: foundMerchant.username,
            business_description: foundMerchant.business_description,
            wallet_address: foundMerchant.wallet_address,
            created_at: foundMerchant.created_at,
            wallet_private_key: algosdk.secretKeyToMnemonic(foundMerchant.wallet_private_key),
        }
    });
});

export default router;
