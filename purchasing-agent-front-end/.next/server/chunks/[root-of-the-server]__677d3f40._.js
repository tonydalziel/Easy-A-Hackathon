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
"[project]/src/app/api/chat/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$tools$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/tools.ts [app-route] (ecmascript)");
;
;
async function POST(request) {
    try {
        const { messages, chatId } = await request.json();
        // Get the last user message
        const lastMessage = messages[messages.length - 1];
        // TODO: Replace this with actual LLM API call
        // For now, we'll create a simple mock response that demonstrates tool calling
        const response = await mockLLMResponse(lastMessage.content, messages);
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
// Mock LLM response with tool calling
async function mockLLMResponse(userMessage, conversationHistory) {
    const lowerMessage = userMessage.toLowerCase();
    // Simple keyword-based tool detection (replace with actual LLM)
    if (lowerMessage.includes('search') || lowerMessage.includes('find') || lowerMessage.includes('look for')) {
        // Extract search terms (simple implementation)
        const searchTerms = extractSearchTerms(userMessage);
        const products = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$tools$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["searchProducts"])(searchTerms);
        const toolCall = {
            id: `tool-${Date.now()}`,
            name: 'searchProducts',
            arguments: {
                searchTerms
            },
            result: products
        };
        const responseMessage = `I found ${products.length} products:\n\n${products.map((p)=>`- **${p.name}**: $${p.price} (Vendor: ${p.vendorId})`).join('\n')}\n\nWould you like to purchase any of these?`;
        return {
            message: {
                id: `msg-${Date.now()}`,
                role: 'assistant',
                content: responseMessage,
                timestamp: new Date(),
                toolCalls: [
                    toolCall
                ]
            }
        };
    }
    if (lowerMessage.includes('buy') || lowerMessage.includes('purchase')) {
        // Mock payment flow
        const amount = extractAmount(userMessage) || 100;
        const vendorId = extractVendorId(userMessage) || 'vendor-0';
        const hasAccess = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$tools$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hasPaymentAccess"])(amount, vendorId);
        if (!hasAccess) {
            const authorization = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$tools$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["setupPayment"])(amount, vendorId);
            const toolCall = {
                id: `tool-${Date.now()}`,
                name: 'setupPayment',
                arguments: {
                    amount,
                    vendorId
                },
                result: authorization
            };
            return {
                message: {
                    id: `msg-${Date.now()}`,
                    role: 'assistant',
                    content: `I need your authorization to make this payment of $${amount} to ${vendorId}. Please approve the payment request.`,
                    timestamp: new Date(),
                    toolCalls: [
                        toolCall
                    ]
                },
                requiresPaymentAuth: true,
                paymentDetails: {
                    amount,
                    vendorId
                }
            };
        } else {
            const payment = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$tools$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["makePayment"])(amount, vendorId);
            const toolCall = {
                id: `tool-${Date.now()}`,
                name: 'makePayment',
                arguments: {
                    amount,
                    vendorId
                },
                result: payment
            };
            return {
                message: {
                    id: `msg-${Date.now()}`,
                    role: 'assistant',
                    content: payment.success ? `Payment of $${amount} to ${vendorId} was successful! Transaction ID: ${payment.transactionId}` : `Payment failed: ${payment.error}`,
                    timestamp: new Date(),
                    toolCalls: [
                        toolCall
                    ]
                }
            };
        }
    }
    // Default response
    return {
        message: {
            id: `msg-${Date.now()}`,
            role: 'assistant',
            content: `I'm a purchasing agent. I can help you:\n- Search for products\n- Check prices\n- Make purchases on your behalf\n\nJust ask me to search for something or buy a product!`,
            timestamp: new Date()
        }
    };
}
// Helper functions to extract information from messages
function extractSearchTerms(message) {
    // Simple extraction - remove common words
    const words = message.toLowerCase().replace(/search|find|look for|show me|get me/gi, '').split(/\s+/).filter((word)=>word.length > 2);
    return words.slice(0, 3); // Take first 3 words as search terms
}
function extractAmount(message) {
    const match = message.match(/\$?(\d+(\.\d{2})?)/);
    return match ? parseFloat(match[1]) : null;
}
function extractVendorId(message) {
    const match = message.match(/vendor[:-]?\s*(\w+)/i);
    return match ? match[1] : null;
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__677d3f40._.js.map