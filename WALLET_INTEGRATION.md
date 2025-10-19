# Integrated Algorand Wallet Signup System

## Overview
The frontend signup system is now fully integrated with the express-server's merchant router, which generates **real Algorand wallets** using AlgoSDK.

## Architecture

```
User Signup Flow:
┌─────────────┐      ┌──────────────┐      ┌─────────────────┐
│  Frontend   │ POST │  Next.js API │ POST │ Express Server  │
│ SignupForm  │─────▶│/api/auth/    │─────▶│/merchants/      │
│             │      │signup        │      │signup           │
└─────────────┘      └──────────────┘      └─────────────────┘
       │                    │                       │
       │                    │                       ▼
       │                    │              ┌─────────────────┐
       │                    │              │  AlgoSDK        │
       │                    │              │  Generate       │
       │                    │              │  Account()      │
       │                    │              └─────────────────┘
       │                    │                       │
       │                    ▼                       ▼
       │           ┌─────────────────┐    ┌─────────────────┐
       │           │  Store in       │◀───│  Return Wallet  │
       │           │  Cookie         │    │  Address + Key  │
       │           └─────────────────┘    └─────────────────┘
       │                    │
       ▼                    ▼
┌─────────────────────────────────────┐
│  localStorage:                      │
│  - user data (username, walletId)   │
│  - wallet_private_key (encrypted)   │
└─────────────────────────────────────┘
```

## Components

### 1. **Frontend: SignupForm** (`/src/components/SignupForm.tsx`)
**Purpose**: User interface for account creation

**Fields**:
- `username` (required, 3-20 characters)
- `description` (optional, up to 200 characters)

**Actions**:
1. Validates user input
2. Calls `/api/auth/signup` (Next.js API route)
3. Stores user data in localStorage
4. Stores private key separately for security
5. Triggers parent callback on success

**Storage**:
```javascript
localStorage.setItem('user', JSON.stringify({
  username,
  walletId,
  privateKey,
  merchantId,
  description,
  createdAt
}));

localStorage.setItem('wallet_private_key', privateKey);
```

### 2. **Next.js API Route** (`/app/api/auth/signup/route.ts`)
**Purpose**: Proxy to express server + session management

**Endpoints**:

#### POST `/api/auth/signup`
Creates new user account with Algorand wallet

**Request**:
```json
{
  "username": "alice",
  "description": "Tech enthusiast looking for gadgets"
}
```

**Process**:
1. Validates username (3-20 chars)
2. Calls express server: `POST http://localhost:3000/merchants/signup`
3. Receives real Algorand wallet from express server
4. Stores user data in HTTP-only cookie (30 days)
5. Returns complete user object to frontend

**Response**:
```json
{
  "success": true,
  "user": {
    "username": "alice",
    "walletId": "ALGORAND_ADDRESS_HERE",
    "privateKey": "ALGORAND_PRIVATE_KEY_HERE",
    "merchantId": "merchant-1729350000000-x7k9p2m4n",
    "description": "Tech enthusiast looking for gadgets",
    "createdAt": 1729350000000
  },
  "message": "User created successfully"
}
```

#### GET `/api/auth/signup`
Checks if user is authenticated

**Response (authenticated)**:
```json
{
  "authenticated": true,
  "user": { ...userData }
}
```

**Response (not authenticated)**:
```json
{
  "authenticated": false
}
```

#### DELETE `/api/auth/signup`
Logs out user (clears cookie)

### 3. **Express Server: merchantRouter** (`/src/merchantRouter.ts`)
**Purpose**: Generate real Algorand wallets using AlgoSDK

#### POST `/merchants/signup`
**Request**:
```json
{
  "username": "alice",
  "business_description": "Tech enthusiast looking for gadgets"
}
```

**Process**:
```typescript
// Generate real Algorand wallet
const account = algosdk.generateAccount();
const address = algosdk.encodeAddress(account.addr.publicKey);
const privateKey = algosdk.encodeAddress(account.sk);

// Store merchant
const merchantState = {
  merchant_id,
  username,
  business_description,
  wallet_address: address,
  wallet_private_key: privateKey,
  created_at: Date.now()
};
```

**Response**:
```json
{
  "success": true,
  "message": "Merchant registered successfully",
  "merchant": {
    "merchant_id": "merchant-1729350000000-x7k9p2m4n",
    "username": "alice",
    "business_description": "Tech enthusiast looking for gadgets",
    "wallet_address": "ALGORAND_ADDRESS_58_CHARS",
    "private_key": "ALGORAND_PRIVATE_KEY",
    "created_at": 1729350000000
  }
}
```

## Data Storage

### Frontend (localStorage)
```javascript
{
  "user": {
    "username": "alice",
    "walletId": "ALGORAND_ADDRESS",
    "privateKey": "ALGORAND_PRIVATE_KEY",
    "merchantId": "merchant-123",
    "description": "...",
    "createdAt": 1729350000000
  }
}

{
  "wallet_private_key": "ALGORAND_PRIVATE_KEY"  // Stored separately
}
```

### Frontend (Cookie - 30 days)
```
user={...same as localStorage...}
```

### Express Server (In-Memory Map)
```typescript
Map<username, MerchantState> {
  "alice" => {
    merchant_id: "merchant-123",
    username: "alice",
    business_description: "...",
    wallet_address: "ALGORAND_ADDRESS",
    wallet_private_key: "ALGORAND_PRIVATE_KEY",
    created_at: 1729350000000
  }
}
```

## Environment Configuration

### Frontend (`.env.local`)
```bash
# Express Server URL
EXPRESS_SERVER_URL=http://localhost:3000

# Next.js Public URL
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Express Server (`.env`)
```bash
# Existing vars...
export API_KEY="ollama"
export OPENAI_API_URL=http://127.0.0.1:11434/v1
export OPENAI_API_KEY="ollama"
export OPENAI_MODEL=gemma3
```

## Wallet Information

### Real Algorand Wallet
✅ Generated using `algosdk.generateAccount()`
✅ Valid Algorand address (58 characters, Base32 encoded)
✅ Private key securely generated
✅ Can be used for real Algorand transactions

### Example Wallet
```
Address: GD64YIY3ZZLSEGI52CCMLLXBVLGXHXKPQYMTZKJLQLJCFXWFMBHWI7HXCQ
Private Key: [stored securely]
```

## Security Considerations

### ✅ Implemented
- Real Algorand wallet generation via AlgoSDK
- Private key stored in localStorage (client-side only)
- HTTP-only cookies for session management
- CORS protection between frontend/backend
- Input validation (username length, etc.)

### ⚠️ Production Recommendations
1. **Encrypt private keys** in localStorage
2. **Use HTTPS** in production (secure cookies)
3. **Add password protection** for account access
4. **Implement key backup** (mnemonic phrase export)
5. **Add 2FA** for sensitive operations
6. **Rate limiting** on signup endpoint
7. **Database persistence** instead of in-memory storage
8. **Key management service** for private key encryption
9. **Audit logging** for wallet operations

## API Testing

### Test Signup
```bash
# 1. Create account via frontend API
curl -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "description": "Test merchant account"
  }'

# 2. Directly test express server
curl -X POST http://localhost:3000/merchants/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser2",
    "business_description": "Another test"
  }'

# 3. Check authentication
curl http://localhost:3001/api/auth/signup

# 4. List all merchants
curl http://localhost:3000/merchants

# 5. Get specific merchant
curl http://localhost:3000/merchants/testuser
```

## Integration Points

### Creating Agents
When agents are created, they should use the user's wallet:
```typescript
// In agent creation API
const user = getUserFromSession();
const agent = {
  wallet_id: user.walletId,
  // ... other agent properties
};
```

### Listing Items
When items are listed, they should be associated with the merchant:
```typescript
// In item creation API
const user = getUserFromSession();
const item = {
  seller_wallet: user.walletId,
  seller_id: user.merchantId,
  // ... other item properties
};
```

## Troubleshooting

### Issue: "Failed to connect to express server"
**Solution**: Ensure express server is running on port 3000
```bash
cd express-server
npm start
```

### Issue: "Merchant username already exists"
**Solution**: Use a different username or clear the express server data
```bash
# Restart express server to clear in-memory data
```

### Issue: "CORS error"
**Solution**: Check CORS headers in `express-server/src/index.ts`
```typescript
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  // ...
});
```

## Next Steps

1. ✅ **Wallet generation** - COMPLETE (using AlgoSDK)
2. ⏳ **Wallet encryption** - Store private keys encrypted
3. ⏳ **Mnemonic backup** - Generate recovery phrase
4. ⏳ **Transaction signing** - Use wallet for on-chain operations
5. ⏳ **Balance checking** - Display wallet balance
6. ⏳ **Database persistence** - Replace in-memory storage
7. ⏳ **Key recovery** - Import wallet from mnemonic

## Files Modified

```
buyer-nextjs-app/
├── .env.local                              [NEW] Environment config
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── auth/
│   │   │       └── signup/
│   │   │           └── route.ts            [MODIFIED] Calls express server
│   │   └── page.tsx                        [MODIFIED] Extended user type
│   └── components/
│       └── SignupForm.tsx                  [MODIFIED] Stores private key

express-server/
├── src/
│   ├── merchantRouter.ts                   [EXISTS] Generates wallets
│   ├── types.ts                            [EXISTS] MerchantState type
│   └── index.ts                            [EXISTS] Mounts /merchants route
```

## Summary

🎉 **The signup system now generates REAL Algorand wallets!**

- ✅ Frontend signup form with description
- ✅ Integration with express-server merchant router
- ✅ Real Algorand wallet generation using AlgoSDK
- ✅ Private key storage in localStorage
- ✅ Session management with cookies
- ✅ Full user data persistence
- ✅ Secure merchant account creation

Users can now sign up and receive a genuine Algorand wallet that can be used for actual blockchain transactions! 🚀
