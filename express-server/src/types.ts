import { Account } from "algosdk/dist/types/client/v2/algod/models/types";

Account
export type AgentState = {
    agent_id: string;
    prompt: string;
    currentItemsAcquired: string[];
    model_id: string;
    provider_id: string;
    wallet_id: string;
    wallet_pwd: string;
    walletBalance: number;
}

export type ItemState = {
    id: string;
    name: string;
    price: number;
}

export type MerchantState = {
    merchant_id: string;
    username: string;
    business_description: string;
    wallet_address: string;
    wallet_private_key: string;
    created_at: number;
}
