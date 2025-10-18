export type AgentState = {
    agent_id: string;
    prompt: string;
    currentItemsAcquired: string[];
    model_id: string;
    provider_id: string;
    wallet_id: string;
    wallet_pwd: string;
}

export type ItemState = {
    id: string;
    name: string;
    price: number;
}
