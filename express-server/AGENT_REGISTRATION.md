# Express Server - Agent Registration

The express-server now has full agent registration and management capabilities.

## New Endpoints

### GET `/agents/status`
Check if the agent router is running.

```bash
curl http://localhost:3000/agents/status
```

**Response:**
```json
{
  "status": "Agent router is running"
}
```

---

### POST `/agents`
Register a new agent.

```bash
curl -X POST http://localhost:3000/agents \
  -H "Content-Type: application/json" \
  -d '{
    "provider_id": "ollama",
    "model_id": "gemma3",
    "prompt": "Collect rare Pokemon cards",
    "user_id": "agent-123"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Agent registered successfully",
  "agentId": "agent-123",
  "agent": {
    "agent_id": "agent-123",
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
Get all registered agents.

```bash
curl http://localhost:3000/agents
```

**Response:**
```json
{
  "agents": [
    {
      "agent_id": "agent-123",
      "prompt": "Collect rare Pokemon cards",
      "model_id": "gemma3",
      "provider_id": "ollama",
      "currentItemsAcquired": [],
      "wallet_id": "wallet-1729267200000",
      "wallet_pwd": "temp-pwd"
    }
  ],
  "count": 1
}
```

---

### GET `/agents/:agentId`
Get a specific agent.

```bash
curl http://localhost:3000/agents/agent-123
```

**Response:**
```json
{
  "agent": {
    "agent_id": "agent-123",
    "prompt": "Collect rare Pokemon cards",
    ...
  }
}
```

---

### POST `/agents/consider-purchase`
Have an LLM agent consider a purchase (existing endpoint).

```bash
curl -X POST http://localhost:3000/agents/consider-purchase \
  -H "Content-Type: application/json" \
  -d '{
    "agentState": {
      "agent_id": "agent-123",
      "prompt": "Collect rare Pokemon cards",
      ...
    },
    "itemState": {
      "id": "item-001",
      "name": "Charizard Card",
      "price": 250.00
    }
  }'
```

---

## In-Memory Storage

The express-server now maintains an in-memory Map of registered agents:

```typescript
const registeredAgents = new Map<string, AgentState>();
```

Features:
- ✅ Fast O(1) lookups
- ✅ No database required
- ✅ Perfect for development
- ⚠️ Data lost on restart

---

## Integration Flow

```
buyer-nextjs-app
  ↓ (POST /api/agents/create)
Creates agent locally
  ↓
Calls express-server (POST /agents)
  ↓
express-server
Registers agent in memory
  ↓
Returns success
```

---

## Error Handling

### 400 - Missing Fields
```json
{
  "error": "Missing required fields: provider_id, model_id, prompt, user_id"
}
```

### 404 - Agent Not Found
```json
{
  "error": "Agent not found"
}
```

### 409 - Agent Already Exists
```json
{
  "error": "Agent already registered",
  "agent": {...}
}
```

### 500 - Server Error
```json
{
  "error": "Failed to register agent",
  "details": "Error message"
}
```

---

## Testing

```bash
# 1. Start express-server
cd express-server
npm run dev

# 2. Register an agent
curl -X POST http://localhost:3000/agents \
  -H "Content-Type: application/json" \
  -d '{
    "provider_id": "ollama",
    "model_id": "gemma3",
    "prompt": "Test agent",
    "user_id": "test-agent-001"
  }'

# 3. Get all agents
curl http://localhost:3000/agents

# 4. Get specific agent
curl http://localhost:3000/agents/test-agent-001
```

---

Ready to register agents! 🤖
