export type AgentState = {
    id: string;
    prompt: string;
    currentItemsAcquired: string[];
    walletBalance: number;
}

export type ItemState = {
    id: string;
    name: string;
    price: number;
}