export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  toolCalls?: ToolCall[];
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
  result?: any;
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  vendorId: string;
  description?: string;
}

export interface PaymentAuthorization {
  vendorId: string;
  amount: number;
  authorized: boolean;
}

export interface UserBalance {
  amount: number;
  currency: string;
}

export type ToolName = 'searchProducts' | 'hasPaymentAccess' | 'setupPayment' | 'makePayment';

export interface Tool {
  name: ToolName;
  description: string;
  parameters: Record<string, any>;
}
