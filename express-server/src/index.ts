import express, { Request, Response } from 'express';
import agentRouter from './agentRouter';
import { BlockchainSubscriber } from './blockchainSubscriber';
import { initializeSmartContract } from './chain';

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.send('Hello, TypeScript Express!');
});

app.use('/agents', agentRouter);

// Initialize blockchain monitoring
async function initializeBlockchain() {
  try {
    // Initialize smart contract
    await initializeSmartContract();
    
    // Start blockchain subscriber
    const walletAddress = process.env.WALLET_ADDRESS || 'YOUR_WALLET_ADDRESS_HERE';
    const subscriber = new BlockchainSubscriber(walletAddress);
    await subscriber.start();
    
    console.log('Blockchain monitoring started');
  } catch (error) {
    console.error('Failed to initialize blockchain:', error);
  }
}

app.listen(port, async () => {
  console.log(`Server running at http://localhost:${port}`);
  
  // Initialize blockchain after server starts
  await initializeBlockchain();
});
