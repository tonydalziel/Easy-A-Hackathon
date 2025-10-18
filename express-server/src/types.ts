export type AgentState = {
    id: string;
    prompt: string;
    currentItemsAcquired: string[];
    model_id: string;
    provider_id: string;
    wallet_id: string;
}

export type ItemState = {
    id: string;
    name: string;
    price: number;
}