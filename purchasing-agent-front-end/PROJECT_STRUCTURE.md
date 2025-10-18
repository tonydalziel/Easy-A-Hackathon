# Purchasing Agent Front-End

## Project Overview
A Next.js-based chat interface for an AI purchasing agent with cryptocurrency payment capabilities.

## Features Implemented
- Clean, minimalist chat interface with Tailwind CSS
- Sidebar with multiple chat history
- Real-time messaging with LLM agent
- Balance display in top-right corner
- Payment authorization modal
- Tool calling system for:
  - Product search
  - Payment access checking
  - Payment setup/authorization
  - Making payments

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts          # API endpoint for LLM chat
│   ├── layout.tsx                # Root layout with fonts
│   ├── page.tsx                  # Main page (renders ChatContainer)
│   └── globals.css               # Tailwind CSS config
├── components/
│   ├── ChatContainer.tsx         # Main container with state management
│   ├── ChatMessage.tsx           # Individual message component
│   ├── ChatInput.tsx             # Message input with send button
│   ├── Sidebar.tsx               # Chat history sidebar
│   ├── BalanceDisplay.tsx        # User balance widget
│   └── PaymentAuthModal.tsx     # Payment authorization popup
├── lib/
│   └── tools.ts                  # Skeleton tool implementations
└── types/
    └── index.ts                  # TypeScript type definitions
```

## Key Components

### ChatContainer
Main component managing:
- Multiple chat sessions
- Message history
- Payment authorization flow
- Balance tracking
- API communication

### Tool System (lib/tools.ts)
Skeleton implementations for:
1. **searchProducts** - Search for products by terms
2. **hasPaymentAccess** - Check payment authorization
3. **setupPayment** - Request payment authorization
4. **makePayment** - Execute cryptocurrency payment

### API Route (app/api/chat/route.ts)
Handles LLM chat requests with:
- Simple keyword-based tool detection (replace with actual LLM)
- Tool execution
- Response formatting

## Running the Application

```bash
# Development mode
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

## Next Steps (Implementation TODO)

1. **Replace Mock LLM**: Update `/api/chat/route.ts` with actual LLM API (OpenAI, Anthropic, etc.)
2. **Implement Real Tools**: Replace skeleton functions in `lib/tools.ts` with:
   - Actual product search API
   - Real cryptocurrency payment system
   - Persistent payment authorization storage
3. **Add Persistence**: Implement database for:
   - Chat history
   - User balances
   - Payment authorizations
4. **Authentication**: Add user authentication system
5. **Error Handling**: Improve error messages and recovery

## Technology Stack
- Next.js 15.5.6
- React 19.1.0
- TypeScript
- Tailwind CSS v4
- App Router architecture
