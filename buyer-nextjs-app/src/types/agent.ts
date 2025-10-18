export type AgentDecision = {
  id: string;
  agentId: string;
  itemId: string;
  itemName: string;
  itemPrice: number;
  decision: 'BUY' | 'IGNORE';
  maxPrice?: number;
  reasoning?: string;
  priceReasoning?: string;
  timestamp: number;
  purchaseIntentId?: number;
};

export type AgentState = {
  agent_id: string;
  prompt: string;
  currentItemsAcquired: string[];
  model_id: string;
  provider_id: string;
  wallet_id: string;
  wallet_pwd: string;
};

export type ItemState = {
  id: string;
  name: string;
  price: number;
};

export type Agent = {
  id: string;
  prompt: string;
  model_id: string;
  provider_id: string;
  wallet_id: string;
  wallet_pwd: string;
  currentItemsAcquired: string[];
  createdAt: number;
  status: 'active' | 'inactive' | 'error';
};

export type CreateAgentRequest = {
  prompt: string;
  model_id?: string;
  provider_id?: string;
};
