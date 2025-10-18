# 🚀 Complete Agent Creation System - Quick Start

## What We Built

A full-stack agent management system with:
- ✅ In-memory storage in buyer-nextjs-app
- ✅ Agent registration with express-server
- ✅ RESTful APIs for CRUD operations
- ✅ Event emission for real-time updates
- ✅ Cross-service communication

---

## Quick Start (3 Steps!)

### 1. Start Both Servers

**Terminal 1 - buyer-nextjs-app:**
```bash
cd buyer-nextjs-app
npm run dev
```
Runs on: http://localhost:3000

**Terminal 2 - express-server:**
```bash
cd express-server
npm run dev
```
Runs on: http://localhost:3001 (or configure port)

### 2. Create an Agent via UI

Open http://localhost:3000 in your browser and type:
```
create Collect rare Pokemon cards for my collection
```

💥 **BOOM!** Agent created and stored in both services!

### 3. See Your Agents

Type in the terminal:
```
list
```

Or via API:
```bash
curl http://localhost:3000/api/agents
```

---

## API Quick Reference

### Create Agent
```bash
curl -X POST http://localhost:3000/api/agents/create \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Your agent prompt here"}'
```

### List All Agents
```bash
curl http://localhost:3000/api/agents
```

### Get Specific Agent
```bash
curl http://localhost:3000/api/agents/[AGENT_ID]
```

### Update Agent Status
```bash
curl -X PATCH http://localhost:3000/api/agents/[AGENT_ID] \
  -H "Content-Type: application/json" \
  -d '{"status": "inactive"}'
```

### Delete Agent
```bash
curl -X DELETE http://localhost:3000/api/agents/[AGENT_ID]
```

---

## What Happens When You Create an Agent?

```
1. User types: "create Collect Pokemon cards"
   ↓
2. Frontend calls POST /api/agents/create
   ↓
3. buyer-nextjs-app:
   - Generates unique agent ID
   - Creates wallet credentials
   - Stores agent in memory (agentStore)
   - Returns agent details to user
   ↓
4. Automatically calls express-server POST /agents
   ↓
5. express-server:
   - Registers agent in memory
   - Ready for LLM operations
   ↓
6. Success! Agent is ready to make decisions
```

---

## Files Created/Modified

### buyer-nextjs-app
- ✅ `src/types/agent.ts` - Added Agent type
- ✅ `src/lib/agentStore.ts` - In-memory agent storage
- ✅ `src/app/api/agents/create/route.ts` - Agent creation endpoint
- ✅ `src/app/api/agents/route.ts` - List agents endpoint
- ✅ `src/app/api/agents/[id]/route.ts` - Get/Update/Delete agent
- ✅ `AGENT_SYSTEM.md` - Complete documentation

### express-server
- ✅ `src/agentRouter.ts` - Added agent registration endpoints
- ✅ `AGENT_REGISTRATION.md` - Express server docs

---

## Environment Variables

Create `.env.local` in buyer-nextjs-app:
```bash
EXPRESS_SERVER_URL=http://localhost:3001
DEFAULT_MODEL_ID=gemma3
DEFAULT_PROVIDER_ID=ollama
```

---

## Example Agent Object

```json
{
  "id": "agent-1729267200000-abc123",
  "prompt": "Collect rare Pokemon cards for my collection",
  "model_id": "gemma3",
  "provider_id": "ollama",
  "wallet_id": "wallet-1729267200000-def456",
  "wallet_pwd": "secure123",
  "currentItemsAcquired": ["Charizard Card"],
  "createdAt": 1729267200000,
  "status": "active"
}
```

---

## Testing Workflow

```bash
# 1. Create an agent
curl -X POST http://localhost:3000/api/agents/create \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Collect trading cards"}'

# Response: {"success": true, "agentId": "agent-xxx", ...}

# 2. List all agents
curl http://localhost:3000/api/agents

# 3. Get specific agent
curl http://localhost:3000/api/agents/agent-xxx

# 4. Check if registered in express-server
curl http://localhost:3001/agents

# 5. Use agent for LLM decisions
curl -X POST http://localhost:3001/agents/consider-purchase \
  -H "Content-Type: application/json" \
  -d '{
    "agentState": {
      "agent_id": "agent-xxx",
      "prompt": "Collect trading cards",
      "model_id": "gemma3",
      "provider_id": "ollama",
      "wallet_id": "wallet-xxx",
      "wallet_pwd": "pwd",
      "currentItemsAcquired": []
    },
    "itemState": {
      "id": "item-001",
      "name": "Charizard Card",
      "price": 250.00
    }
  }'
```

---

## Key Features

### Automatic Registration
- Agent automatically registers with express-server
- Graceful fallback if express-server is down
- Agent still created locally

### In-Memory Storage
- Fast O(1) operations
- No database setup required
- Perfect for demos and development

### Event Emission
- Real-time updates via EventEmitter
- Subscribe to agent creation/updates
- Easy to add webhooks later

### Statistics
- Track active/inactive agents
- Count total items acquired
- Monitor agent performance

### Status Management
- `active` - Agent is working
- `inactive` - Agent is paused
- `error` - Agent encountered issues

---

## Next Steps

### Add More Features
1. Persistent storage (database)
2. Agent activity logs
3. Wallet balance tracking
4. Transaction history
5. Agent performance metrics

### Integration
1. Connect decisions to agents
2. Stream agent updates
3. Add WebSocket support
4. Implement agent scheduling

---

## Troubleshooting

### Agent not created?
- Check both servers are running
- Verify prompt is not empty
- Check console logs for errors

### express-server registration failed?
- Check `EXPRESS_SERVER_URL` in .env.local
- Verify express-server is running
- Agent still works locally!

### Can't see agents?
- Make sure you're querying the right URL
- Check port numbers
- Verify agents were created successfully

---

## Documentation

- **Full buyer-nextjs-app docs:** `buyer-nextjs-app/AGENT_SYSTEM.md`
- **Express-server docs:** `express-server/AGENT_REGISTRATION.md`
- **Decision API:** `buyer-nextjs-app/DECISIONS_API.md`
- **Streaming:** `buyer-nextjs-app/STREAMING.md`

---

🎉 **You now have a complete agent management system!**

Create agents, store them, register them, and use them for LLM-powered decision making!

Happy coding! 🚀
