# Algorand Blockchain LLM Subscriber

This Express server monitors an Algorand wallet for incoming messages, processes them with an LLM based on message type, and posts responses back to the blockchain.

## Features

- **Blockchain Message Monitoring**: Continuously monitors specified wallet for incoming transactions
- **Message Type Detection**: Automatically identifies message types (BUY, SELL, QUERY)
- **LLM Integration**: Processes messages and generates intelligent responses
- **Automatic Response Posting**: Sends LLM responses back to the blockchain
- **REST API**: Includes endpoints for agent management

## Architecture

```
Blockchain Transaction → Message Parser → LLM Service → Response → Blockchain
                             ↓
                    Identify Message Type
                    (BUY, SELL, QUERY)
```

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your configuration:

```bash
cp .env.example .env
```

Required variables:
- `WALLET_ADDRESS`: The Algorand wallet address to monitor
- `SENDER_ACCOUNT_MNEMONIC`: The 25-word mnemonic for the account that will send responses
- `ALGOD_TOKEN`: Your Algorand node API token
- `ALGOD_SERVER`: Algorand node server URL (default: testnet)
- `ALGOD_PORT`: Algorand node port (default: 443)

Optional variables:
- `PORT`: Express server port (default: 3000)
- `POLL_INTERVAL_MS`: How often to check for new transactions in milliseconds (default: 5000)

### 3. Start the Server

Development mode:
```bash
npm start
```

Production mode:
```bash
npm run build
npm run serve
```

## How It Works

### 1. Message Structure

Send transactions to the monitored wallet with a note field containing:

**JSON Format (Recommended):**
```json
{
  "type": "BUY",
  "content": "Buy 10 ALGO at market price",
  "timestamp": 1234567890
}
```

**Plain Text Format:**
Messages containing keywords like "BUY", "SELL", or "QUERY" will be automatically categorized.

### 2. Message Types

- **BUY**: Purchase/acquisition requests
- **SELL**: Sale/liquidation requests
- **QUERY**: Information/question requests
- **UNKNOWN**: Unrecognized message types

### 3. Response Flow

1. Server polls blockchain for new transactions
2. Incoming transaction to monitored wallet is detected
3. Message is parsed and type is identified
4. Message is sent to LLM service for processing
5. LLM generates appropriate response
6. Response is posted back to blockchain as a new transaction

### 4. Customizing LLM Integration

The LLM service is located in `src/llmService.ts`. By default, it includes placeholder handlers for each message type. To integrate with your LLM:

1. Uncomment and configure the `callLLMEndpoint` function
2. Add your API credentials to `.env`
3. Update the message handlers (`handleBuyMessage`, `handleSellMessage`, `handleQueryMessage`)

Example OpenAI integration:
```typescript
async function handleBuyMessage(message: BlockchainMessage): Promise<string> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.LLM_API_KEY}`
        },
        body: JSON.stringify({
            model: 'gpt-4',
            messages: [
                { role: 'system', content: 'You are a trading assistant.' },
                { role: 'user', content: `Process this buy request: ${message.content}` }
            ]
        })
    });

    const data = await response.json();
    return data.choices[0].message.content;
}
```

## API Endpoints

### GET /
Health check endpoint

### GET /agents/status
Agent router status check

### POST /agents
Create a new agent (placeholder)

## Project Structure

```
src/
├── index.ts                 # Express server setup
├── chain.ts                 # Algorand blockchain functions
├── blockchainSubscriber.ts  # Transaction monitoring service
├── llmService.ts            # LLM integration logic
└── agentRouter.ts          # Agent API endpoints
```

## Key Functions

### chain.ts
- `postAgentToChain()`: Post agent configuration to blockchain
- `postResponseToChain()`: Post LLM response to blockchain
- `parseMessage()`: Parse transaction note into structured message
- `getAlgorandClient()`: Get Algorand client instance

### blockchainSubscriber.ts
- `BlockchainSubscriber`: Main subscriber class
- `start()`: Begin monitoring blockchain
- `stop()`: Stop monitoring
- `processMessage()`: Handle incoming message with LLM

### llmService.ts
- `getLLMCompletion()`: Main LLM processing function
- `handleBuyMessage()`: Process BUY type messages
- `handleSellMessage()`: Process SELL type messages
- `handleQueryMessage()`: Process QUERY type messages

## Testing

To test the system:

1. Start the server
2. Send a transaction to the monitored wallet with a note containing a message
3. Monitor the server logs to see message processing
4. Check the blockchain for the response transaction

Example using AlgoKit:
```bash
# Send a test message
algokit task send-payment \
  --receiver YOUR_WALLET_ADDRESS \
  --amount 0 \
  --note "BUY 10 ALGO"
```

## Troubleshooting

### Subscriber not starting
- Verify `WALLET_ADDRESS` is set in `.env`
- Check Algorand node connectivity
- Ensure `SENDER_ACCOUNT_MNEMONIC` is valid

### Messages not being detected
- Verify transactions are being sent to the correct wallet address
- Check that transactions include a note field
- Review server logs for parsing errors

### Responses not posting
- Verify sender account has sufficient ALGO for transaction fees
- Check `SENDER_ACCOUNT_MNEMONIC` is configured correctly
- Ensure node connection is stable

## License

ISC
