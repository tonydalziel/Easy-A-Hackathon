# Agent Management System

Complete agent creation and management system with in-memory storage and cross-service communication.

## Architecture

```
User Input (Frontend)
    ↓
buyer-nextjs-app API (/api/agents/create)
    ↓
1. Store agent in memory (agentStore)
2. Call express-server to register agent
    ↓
express-server (/agents)
    ↓
Register agent in express-server memory
```

---

## Buyer-Next.js-App APIs

### POST `/api/agents/create`
Create a new agent and store it in memory.

**Request:**
```json
{
  "prompt": "Collect rare Pokemon cards for my collection",
  "model_id": "gemma3",  // Optional, defaults to gemma3
  "provider_id": "ollama"  // Optional, defaults to ollama
}
```

**Response:**
```json
{
  "success": true,
  "agentId": "agent-1729267200000-abc123",
  "agent": {
    "id": "agent-1729267200000-abc123",
    "prompt": "Collect rare Pokemon cards for my collection",
    "model_id": "gemma3",
    "provider_id": "ollama",
    "wallet_id": "wallet-1729267200000-def456",
    "wallet_pwd": "secure123",
    "currentItemsAcquired": [],
    "createdAt": 1729267200000,
    "status": "active"
  },
  "message": "Agent created successfully"
}
```

---

### GET `/api/agents`
Get all agents with statistics.

**Response:**
```json
{
  "agents": [
    {
      "id": "agent-1729267200000-abc123",
      "prompt": "Collect rare Pokemon cards",
      "model_id": "gemma3",
      "provider_id": "ollama",
      "wallet_id": "wallet-1729267200000-def456",
      "wallet_pwd": "secure123",
      "currentItemsAcquired": ["Charizard Card"],
      "createdAt": 1729267200000,
      "status": "active"
    }
  ],
  "count": 1,
  "stats": {
    "total": 1,
    "active": 1,
    "inactive": 0,
    "error": 0,
    "totalItemsAcquired": 1
  }
}
```

---

### GET `/api/agents/[id]`
Get specific agent details.

**Response:**
```json
{
  "agent": {
    "id": "agent-1729267200000-abc123",
    "prompt": "Collect rare Pokemon cards",
    "model_id": "gemma3",
    "provider_id": "ollama",
    "wallet_id": "wallet-1729267200000-def456",
    "wallet_pwd": "secure123",
    "currentItemsAcquired": ["Charizard Card"],
    "createdAt": 1729267200000,
    "status": "active"
  }
}
```

---

### PATCH `/api/agents/[id]`
Update agent status.

**Request:**
```json
{
  "status": "inactive"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Agent updated"
}
```

---

### DELETE `/api/agents/[id]`
Delete an agent.

**Response:**
```json
{
  "success": true,
  "message": "Agent deleted"
}
```

---

## Express-Server APIs

### POST `/agents`
Register an agent (called automatically by buyer-nextjs-app).

**Request:**
```json
{
  "provider_id": "ollama",
  "model_id": "gemma3",
  "prompt": "Collect rare Pokemon cards",
  "user_id": "agent-1729267200000-abc123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Agent registered successfully",
  "agentId": "agent-1729267200000-abc123",
  "agent": {
    "agent_id": "agent-1729267200000-abc123",
    "prompt": "Collect rare Pokemon cards",
    "model_id": "gemma3",
    "provider_id": "ollama",
    "currentItemsAcquired": [],
    "wallet_id": "wallet-1729267200000",
    "wallet_pwd": "temp-pwd"
  }
}
```

---

### GET `/agents`
Get all registered agents from express-server.

**Response:**
```json
{
  "agents": [...],
  "count": 1
}
```

---

### GET `/agents/:agentId`
Get specific agent from express-server.

**Response:**
```json
{
  "agent": {
    "agent_id": "agent-1729267200000-abc123",
    "prompt": "Collect rare Pokemon cards",
    ...
  }
}
```

---

## Example Usage

### 1. Create an Agent via UI
```bash
# In the browser terminal
create Collect rare trading cards to complete my vintage collection
```

This will:
1. ✅ Store agent in buyer-nextjs-app memory
2. ✅ Auto-register with express-server
3. ✅ Return agent ID
4. ✅ Open agent tracker window

---

### 2. Create an Agent via API
```bash
curl -X POST http://localhost:3000/api/agents/create \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Collect rare Pokemon cards for my collection",
    "model_id": "gemma3",
    "provider_id": "ollama"
  }'
```

---

### 3. List All Agents
```bash
curl http://localhost:3000/api/agents
```

---

### 4. Get Specific Agent
```bash
curl http://localhost:3000/api/agents/agent-1729267200000-abc123
```

---

### 5. Update Agent Status
```bash
curl -X PATCH http://localhost:3000/api/agents/agent-1729267200000-abc123 \
  -H "Content-Type: application/json" \
  -d '{"status": "inactive"}'
```

---

### 6. Delete Agent
```bash
curl -X DELETE http://localhost:3000/api/agents/agent-1729267200000-abc123
```

---

## Environment Variables

Create a `.env.local` file in `buyer-nextjs-app`:

```bash
# Express server URL
EXPRESS_SERVER_URL=http://localhost:3000

# Default LLM settings
DEFAULT_MODEL_ID=gemma3
DEFAULT_PROVIDER_ID=ollama
```

---

## Features

### In-Memory Storage
- ✅ Fast agent creation and retrieval
- ✅ No database required
- ✅ Perfect for development and demos
- ⚠️ Data lost on restart

### Event Emission
- ✅ Real-time updates via EventEmitter
- ✅ Subscribe to agent creation events
- ✅ Track agent updates

### Cross-Service Communication
- ✅ buyer-nextjs-app automatically registers agents with express-server
- ✅ Graceful fallback if express-server is unavailable
- ✅ Agent still created locally even if registration fails

### Auto-Generated IDs
- ✅ Unique agent IDs: `agent-{timestamp}-{random}`
- ✅ Unique wallet IDs: `wallet-{timestamp}-{random}`
- ✅ No collisions

### Status Management
- `active` - Agent is running
- `inactive` - Agent is paused
- `error` - Agent encountered an error

---

## Agent Store Methods

```typescript
// Create agent
agentStore.createAgent(agent)

// Get agent
agentStore.getAgent(id)

// Get all agents
agentStore.getAllAgents()

// Update status
agentStore.updateAgentStatus(id, 'inactive')

// Add item to agent
agentStore.addItemToAgent(agentId, 'Charizard Card')

// Delete agent
agentStore.deleteAgent(id)

// Clear all (testing)
agentStore.clear()

// Get statistics
agentStore.getStats()
```

---

## Testing Workflow

```bash
# Terminal 1: Start buyer-nextjs-app
cd buyer-nextjs-app
npm run dev

# Terminal 2: Start express-server
cd express-server
npm run dev

# Terminal 3: Create test agent
curl -X POST http://localhost:3000/api/agents/create \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Test agent"}'

# Get agent ID from response, then:
curl http://localhost:3000/api/agents/[AGENT_ID]
```

---

## Integration with Decision System

When an agent makes a decision, you can update their acquired items:

```typescript
// After a purchase decision
agentStore.addItemToAgent(agentId, itemName);
```

This automatically:
- Updates the agent's `currentItemsAcquired` array
- Emits an `agentUpdated` event
- Logs the acquisition

---

Built with ❤️ for seamless agent management!
