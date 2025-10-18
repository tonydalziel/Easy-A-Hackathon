#!/bin/bash

# Test script for item processing system
# Run this after starting the express-server

BASE_URL="http://localhost:3000"

echo "🧪 Testing Item Processing System"
echo "=================================="
echo ""

# 1. Check initial status
echo "1️⃣ Checking server status..."
curl -s "${BASE_URL}/agents/status" | jq '.'
echo ""

# 2. Register an agent
echo "2️⃣ Registering test agent..."
AGENT_RESPONSE=$(curl -s -X POST "${BASE_URL}/agents" \
  -H "Content-Type: application/json" \
  -d '{
    "provider_id": "openai",
    "model_id": "gpt-4",
    "prompt": "Buy tech gadgets under $100",
    "user_id": "test-agent-1"
  }')
echo "$AGENT_RESPONSE" | jq '.'
echo ""

# 3. Register an item (should trigger processing with existing agent)
echo "3️⃣ Registering test item..."
ITEM_RESPONSE=$(curl -s -X POST "${BASE_URL}/agents/items" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Wireless Mouse",
    "description": "Bluetooth mouse with ergonomic design",
    "price": 45.99,
    "sellerId": "seller-1"
  }')
echo "$ITEM_RESPONSE" | jq '.'
echo ""

# 4. Register another item
echo "4️⃣ Registering another item..."
curl -s -X POST "${BASE_URL}/agents/items" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Premium Laptop",
    "description": "High-end gaming laptop",
    "price": 1299.99,
    "sellerId": "seller-2"
  }' | jq '.'
echo ""

# 5. Register another agent (should process all existing items)
echo "5️⃣ Registering second agent..."
curl -s -X POST "${BASE_URL}/agents" \
  -H "Content-Type: application/json" \
  -d '{
    "provider_id": "anthropic",
    "model_id": "claude-3",
    "prompt": "Buy premium electronics, budget is unlimited",
    "user_id": "test-agent-2"
  }' | jq '.'
echo ""

# 6. Check final status
echo "6️⃣ Final status check..."
curl -s "${BASE_URL}/agents/status" | jq '.'
echo ""

# 7. Trigger manual processing
echo "7️⃣ Triggering manual re-processing..."
curl -s -X POST "${BASE_URL}/agents/process-all" | jq '.'
echo ""

echo "✅ Test complete! Check the express-server logs for processing details."
