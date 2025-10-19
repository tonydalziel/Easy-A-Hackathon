# ChAiN - Blockchain-Powered AI Agent Marketplace

> A revolutionary AI-powered procurement and e-commerce platform built on the Algorand blockchain that enables autonomous AI agents to make purchasing decisions, process payments, and manage merchant listings through smart contracts.

ChAiN (Chain AI Network) combines cutting-edge AI with blockchain technology to create a fully automated, trustless marketplace where AI agents can autonomously purchase goods and services on behalf of users.

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Monorepo Structure](#monorepo-structure)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Smart Contracts](#smart-contracts)
- [API Documentation](#api-documentation)
- [Agent System](#agent-system)
- [Merchant System](#merchant-system)
- [Development](#development)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

ChAiN is a decentralized marketplace where:

- **AI Agents** autonomously browse listings, evaluate products, and make purchase decisions based on user-defined goals
- **Smart Contracts** on Algorand handle all payments, escrow, and transaction finality
- **Merchants** list products and receive payments automatically when agents make purchases
- **Users** create agents with specific purchasing criteria and fund them with ALGO tokens
- **Real-time Processing** through WebSocket connections and blockchain event subscriptions

The platform eliminates traditional e-commerce friction by enabling:
- Trustless transactions without intermediaries
- Automated decision-making using LLMs (Large Language Models)
- Instant payment settlement on blockchain
- Transparent, auditable purchase history
- Decentralized merchant listings

---

## Key Features

### Autonomous AI Agents
- Create custom agents with natural language prompts
- Agents evaluate products based on user preferences
- LLM-powered decision making (supports OpenAI, Anthropic, Ollama)
- Real-time agent activity monitoring
- Agent wallet management with ALGO tokens

### Blockchain Integration
- Algorand smart contracts for payments and listings
- Trustless escrow system
- Automatic payment processing
- On-chain transaction history
- Wallet-based authentication

### Merchant Platform
- Easy product listing management
- Automatic payment collection
- Real-time sales notifications
- Blockchain-verified transactions
- Merchant wallet integration

### Real-Time Updates
- WebSocket connections for live agent activity
- Blockchain event subscriptions
- Instant purchase notifications
- Live agent decision streaming

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Interface                           │
│                    (Next.js Frontend)                           │
│              - Agent Management                                 │
│              - Merchant Dashboard                               │
│              - Product Listings                                 │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     │ REST API / WebSocket
                     │
┌────────────────────▼────────────────────────────────────────────┐
│                    Express Backend                              │
│              - Agent Router                                     │
│              - Merchant Router                                  │
│              - LLM Service Integration                          │
│              - Blockchain Subscriber                            │
└────────────┬───────────────────────────┬────────────────────────┘
             │                           │
             │ LLM API                   │ Algorand SDK
             │                           │
┌────────────▼─────────┐    ┌───────────▼─────────────────────────┐
│   LLM Providers      │    │    Algorand Blockchain              │
│   - OpenAI           │    │    - Smart Contracts (ChAiN)        │
│   - Anthropic        │    │    - Payment Processing             │
│   - Ollama (Local)   │    │    - Listing Management             │
└──────────────────────┘    │    - Wallet Management              │
                            └─────────────────────────────────────┘
```

### Data Flow

1. **Agent Creation**
   - User creates agent with prompt via frontend
   - Backend creates wallet on Algorand
   - Agent funded from user's wallet
   - Agent registered in system

2. **Purchase Flow**
   - Merchant opens listing on smart contract
   - Agent evaluates listing using LLM
   - If criteria met, agent initiates payment
   - Smart contract processes payment
   - Merchant receives funds automatically
   - Listing closed when target amount reached

3. **Real-Time Monitoring**
   - Backend subscribes to blockchain events
   - WebSocket pushes updates to frontend
   - Agent decisions streamed in real-time
   - Transaction confirmations broadcasted

---

## Monorepo Structure

```
Easy-A-Hackathon/
│
├── buyer-nextjs-app/          # Frontend application
│   ├── src/
│   │   ├── app/               # Next.js App Router
│   │   │   ├── api/           # API routes
│   │   │   │   ├── agents/    # Agent management endpoints
│   │   │   │   └── merchants/ # Merchant endpoints
│   │   │   └── page.tsx       # Main UI
│   │   ├── components/        # React components
│   │   ├── lib/               # Utility functions
│   │   │   └── agentStore.ts  # In-memory agent storage
│   │   └── types/             # TypeScript definitions
│   ├── package.json
│   └── tsconfig.json
│
├── express-server/            # Backend API server
│   ├── src/
│   │   ├── agentRouter.ts     # Agent management routes
│   │   ├── merchantRouter.ts  # Merchant management routes
│   │   ├── chain.ts           # Blockchain integration
│   │   ├── blockchainSubscriber.ts  # Event listener
│   │   ├── itemProcessor.ts   # Purchase processing
│   │   ├── llms.ts            # LLM provider integrations
│   │   └── index.ts           # Server entry point
│   ├── package.json
│   └── tsconfig.json
│
├── algokit/                   # Smart contracts
│   └── ch_ai_n/
│       └── projects/
│           └── ch_ai_n/
│               └── smart_contracts/
│                   └── ch_ai_n/
│                       ├── contract.algo.ts    # Main contract
│                       └── artifacts/          # Compiled contracts
│
├── AGENT_CREATION_QUICKSTART.md     # Agent system guide
├── AGENT_WALLET_INTEGRATION.md      # Wallet integration docs
├── WALLET_INTEGRATION.md            # General wallet docs
└── README.md                        # This file
```

---

## Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **React 19** - UI library
- **TypeScript 5** - Type safety
- **Tailwind CSS 4** - Styling
- **algosdk** - Algorand JavaScript SDK
- **react-rnd** - Draggable UI components

### Backend
- **Express 5** - Web framework
- **TypeScript 5** - Type safety
- **algosdk** - Algorand integration
- **ws** - WebSocket server
- **OpenAI SDK** - LLM integration
- **AlgoKit Utils** - Algorand utilities

### Blockchain
- **Algorand** - Layer 1 blockchain
- **AlgoKit** - Smart contract framework
- **Algorand TypeScript** - Smart contract language
- **TestNet** - Development blockchain network

### AI/LLM
- **OpenAI** - GPT models
- **Anthropic** - Claude models
- **Ollama** - Local LLM hosting

---

## Getting Started

### Prerequisites

- Node.js 20+ and npm
- Algorand wallet (for testnet)
- AlgoKit CLI
- (Optional) Ollama for local LLM

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Easy-A-Hackathon
   ```

2. **Install dependencies**
   ```bash
   # Frontend
   cd buyer-nextjs-app
   npm install

   # Backend
   cd ../express-server
   npm install

   # Smart contracts
   cd ../algokit/ch_ai_n
   npm install
   ```

3. **Configure environment variables**

   Create `.env.local` in `buyer-nextjs-app/`:
   ```bash
   EXPRESS_SERVER_URL=http://localhost:3001
   DEFAULT_MODEL_ID=gemma3
   DEFAULT_PROVIDER_ID=ollama
   ```

   Create `.env` in `express-server/`:
   ```bash
   # Algorand TestNet
   ALGOD_TOKEN=your-algod-token
   ALGOD_SERVER=https://testnet-api.algonode.cloud
   ALGOD_PORT=443

   # LLM API Keys (optional)
   OPENAI_API_KEY=sk-...
   ANTHROPIC_API_KEY=sk-ant-...

   # Server Config
   PORT=3001
   ```

4. **Deploy smart contracts**
   ```bash
   cd algokit/ch_ai_n
   algokit project deploy testnet
   ```

### Running the Application

Start all services in separate terminals:

**Terminal 1 - Frontend:**
```bash
cd buyer-nextjs-app
npm run dev
```
Runs on: http://localhost:3000

**Terminal 2 - Backend:**
```bash
cd express-server
npm run start
```
Runs on: http://localhost:3001

**Terminal 3 - Ollama (optional, for local LLM):**
```bash
ollama serve
ollama pull gemma3
```

### Quick Start Example

1. **Sign up / Login** with your Algorand wallet
2. **Create an agent**:
   ```
   create Buy organic coffee beans when price is under $20
   ```
3. **Create a merchant listing** (as merchant):
   ```
   Open listing for "Premium Arabica Coffee Beans" at $18
   ```
4. **Watch your agent work**:
   - Agent evaluates the listing using AI
   - If criteria match, agent purchases automatically
   - Payment processed via smart contract
   - You receive the product NFT/receipt

---

## Smart Contracts

### ChAiN Contract

The main smart contract handles listing management and payment processing.

**Key Functions:**

- `openListing(targetWallet, targetAmount)` - Create a new product listing
- `processPayment(sender, amount)` - Process payment from agent
- `getListingStatus()` - Check if listing is active
- `closeListing()` - Manually close a listing
- `getListingDetails()` - Get listing information

**State Management:**
```typescript
{
  listingOpen: boolean,      // Is listing accepting payments
  targetWallet: Account,      // Merchant's wallet address
  targetAmount: uint64,       // Total price in microALGOs
  receivedAmount: uint64      // Amount received so far
}
```

**Contract Location:**
`algokit/ch_ai_n/projects/ch_ai_n/smart_contracts/ch_ai_n/contract.algo.ts`

---

## API Documentation

### Agent Endpoints

#### Create Agent
```http
POST /api/agents/create
Content-Type: application/json

{
  "prompt": "Buy rare Pokemon cards under $50",
  "user_wallet_id": "WALLET_ADDRESS"
}
```

#### List Agents
```http
GET /api/agents
```

#### Get Agent Details
```http
GET /api/agents/:id
```

#### Update Agent Status
```http
PATCH /api/agents/:id
Content-Type: application/json

{
  "status": "inactive"
}
```

#### Delete Agent
```http
DELETE /api/agents/:id
```

### Merchant Endpoints

#### Create Merchant
```http
POST /api/merchants
Content-Type: application/json

{
  "name": "Coffee Shop",
  "wallet_id": "WALLET_ADDRESS"
}
```

#### Open Listing
```http
POST /merchants/listings
Content-Type: application/json

{
  "merchantId": "merchant-123",
  "productName": "Arabica Coffee",
  "price": 1500000000,
  "description": "Premium coffee beans"
}
```

---

## Agent System

### How Agents Work

1. **Creation** - User creates agent with natural language prompt
2. **Funding** - Agent wallet created and funded from user's wallet
3. **Monitoring** - Agent continuously watches for new listings
4. **Evaluation** - LLM analyzes if listing matches agent criteria
5. **Purchase** - If approved, agent sends payment via smart contract
6. **Tracking** - Purchase recorded and user notified

### Agent Configuration

```typescript
interface Agent {
  id: string;
  prompt: string;              // "Buy coffee under $20"
  model_id: string;            // "gpt-4", "claude-3", "gemma3"
  provider_id: string;         // "openai", "anthropic", "ollama"
  wallet_id: string;           // Agent's Algorand wallet
  status: "active" | "inactive" | "error";
  currentItemsAcquired: string[];
  createdAt: number;
}
```

### Supported LLM Providers

- **OpenAI** - GPT-4, GPT-3.5-turbo
- **Anthropic** - Claude 3 Opus, Sonnet, Haiku
- **Ollama** - Gemma3, Llama3, Mistral (local)

For detailed agent documentation, see [AGENT_CREATION_QUICKSTART.md](./AGENT_CREATION_QUICKSTART.md)

---

## Merchant System

### Creating a Merchant

Merchants need:
- Algorand wallet address
- Business name
- Contact information (optional)

### Opening a Listing

```typescript
{
  productName: string;        // "Coffee Beans"
  price: number;              // In microALGOs (1 ALGO = 1,000,000 microALGOs)
  description: string;        // Product details
  quantity?: number;          // Optional quantity limit
  expiresAt?: number;         // Optional expiration timestamp
}
```

### Payment Flow

1. Merchant opens listing on smart contract
2. Contract emits event with listing details
3. Backend picks up event and notifies agents
4. Agent(s) evaluate listing
5. Approved agent sends payment to contract
6. Contract forwards payment to merchant wallet
7. Contract closes when target amount reached

---

## Development

### Project Commands

**Frontend:**
```bash
npm run dev      # Development server with hot reload
npm run build    # Production build
npm run start    # Start production server
```

**Backend:**
```bash
npm run start    # Start server with ts-node
npm run build    # Compile TypeScript
npm run serve    # Run compiled JavaScript
```

**Smart Contracts:**
```bash
algokit project deploy testnet    # Deploy to testnet
algokit project deploy mainnet    # Deploy to mainnet
npm run test                      # Run contract tests
```

### Testing

Run the full test suite:
```bash
# Test agent creation
curl -X POST http://localhost:3000/api/agents/create \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Test agent", "user_wallet_id": "WALLET_ADDR"}'

# Test listing creation
curl -X POST http://localhost:3001/merchants/listings \
  -H "Content-Type: application/json" \
  -d '{"merchantId": "merchant-1", "productName": "Test", "price": 1000000}'

# Check agent made purchase
curl http://localhost:3000/api/agents/:agent_id
```

### Architecture Decisions

- **In-Memory Storage** - Fast development, easy testing (plan to add database)
- **Event-Driven** - Real-time updates via EventEmitter and WebSocket
- **Modular Design** - Separate concerns (agent, merchant, blockchain)
- **Type Safety** - Full TypeScript coverage
- **Smart Contract First** - Blockchain as source of truth

---

## Security Considerations

### Current Implementation
- Private keys stored in memory (development only)
- TestNet ALGO tokens (no real value)
- No rate limiting on agent creation
- No wallet balance validation before agent creation

### Production Recommendations
1. Use secure key management (HSM, KMS)
2. Implement rate limiting and quotas
3. Add wallet balance validation
4. Enable transaction confirmation UI
5. Add audit logging for all operations
6. Implement proper authentication/authorization
7. Encrypt sensitive data at rest
8. Add monitoring and alerting

---

## Roadmap

### Phase 1 - MVP (Current)
- [x] Agent creation and management
- [x] Smart contract deployment
- [x] Basic merchant listings
- [x] LLM-powered decision making
- [x] Blockchain payment processing

### Phase 2 - Enhancement
- [ ] Persistent database storage
- [ ] Advanced agent strategies
- [ ] Multi-item purchase support
- [ ] Agent performance analytics
- [ ] Mobile responsive UI

### Phase 3 - Scale
- [ ] MainNet deployment
- [ ] Multi-chain support
- [ ] Agent marketplace
- [ ] Merchant analytics dashboard
- [ ] API rate limiting and quotas

### Phase 4 - Enterprise
- [ ] White-label solutions
- [ ] Enterprise agent management
- [ ] Advanced escrow options
- [ ] Compliance and auditing tools

---

## Contributing

We welcome contributions! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Write TypeScript with strict mode
- Add tests for new features
- Update documentation
- Follow existing code style
- Keep commits atomic and descriptive

---

## Documentation

Additional documentation available:
- [Agent Creation Quickstart](./AGENT_CREATION_QUICKSTART.md) - Complete agent system guide
- [Agent Wallet Integration](./AGENT_WALLET_INTEGRATION.md) - Wallet authentication flow
- [Wallet Integration](./WALLET_INTEGRATION.md) - General wallet integration guide

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- Built on [Algorand](https://www.algorand.com/) blockchain
- Powered by [AlgoKit](https://github.com/algorandfoundation/algokit-cli)
- AI integration via [OpenAI](https://openai.com/), [Anthropic](https://anthropic.com/), and [Ollama](https://ollama.ai/)
- Built with [Next.js](https://nextjs.org/) and [Express](https://expressjs.com/)

---

## Support

For questions and support:
- Open an issue on GitHub
- Join our Discord community (coming soon)
- Email: support@chain-marketplace.com (coming soon)

---

**Built with passion at the Easy-A Hackathon 2024**

Made with AI agents, blockchain, and lots of coffee.
