#!/bin/bash

# Test script for decision streaming
# Usage: ./test-streaming.sh

PORT=${PORT:-3000}
BASE_URL="http://localhost:$PORT"

echo "🧪 Testing Decision Streaming System"
echo "===================================="
echo ""

# Array of sample items
items=(
  "Charizard Holographic Card:250"
  "Blastoise First Edition:200"
  "Pikachu Shadowless:150"
  "Mewtwo Promo Card:300"
  "Gyarados Rare:120"
  "Common Pidgey Card:25"
  "Rattata Normal:15"
  "Weedle Common:10"
)

# Array of agent names
agents=(
  "agent-pokemon-master"
  "agent-card-collector"
  "agent-investment-bot"
)

# Array of reasoning templates
buy_reasons=(
  "This card completes my collection and has excellent investment potential."
  "Rare card in mint condition. Market value trending upward."
  "Perfect addition to my premium collection. Worth the investment."
  "This is a valuable card that fits my collection goals perfectly."
)

ignore_reasons=(
  "Too expensive for its rarity level. Not worth the investment."
  "This card is too common and doesn't fit my collection strategy."
  "Price is above market value. Better deals available elsewhere."
  "Not aligned with my current collection goals."
)

echo "Sending test decisions to $BASE_URL/api/decisions"
echo ""

for i in {1..8}; do
  # Pick random item
  item_data=${items[$((RANDOM % ${#items[@]}))]}
  item_name=$(echo $item_data | cut -d: -f1)
  item_price=$(echo $item_data | cut -d: -f2)
  
  # Pick random agent
  agent_id=${agents[$((RANDOM % ${#agents[@]}))]}
  
  # Randomly decide BUY or IGNORE
  if [ $((RANDOM % 2)) -eq 0 ]; then
    decision="BUY"
    max_price=$((item_price + RANDOM % 100))
    reasoning=${buy_reasons[$((RANDOM % ${#buy_reasons[@]}))]}
  else
    decision="IGNORE"
    max_price="null"
    reasoning=${ignore_reasons[$((RANDOM % ${#ignore_reasons[@]}))]}
  fi
  
  # Generate unique ID
  decision_id="test-$(date +%s)-$RANDOM"
  item_id="item-$RANDOM"
  timestamp=$(date +%s)000
  
  echo "[$i/8] Sending $decision decision for '$item_name'..."
  
  # Build JSON
  if [ "$max_price" = "null" ]; then
    json="{
      \"id\": \"$decision_id\",
      \"agentId\": \"$agent_id\",
      \"itemId\": \"$item_id\",
      \"itemName\": \"$item_name\",
      \"itemPrice\": $item_price,
      \"decision\": \"$decision\",
      \"reasoning\": \"$reasoning\",
      \"timestamp\": $timestamp
    }"
  else
    json="{
      \"id\": \"$decision_id\",
      \"agentId\": \"$agent_id\",
      \"itemId\": \"$item_id\",
      \"itemName\": \"$item_name\",
      \"itemPrice\": $item_price,
      \"decision\": \"$decision\",
      \"maxPrice\": $max_price,
      \"reasoning\": \"$reasoning\",
      \"timestamp\": $timestamp
    }"
  fi
  
  # Send request
  response=$(curl -s -X POST "$BASE_URL/api/decisions" \
    -H "Content-Type: application/json" \
    -d "$json")
  
  if echo "$response" | grep -q "success.*true"; then
    echo "  ✅ Success!"
  else
    echo "  ❌ Failed: $response"
  fi
  
  # Wait between requests for dramatic effect
  sleep 1.5
done

echo ""
echo "✨ Done! Check your 'watch' window to see the stream!"
echo ""
echo "📊 View all decisions:"
echo "   curl $BASE_URL/api/decisions"
echo ""
echo "🧹 Clear all decisions:"
echo "   curl -X DELETE $BASE_URL/api/decisions"
