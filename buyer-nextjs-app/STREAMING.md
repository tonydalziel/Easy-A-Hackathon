# 📡 Real-Time Decision Streaming

A super cool real-time streaming system for agent purchase decisions using Server-Sent Events (SSE)!

## 🎯 Features

- **Live Streaming**: See agent decisions appear in real-time as they're made
- **Cool Animations**: New decisions pulse and highlight with smooth animations
- **Statistics Dashboard**: Live stats showing buy/ignore ratios and unique agents/items
- **Auto-scroll**: Automatically scrolls to show newest decisions
- **Connection Status**: Visual indicator showing stream connection status
- **Reasoning Display**: Shows agent's thought process for each decision

## 🚀 How to Use

### 1. Start the App
```bash
cd buyer-nextjs-app
npm run dev
```

### 2. Open the Decision Stream
In the command prompt at the top left, type:
```
watch
```

This opens a beautiful window showing live agent decisions! 📺

### 3. Register Some Decisions

Use the API to register decisions and watch them appear instantly:

```bash
# Register a BUY decision
curl -X POST http://localhost:3000/api/decisions \
  -H "Content-Type: application/json" \
  -d '{
    "id": "decision-001",
    "agentId": "agent-pokemon-collector",
    "itemId": "item-001",
    "itemName": "Charizard Holographic Card",
    "itemPrice": 250.00,
    "decision": "BUY",
    "maxPrice": 300.00,
    "reasoning": "This is a rare first edition Charizard in mint condition. It completes my fire-type collection and has excellent investment potential.",
    "timestamp": 1729267200000
  }'

# Register an IGNORE decision
curl -X POST http://localhost:3000/api/decisions \
  -H "Content-Type: application/json" \
  -d '{
    "id": "decision-002",
    "agentId": "agent-pokemon-collector",
    "itemId": "item-002",
    "itemName": "Common Pidgey Card",
    "itemPrice": 75.00,
    "decision": "IGNORE",
    "reasoning": "This card is too common and overpriced. Not worth adding to my premium collection.",
    "timestamp": 1729267201000
  }'
```

Watch the decisions appear in real-time with cool animations! ✨

## 🎨 UI Features

### Status Indicator
- 🟢 **Connected** - Green dot, actively receiving decisions
- 🟡 **Connecting** - Yellow dot, establishing connection
- 🔴 **Disconnected** - Red X, connection lost

### Stats Dashboard
Shows real-time statistics:
- **Total**: All decisions made
- **Buy**: Number of purchases
- **Ignore**: Number of passed items
- **Agents**: Unique agents making decisions
- **Items**: Unique items considered

### Decision Cards
Each decision shows:
- **BUY/IGNORE badge** with color coding (green/red)
- **Timestamp** when decision was made
- **Item name and price**
- **Agent ID** (abbreviated)
- **Max price** willing to pay (for BUY decisions)
- **Reasoning** from the agent's thought process

### Animations
- 🌟 **Pulse effect** for new decisions
- 💫 **Yellow highlight** that fades after 2 seconds
- 🔄 **Smooth scrolling** to newest decision
- ⚡ **Scale animation** on arrival

## 🔧 Technical Details

### Architecture
```
Frontend (React) 
    ↓ EventSource connection
API Route (/api/decisions/stream)
    ↓ Server-Sent Events
AgentDecisionStore (EventEmitter)
    ↓ Emits on new decisions
Real-time updates to all connected clients
```

### API Endpoints

**Stream Endpoint**
```
GET /api/decisions/stream
```
- Returns SSE stream of decisions
- Sends initial stats on connection
- Sends heartbeat every 15 seconds
- Auto-reconnects on disconnect

**Register Decision**
```
POST /api/decisions
```
- Registers new decision
- Triggers event emission
- Streams to all connected clients

**Get All Decisions**
```
GET /api/decisions
```
- Returns all stored decisions
- Includes statistics

## 🎭 Test Script

Want to see it in action? Run this test script to simulate agent activity:

```bash
# Test script - sends multiple decisions
for i in {1..5}; do
  curl -X POST http://localhost:3000/api/decisions \
    -H "Content-Type: application/json" \
    -d "{
      \"id\": \"test-$RANDOM\",
      \"agentId\": \"agent-test-$((i % 3))\",
      \"itemId\": \"item-$RANDOM\",
      \"itemName\": \"Test Item $i\",
      \"itemPrice\": $((RANDOM % 200 + 50)),
      \"decision\": \"$([ $((RANDOM % 2)) -eq 0 ] && echo BUY || echo IGNORE)\",
      \"maxPrice\": $((RANDOM % 300 + 100)),
      \"reasoning\": \"This is a test decision number $i\",
      \"timestamp\": $(date +%s)000
    }"
  sleep 1
done
```

## 🎮 Commands

All commands work in the terminal prompt at top-left:

- `watch` - Open live decision stream window
- `-h` - Show help
- `wallet` - Show wallet overview
- `track <agent-id>` - Track specific agent
- `list` - List all agents
- `events` - Show blockchain events
- `create <prompt>` - Create new agent

## 🌈 Color Scheme

- **Green** - BUY decisions, positive stats, connected status
- **Red** - IGNORE decisions, connection errors
- **Yellow** - New decision highlight, connecting status
- **Purple** - Agent count
- **Blue** - Total count
- **Gray** - UI elements, borders, inactive states

## 🔥 Pro Tips

1. **Multiple Windows**: Open multiple `watch` windows to see different views
2. **Auto-scroll**: Latest decisions appear at the top with smooth animations
3. **Reasoning Preview**: Long reasoning is truncated - full text in logs
4. **Persistent Connection**: SSE maintains connection even if browser is in background
5. **Performance**: Only keeps last 50 decisions in memory for smooth performance

## 🐛 Troubleshooting

**Stream not connecting?**
- Check console for errors
- Verify API is running on port 3000
- Try refreshing the page

**Decisions not appearing?**
- Check POST request succeeded (200 response)
- Verify decision ID is unique
- Check browser console for EventSource errors

**Animations laggy?**
- Close other windows
- Clear old decisions with DELETE /api/decisions
- Reduce animation duration in component

---

Built with ❤️ using Next.js, SSE, and awesome animations!
