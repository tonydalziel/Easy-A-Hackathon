module.exports = [
"[project]/.next-internal/server/app/api/chat/route/actions.js [app-rsc] (server actions loader, ecmascript)", ((__turbopack_context__, module, exports) => {

}),
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/action-async-storage.external.js [external] (next/dist/server/app-render/action-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/action-async-storage.external.js", () => require("next/dist/server/app-render/action-async-storage.external.js"));

module.exports = mod;
}),
"[project]/src/lib/tools.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "hasPaymentAccess",
    ()=>hasPaymentAccess,
    "makePayment",
    ()=>makePayment,
    "searchProducts",
    ()=>searchProducts,
    "setupPayment",
    ()=>setupPayment,
    "tools",
    ()=>tools
]);
async function searchProducts(searchTerms) {
    // TODO: Implement actual product search
    // This is a mock implementation
    await new Promise((resolve)=>setTimeout(resolve, 500));
    return searchTerms.map((term, index)=>({
            id: `product-${index}`,
            name: `${term} - Sample Product`,
            price: Math.floor(Math.random() * 1000) + 10,
            vendorId: `vendor-${Math.floor(Math.random() * 5)}`,
            description: `This is a sample product for ${term}`
        }));
}
async function hasPaymentAccess(amount, vendorId) {
    // TODO: Implement actual payment access check
    // This is a mock implementation
    await new Promise((resolve)=>setTimeout(resolve, 200));
    // For now, randomly return true/false
    return Math.random() > 0.5;
}
async function setupPayment(amount, vendorId) {
    // TODO: Implement actual payment setup
    // This is a mock implementation
    await new Promise((resolve)=>setTimeout(resolve, 500));
    return {
        vendorId,
        amount,
        authorized: false // Will be set to true after user confirmation
    };
}
async function makePayment(amount, vendorId) {
    // TODO: Implement actual cryptocurrency payment
    // This is a mock implementation
    await new Promise((resolve)=>setTimeout(resolve, 1000));
    const hasAccess = await hasPaymentAccess(amount, vendorId);
    if (!hasAccess) {
        return {
            success: false,
            error: 'Payment access not granted'
        };
    }
    return {
        success: true,
        transactionId: `txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
}
const tools = [
    {
        name: 'searchProducts',
        description: 'Search for products given a list of search terms. Returns products with their prices and vendor IDs.',
        parameters: {
            type: 'object',
            properties: {
                searchTerms: {
                    type: 'array',
                    items: {
                        type: 'string'
                    },
                    description: 'List of product search terms'
                }
            },
            required: [
                'searchTerms'
            ]
        }
    },
    {
        name: 'hasPaymentAccess',
        description: 'Check if the agent has access to make a payment to a specific vendor for a given amount.',
        parameters: {
            type: 'object',
            properties: {
                amount: {
                    type: 'number',
                    description: 'Payment amount'
                },
                vendorId: {
                    type: 'string',
                    description: 'Vendor ID to check payment access for'
                }
            },
            required: [
                'amount',
                'vendorId'
            ]
        }
    },
    {
        name: 'setupPayment',
        description: 'Request payment authorization from the user. This will show a widget asking the user to grant payment access.',
        parameters: {
            type: 'object',
            properties: {
                amount: {
                    type: 'number',
                    description: 'Payment amount to authorize'
                },
                vendorId: {
                    type: 'string',
                    description: 'Vendor ID to authorize payments to'
                }
            },
            required: [
                'amount',
                'vendorId'
            ]
        }
    },
    {
        name: 'makePayment',
        description: 'Make a cryptocurrency payment to a vendor. Requires prior payment authorization.',
        parameters: {
            type: 'object',
            properties: {
                amount: {
                    type: 'number',
                    description: 'Payment amount'
                },
                vendorId: {
                    type: 'string',
                    description: 'Vendor ID to send payment to'
                }
            },
            required: [
                'amount',
                'vendorId'
            ]
        }
    }
];
}),
"[project]/src/lib/llm.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "callLLM",
    ()=>callLLM
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$openai$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/openai/index.mjs [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$openai$2f$client$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__OpenAI__as__default$3e$__ = __turbopack_context__.i("[project]/node_modules/openai/client.mjs [app-route] (ecmascript) <export OpenAI as default>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$tools$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/tools.ts [app-route] (ecmascript)");
;
;
// Initialize OpenAI client with environment variables
const openai = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$openai$2f$client$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__OpenAI__as__default$3e$__["default"]({
    apiKey: process.env.LLM_API_KEY || 'ollama',
    baseURL: process.env.LLM_API_URL || 'http://127.0.0.1:11434/v1'
});
const MODEL = process.env.LLM_MODEL || 'gemma2';
console.log('[LLM] Initialized with config:', {
    baseURL: process.env.LLM_API_URL || 'http://127.0.0.1:11434/v1',
    model: MODEL,
    hasApiKey: !!process.env.LLM_API_KEY
});
async function callLLM(messages, userMessage) {
    try {
        console.log('[LLM] Starting API call...');
        console.log(`[LLM] Model: ${MODEL}`);
        console.log(`[LLM] Base URL: ${process.env.LLM_API_URL}`);
        console.log(`[LLM] Message count: ${messages.length}`);
        console.log(`[LLM] User message: "${userMessage}"`);
        // Convert messages to OpenAI format
        const openAIMessages = messages.map((msg)=>({
                role: msg.role,
                content: msg.content
            }));
        console.log(`[LLM] Available tools: ${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$tools$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["tools"].map((t)=>t.name).join(', ')}`);
        const startTime = Date.now();
        // Make the API call with tool definitions
        const completion = await openai.chat.completions.create({
            model: MODEL,
            messages: openAIMessages,
            tools: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$tools$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["tools"].map((tool)=>({
                    type: 'function',
                    function: {
                        name: tool.name,
                        description: tool.description,
                        parameters: tool.parameters
                    }
                })),
            tool_choice: 'auto'
        });
        const duration = Date.now() - startTime;
        console.log(`[LLM] API call completed in ${duration}ms`);
        console.log(`[LLM] Tokens used - Prompt: ${completion.usage?.prompt_tokens}, Completion: ${completion.usage?.completion_tokens}, Total: ${completion.usage?.total_tokens}`);
        const choice = completion.choices[0];
        const assistantMessage = choice.message;
        console.log(`[LLM] Finish reason: ${choice.finish_reason}`);
        // Handle tool calls if present
        if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
            console.log(`[LLM] Processing ${assistantMessage.tool_calls.length} tool call(s)`);
            const toolCalls = [];
            for (const toolCall of assistantMessage.tool_calls){
                if (toolCall.type !== 'function') continue;
                const functionName = toolCall.function.name;
                const functionArgs = JSON.parse(toolCall.function.arguments);
                console.log(`[LLM] Executing tool: ${functionName}`);
                console.log(`[LLM] Tool arguments:`, functionArgs);
                // Execute the tool
                const result = await executeToolCall(functionName, functionArgs);
                console.log(`[LLM] Tool ${functionName} completed`);
                console.log(`[LLM] Tool result:`, result);
                toolCalls.push({
                    id: toolCall.id,
                    name: functionName,
                    arguments: functionArgs,
                    result
                });
            }
            // Check if payment authorization is needed
            const needsPaymentAuth = toolCalls.some((tc)=>tc.name === 'setupPayment');
            if (needsPaymentAuth) {
                const setupPaymentCall = toolCalls.find((tc)=>tc.name === 'setupPayment');
                console.log('[LLM] Payment authorization required');
                return {
                    message: {
                        id: `msg-${Date.now()}`,
                        role: 'assistant',
                        content: assistantMessage.content || `I need your authorization to make this payment of $${setupPaymentCall?.arguments.amount} to ${setupPaymentCall?.arguments.vendorId}. Please approve the payment request.`,
                        timestamp: new Date(),
                        toolCalls
                    },
                    requiresPaymentAuth: true,
                    paymentDetails: {
                        amount: setupPaymentCall?.arguments.amount || 0,
                        vendorId: setupPaymentCall?.arguments.vendorId || ''
                    }
                };
            }
            // If we made tool calls, we need to get the final response from the LLM
            console.log('[LLM] Making follow-up API call with tool results');
            const toolResultMessages = toolCalls.map((tc)=>({
                    role: 'tool',
                    tool_call_id: tc.id,
                    content: JSON.stringify(tc.result)
                }));
            const followUpStartTime = Date.now();
            const finalCompletion = await openai.chat.completions.create({
                model: MODEL,
                messages: [
                    ...openAIMessages,
                    {
                        role: 'assistant',
                        content: assistantMessage.content,
                        tool_calls: assistantMessage.tool_calls
                    },
                    ...toolResultMessages
                ]
            });
            const followUpDuration = Date.now() - followUpStartTime;
            console.log(`[LLM] Follow-up API call completed in ${followUpDuration}ms`);
            console.log(`[LLM] Follow-up tokens used - Prompt: ${finalCompletion.usage?.prompt_tokens}, Completion: ${finalCompletion.usage?.completion_tokens}, Total: ${finalCompletion.usage?.total_tokens}`);
            return {
                message: {
                    id: `msg-${Date.now()}`,
                    role: 'assistant',
                    content: finalCompletion.choices[0].message.content || 'I processed your request.',
                    timestamp: new Date(),
                    toolCalls
                }
            };
        }
        // No tool calls, just return the message
        console.log('[LLM] No tool calls, returning direct response');
        return {
            message: {
                id: `msg-${Date.now()}`,
                role: 'assistant',
                content: assistantMessage.content || "I'm here to help you search for and purchase products.",
                timestamp: new Date()
            }
        };
    } catch (error) {
        console.error('[LLM] Error calling LLM:', error);
        if (error instanceof Error) {
            console.error('[LLM] Error message:', error.message);
            console.error('[LLM] Error stack:', error.stack);
        }
        throw new Error('Failed to get response from LLM');
    }
}
/**
 * Execute a tool call based on the function name
 */ async function executeToolCall(functionName, args) {
    console.log(`[LLM] Executing tool function: ${functionName}`);
    try {
        switch(functionName){
            case 'searchProducts':
                const { searchProducts } = await __turbopack_context__.A("[project]/src/lib/tools.ts [app-route] (ecmascript, async loader)");
                return await searchProducts(args.searchTerms);
            case 'hasPaymentAccess':
                const { hasPaymentAccess } = await __turbopack_context__.A("[project]/src/lib/tools.ts [app-route] (ecmascript, async loader)");
                return await hasPaymentAccess(args.amount, args.vendorId);
            case 'setupPayment':
                const { setupPayment } = await __turbopack_context__.A("[project]/src/lib/tools.ts [app-route] (ecmascript, async loader)");
                return await setupPayment(args.amount, args.vendorId);
            case 'makePayment':
                const { makePayment } = await __turbopack_context__.A("[project]/src/lib/tools.ts [app-route] (ecmascript, async loader)");
                return await makePayment(args.amount, args.vendorId);
            default:
                console.error(`[LLM] Unknown tool requested: ${functionName}`);
                throw new Error(`Unknown tool: ${functionName}`);
        }
    } catch (error) {
        console.error(`[LLM] Error executing tool ${functionName}:`, error);
        throw error;
    }
}
}),
"[project]/src/app/api/chat/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$llm$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/llm.ts [app-route] (ecmascript)");
;
;
async function POST(request) {
    try {
        const { messages, chatId } = await request.json();
        // Get the last user message
        const lastMessage = messages[messages.length - 1];
        // Call the actual LLM with conversation history
        const response = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$llm$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["callLLM"])(messages, lastMessage.content);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json(response);
    } catch (error) {
        console.error('Error in chat API:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Failed to process chat message'
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__985840e7._.js.map