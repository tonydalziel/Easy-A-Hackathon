/**
 * Example usage of the Agent Decision API
 * 
 * This file demonstrates how to use the agent decision registration system
 * from your React components.
 */

import { registerAgentDecision, getAgentDecisions, getAllDecisions, clearAllDecisions } from '@/lib/agentDecisions';

// Example 1: Register a BUY decision
export async function exampleRegisterBuyDecision() {
  try {
    const result = await registerAgentDecision({
      agent_id: 'agent-001',
      decision: 'BUY',
      item_id: 'item-123',
      item_name: 'Blastoise Card',
      item_price: 150,
      reasoning: 'This card completes my water-type collection',
      max_price: 175,
      purchase_intent_id: 1729267200000,
    });

    if (result.isNew) {
      console.log('✅ New decision registered:', result.decision);
    } else {
      console.log('ℹ️ Decision already exists:', result.decision);
    }

    return result;
  } catch (error) {
    console.error('Failed to register decision:', error);
    throw error;
  }
}

// Example 2: Register an IGNORE decision
export async function exampleRegisterIgnoreDecision() {
  try {
    const result = await registerAgentDecision({
      agent_id: 'agent-001',
      decision: 'IGNORE',
      item_id: 'item-456',
      item_name: 'Common Pikachu Card',
      item_price: 50,
      reasoning: 'Too expensive for a common card',
    });

    console.log('Decision registered:', result);
    return result;
  } catch (error) {
    console.error('Failed to register decision:', error);
    throw error;
  }
}

// Example 3: Get all decisions for a specific agent
export async function exampleGetAgentDecisions() {
  try {
    const result = await getAgentDecisions('agent-001');
    console.log(`Agent has made ${result.count} decisions:`, result.decisions);
    return result;
  } catch (error) {
    console.error('Failed to get agent decisions:', error);
    throw error;
  }
}

// Example 4: Get all decisions with statistics
export async function exampleGetAllDecisions() {
  try {
    const result = await getAllDecisions();
    console.log('Total decisions:', result.stats?.totalDecisions);
    console.log('Buy decisions:', result.stats?.buyDecisions);
    console.log('Ignore decisions:', result.stats?.ignoreDecisions);
    return result;
  } catch (error) {
    console.error('Failed to get all decisions:', error);
    throw error;
  }
}

// Example 5: Clear all decisions (for testing)
export async function exampleClearDecisions() {
  try {
    const result = await clearAllDecisions();
    console.log(result.message);
    return result;
  } catch (error) {
    console.error('Failed to clear decisions:', error);
    throw error;
  }
}
