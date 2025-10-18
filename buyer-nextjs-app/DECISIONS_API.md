# Agent Decision API

This API allows you to register and retrieve agent purchase decisions in the buyer-nextjs-app.

## Endpoints

### POST `/api/decisions`
Register a new agent decision (only if it doesn't already exist).

**Request Body:**
```json
{
  "id": "decision-001",
  "agentId": "agent-123",
  "itemId": "item-456",
  "itemName": "Blastoise Holographic Card",
  "itemPrice": 150.00,
  "decision": "BUY",
  "maxPrice": 175.00,
  "reasoning": "This card completes my water-type collection...",
  "priceReasoning": "Given the rarity and condition, I'm willing to pay up to...",
  "timestamp": 1729267200000,
  "purchaseIntentId": 1729267200000
}
```

**Required Fields:**
- `id`: Unique identifier for this decision
- `agentId`: ID of the agent making the decision
- `itemId`: ID of the item being considered
- `itemName`: Name of the item
- `itemPrice`: Listed price of the item
- `decision`: Either "BUY" or "IGNORE"

**Optional Fields:**
- `maxPrice`: Maximum price agent willing to pay (required if decision is "BUY")
- `reasoning`: Agent's reasoning for the purchase decision
- `priceReasoning`: Agent's reasoning for the price limit
- `timestamp`: Unix timestamp (defaults to current time)
- `purchaseIntentId`: Reference to purchase intent if registered

**Response (Success):**
```json
{
  "success": true,
  "message": "Decision registered successfully",
  "decision": { ... }
}
```

**Response (Already Exists):**
```json
{
  "error": "Decision already exists",
  "existingDecision": { ... }
}
```
Status: `409 Conflict`

---

### GET `/api/decisions`
Retrieve decisions with optional filtering.

**Query Parameters:**
- `id`: Get a specific decision by ID
- `agentId`: Get all decisions for a specific agent
- `itemId`: Get all decisions for a specific item
- (none): Get all decisions with stats

**Examples:**

Get all decisions:
```bash
curl http://localhost:3000/api/decisions
```

Get decisions for a specific agent:
```bash
curl http://localhost:3000/api/decisions?agentId=agent-123
```

Get a specific decision:
```bash
curl http://localhost:3000/api/decisions?id=decision-001
```

**Response (All Decisions):**
```json
{
  "decisions": [...],
  "count": 10,
  "stats": {
    "total": 10,
    "buy": 7,
    "ignore": 3,
    "uniqueAgents": 3,
    "uniqueItems": 8
  }
}
```

---

### DELETE `/api/decisions`
Clear all decisions (useful for testing).

```bash
curl -X DELETE http://localhost:3000/api/decisions
```

**Response:**
```json
{
  "success": true,
  "message": "All decisions cleared"
}
```

---

## Example Usage

### Register a decision to BUY:
```bash
curl -X POST http://localhost:3000/api/decisions \
  -H "Content-Type: application/json" \
  -d '{
    "id": "decision-001",
    "agentId": "agent-123",
    "itemId": "item-456",
    "itemName": "Blastoise Holographic Card",
    "itemPrice": 150.00,
    "decision": "BUY",
    "maxPrice": 175.00,
    "reasoning": "This card completes my water-type collection and is in excellent condition.",
    "priceReasoning": "Given the market value and rarity, I am willing to pay up to $175.",
    "timestamp": 1729267200000,
    "purchaseIntentId": 1729267200000
  }'
```

### Register a decision to IGNORE:
```bash
curl -X POST http://localhost:3000/api/decisions \
  -H "Content-Type: application/json" \
  -d '{
    "id": "decision-002",
    "agentId": "agent-123",
    "itemId": "item-789",
    "itemName": "Common Pidgey Card",
    "itemPrice": 50.00,
    "decision": "IGNORE",
    "reasoning": "This card does not fit my collection goals and the price is too high for its rarity."
  }'
```

### Get all decisions for an agent:
```bash
curl http://localhost:3000/api/decisions?agentId=agent-123
```

### Check if a decision already exists:
```bash
curl http://localhost:3000/api/decisions?id=decision-001
```

---

## Notes

- Decisions are stored in-memory and will be lost on server restart
- The same decision ID cannot be registered twice (409 Conflict)
- All decisions are timestamped and sorted by most recent first
- The API provides stats on buy/ignore ratios and unique agents/items
