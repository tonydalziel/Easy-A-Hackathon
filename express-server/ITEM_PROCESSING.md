# Item Processing System

## Overview
The express-server now includes an automatic item-agent matching system that processes purchase decisions in real-time.

## How It Works

### 1. **New Agent Registration**
When a new agent is registered via `POST /agents`:
- The agent is stored in memory
- All existing items are automatically sent to the agent for consideration
- The LLM evaluates each item based on the agent's prompt
- Purchase intents are logged

**Response includes:**
```json
{
  "success": true,
  "agentId": "agent-123",
  "itemsToProcess": 5
}
```

### 2. **New Item Registration**
When a new item is registered via `POST /agents/items`:
- The item is stored in memory
- All existing agents are automatically notified
- Each agent's LLM evaluates the item for purchase
- Purchase intents are logged

**Response includes:**
```json
{
  "success": true,
  "itemId": "item-456",
  "agentsNotified": 3
}
```

### 3. **Processing Flow**
```
New Agent Created
    ↓
Fetch All Items
    ↓
For Each Item:
    → Call haveLLMConsiderPurchase(agent, item)
    → Log decision (BUY or IGNORE)
    → Continue to next item
```

```
New Item Listed
    ↓
Fetch All Agents
    ↓
For Each Agent:
    → Call haveLLMConsiderPurchase(agent, item)
    → Log decision (BUY or IGNORE)
    → Continue to next agent
```

## API Endpoints

### Check Processing Status
```bash
GET /agents/status
```

**Response:**
```json
{
  "status": "Agent router is running",
  "agents": 5,
  "items": 10,
  "processor": {
    "queueSize": 0,
    "isProcessing": false
  }
}
```

### Manual Processing Trigger
```bash
POST /agents/process-all
```

Forces all agents to re-evaluate all items. Useful for:
- Testing the system
- Re-running decisions after LLM updates
- Debugging

**Response:**
```json
{
  "success": true,
  "agents": 5,
  "items": 10,
  "totalProcessed": 50
}
```

## Logging

The system provides detailed console logs:

### Agent Registration
```
✅ Registered agent: agent-123 - "Buy tech gadgets under $100"
📦 Processing 5 item(s) with new agent "agent-123"
🤖 Processing: Agent "agent-123" considering item "Laptop" ($1200)
⏭️  Agent "agent-123" passed on "Laptop"
✅ Finished processing all items with agent "agent-123"
```

### Item Registration
```
✅ Registered item: item-456 - "Smartphone" ($800)
🔔 New item "Smartphone" - notifying 3 agent(s)
🤖 Processing: Agent "agent-123" considering item "Smartphone" ($800)
✅ Agent "agent-123" wants to buy "Smartphone"! Purchase Intent: intent-789
✅ Finished processing item "Smartphone" with all agents
```

## Architecture

### ItemProcessor Class (`itemProcessor.ts`)
- **Singleton pattern**: One instance handles all processing
- **Async processing**: Doesn't block HTTP responses
- **Error handling**: Continues processing even if one item/agent fails
- **Queue system**: Can queue items for batch processing if needed

### Integration Points
- `agentRouter.ts`: Triggers processing on agent/item registration
- `llms.ts`: Makes LLM decisions via `haveLLMConsiderPurchase()`

## Performance Considerations

- **Non-blocking**: Processing happens asynchronously
- **Sequential**: Items are processed one at a time per agent (prevents rate limiting)
- **Error resilient**: One failure doesn't stop the entire process
- **Scalable**: Can easily add queue persistence or worker threads if needed

## Future Enhancements

Potential improvements:
- [ ] Persistent queue (Redis/Database)
- [ ] Rate limiting for LLM calls
- [ ] Batch processing with concurrency limits
- [ ] Webhooks for purchase decisions
- [ ] Analytics dashboard for decisions
- [ ] Agent preference learning
