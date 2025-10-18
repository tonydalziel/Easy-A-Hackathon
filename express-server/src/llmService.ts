// Mock LLM service for testing
export interface LLMResponse {
    success: boolean;
    content?: string;
    error?: string;
}

export async function getLLMCompletion({ message }: { message: any }): Promise<LLMResponse> {
    // Mock LLM processing
    console.log(`Mock LLM processing message: ${message.content}`);
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Return mock response based on message type
    let response = '';
    switch (message.type) {
        case 'BID':
            response = 'Mock: I will bid on this item';
            break;
        case 'ASK':
            response = 'Mock: I am asking about this item';
            break;
        case 'BUY':
            response = 'Mock: I will buy this item';
            break;
        case 'SELL':
            response = 'Mock: I will sell this item';
            break;
        case 'QUERY':
            response = 'Mock: Here is my response to your query';
            break;
        default:
            response = 'Mock: I received your message';
    }
    
    return {
        success: true,
        content: response
    };
}
