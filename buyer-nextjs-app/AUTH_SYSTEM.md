# Authentication System - User Signup & Wallet Generation

## Overview
The app now has a complete authentication system with user signup, wallet generation, and session management using cookies.

## Components Created

### 1. **Signup API Route** (`/api/auth/signup/route.ts`)
- **POST**: Create new user account
  - Validates username (3-20 characters)
  - Generates unique wallet ID
  - Stores user data in HTTP-only cookie (30-day expiry)
  - Returns user data

- **GET**: Check authentication status
  - Reads user cookie
  - Returns authenticated user data

- **DELETE**: Logout
  - Clears user cookie
  - Returns success message

### 2. **SignupForm Component** (`SignupForm.tsx`)
Beautiful glassmorphism signup interface with:
- Username input (3-20 characters)
- Real-time validation
- Loading states
- Error messages
- Animated gradient background
- Stores user data in localStorage for client-side access

### 3. **Page.tsx Updates**
Added authentication flow:
- Checks for existing user on mount (localStorage → cookie)
- Shows loading spinner during auth check
- Displays SignupForm if not authenticated
- Shows main app if authenticated
- User info display in navbar (username + wallet ID)
- Logout button
- Passes wallet ID to WalletWindow component

## User Flow

```
1. User visits app
   ↓
2. Check localStorage for user data
   ↓
3. If not found, check server cookie
   ↓
4. If no user found → Show SignupForm
   ↓
5. User enters username (3-20 chars)
   ↓
6. POST /api/auth/signup
   ↓
7. Server generates wallet ID: wallet-{username}-{timestamp}-{random}
   ↓
8. Server stores user in cookie (30 days)
   ↓
9. Client stores user in localStorage
   ↓
10. Main app loads with user context
```

## Wallet ID Format
Currently uses placeholder generation:
```
wallet-{username}-{timestamp}-{random}

Example:
wallet-alice-1729350000000-x7k9p2m4n
```

### TODO: Replace with Real Algorand Wallet
The `generateWalletId()` function in `/api/auth/signup/route.ts` should be replaced with actual Algorand wallet generation using AlgoSDK:

```typescript
import algosdk from 'algosdk';

function generateWalletId(username: string): string {
  const account = algosdk.generateAccount();
  return account.addr; // Returns actual Algorand address
  // Store account.sk securely for the user
}
```

## UI Features

### Navbar User Display
- Username displayed in white
- Wallet ID truncated (first 20 chars + "...")
- Logout button (red, hover effect)
- Located before minimized windows section

### Signup Form Features
- Gradient animated background (purple → blue → cyan)
- Glassmorphism card design
- Shopping cart icon
- Input validation with character count
- Loading spinner during submission
- Error messages in red container
- Success callback to parent component

## Cookie Configuration
```typescript
{
  httpOnly: false,      // Allow client-side access
  secure: production,   // HTTPS only in production
  sameSite: 'lax',     // CSRF protection
  maxAge: 30 days,     // Session length
  path: '/'            // Available app-wide
}
```

## API Endpoints

### Create Account
```bash
POST /api/auth/signup
Content-Type: application/json

{
  "username": "alice"
}

Response:
{
  "success": true,
  "user": {
    "username": "alice",
    "walletId": "wallet-alice-1729350000000-x7k9p2m4n",
    "createdAt": 1729350000000
  },
  "message": "User created successfully"
}
```

### Check Auth Status
```bash
GET /api/auth/signup

Response (authenticated):
{
  "authenticated": true,
  "user": {
    "username": "alice",
    "walletId": "wallet-alice-1729350000000-x7k9p2m4n",
    "createdAt": 1729350000000
  }
}

Response (not authenticated):
{
  "authenticated": false
}
```

### Logout
```bash
DELETE /api/auth/signup

Response:
{
  "success": true,
  "message": "Logged out successfully"
}
```

## Testing

### Test Signup
```bash
curl -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser"}'
```

### Test Auth Check
```bash
curl http://localhost:3001/api/auth/signup \
  --cookie "user=..."
```

### Test Logout
```bash
curl -X DELETE http://localhost:3001/api/auth/signup
```

## Next Steps

1. **Replace placeholder wallet generation** with real Algorand wallet creation
2. **Secure wallet private key storage** (encrypted, user-controlled)
3. **Add password protection** (optional, for additional security)
4. **Implement wallet backup/recovery** (mnemonic phrase)
5. **Add profile management** (edit username, view wallet details)
6. **Persistent user database** (currently only in-memory cookie)
7. **Multi-wallet support** (allow users to have multiple wallets)

## Security Considerations

- ⚠️ **Private keys not yet implemented** - need secure storage
- ✅ Cookie-based session management (30-day expiry)
- ✅ Client-side localStorage for quick access
- ✅ Username validation (length, required)
- ⚠️ **No password protection yet** - consider adding for production
- ⚠️ **HTTPS required in production** for secure cookies

## Files Modified/Created

```
buyer-nextjs-app/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── auth/
│   │   │       └── signup/
│   │   │           └── route.ts          [NEW] Auth API
│   │   └── page.tsx                      [MODIFIED] Auth flow
│   └── components/
│       └── SignupForm.tsx                [NEW] Signup UI
└── AUTH_SYSTEM.md                        [NEW] This file
```
