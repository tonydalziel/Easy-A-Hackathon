// Types for agent decisions
export type AgentDecision = {
  agent_id: string;
  timestamp: number;
  decision: 'BUY' | 'IGNORE';
  item_id: string;
  item_name: string;
  item_price: number;
  reasoning?: string;
  max_price?: number;
  purchase_intent_id?: number;
};

export type RegisterDecisionResponse = {
  message: string;
  decision: AgentDecision;
  isNew: boolean;
};

export type GetDecisionsResponse = {
  agent_id?: string;
  decisions: AgentDecision[];
  count?: number;
  stats?: {
    totalDecisions: number;
    totalAgents: number;
    buyDecisions: number;
    ignoreDecisions: number;
  };
};

/**
 * Register a new agent decision (if not already exists)
 */
export async function registerAgentDecision(
  decision: Omit<AgentDecision, 'timestamp'> & { timestamp?: number }
): Promise<RegisterDecisionResponse> {
  const response = await fetch('/api/agent-decisions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(decision),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to register decision');
  }

  return response.json();
}

/**
 * Get all decisions for a specific agent
 */
export async function getAgentDecisions(agent_id: string): Promise<GetDecisionsResponse> {
  const response = await fetch(`/api/agent-decisions?agent_id=${agent_id}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch decisions');
  }

  return response.json();
}

/**
 * Get all decisions across all agents
 */
export async function getAllDecisions(): Promise<GetDecisionsResponse> {
  const response = await fetch('/api/agent-decisions');

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch all decisions');
  }

  return response.json();
}

/**
 * Clear all agent decisions
 */
export async function clearAllDecisions(): Promise<{ message: string }> {
  const response = await fetch('/api/agent-decisions', {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to clear decisions');
  }

  return response.json();
}
