# SilkRoadx402 - Marketplace Application

> The first anonymous marketplace for private software sales using x402 payments on Solana.

**Status:** ✅ **OPERATIONAL** - Core functionality complete, sellers receiving real USDC payments.

---

## 🎯 Overview

SilkRoadx402 enables developers to sell private software anonymously using wallet-based authentication and x402 micropayments. The platform is built on Next.js 15 and implements the full x402 protocol for HTTP-based payments on Solana.

### Key Differentiators

- **Zero Platform Fees**: Sellers keep 100% of revenue (token gating creates sustainability)
- **Anonymous**: No KYC, no accounts - just wallet signatures
- **Instant Settlement**: Payments settle in <1 second on Solana
- **x402 Protocol**: First implementation of x402 for software marketplace
- **Token Gated**: 50,000 $PumpMarket required for access

---

## 🏗️ Architecture

### Tech Stack

```
Frontend:     Next.js 15 + React 19 + TypeScript + Tailwind CSS 4
Blockchain:   Solana (@solana/web3.js v1.98.4)
Payments:     Custom x402 protocol implementation
Database:     MongoDB + Mongoose (with mock mode for testing)
Storage:      Cloudinary (images)
Encryption:   AES-256 (crypto-js)
Auth:         JWT + Wallet signatures (ed25519)
```

### Directory Structure

```
silkroad/
├── app/                    # Next.js 15 app directory
│   ├── api/               # API routes
│   │   ├── purchase/      # x402 payment endpoint (402 → payment → delivery)
│   │   ├── listings/      # CRUD operations
│   │   ├── admin/         # Admin moderation
│   │   ├── auth/          # Wallet authentication
│   │   └── transactions/  # Purchase history
│   ├── browse/            # Browse listings
│   ├── listings/          # Listing detail pages
│   ├── sell/              # Create listing flow
│   ├── admin/             # Admin dashboard
│   └── purchases/         # User purchase history
├── lib/                   # Core libraries
│   ├── x402/              # x402 protocol implementation
│   │   ├── facilitator.ts # Payment verification/settlement
│   │   ├── utils.ts       # Payload encoding/decoding
│   │   └── index.ts       # Main exports
│   ├── crypto/            # Encryption utilities
│   ├── solana/            # Solana connection management
│   ├── db.ts              # MongoDB connection
│   └── mockStore.ts       # In-memory dev storage
├── models/                # MongoDB schemas
│   ├── User.ts            # User profiles
│   ├── Listing.ts         # Software listings
│   ├── Transaction.ts     # Purchase records
│   └── Report.ts          # Content reports
├── components/            # React components
│   ├── auth/              # TOS/token gate modals
│   ├── modals/            # Profile/purchase modals
│   └── providers/         # Context providers
├── hooks/                 # Custom React hooks
│   ├── useAuth.ts         # Wallet authentication
│   └── useUSDCBalance.ts  # Real-time USDC balance
├── types/                 # TypeScript definitions
│   ├── x402.ts            # x402 protocol types
│   └── database.ts        # DB types
├── config/
│   └── constants.ts       # App configuration
└── scripts/
    └── test-x402-devnet.ts # Automated payment testing
```

---

## 🔐 x402 Implementation

### Payment Flow

```
1. Buyer clicks "Buy" on listing
   ↓
2. API returns HTTP 402 Payment Required
   {
     x402Version: 1,
     accepts: [{
       scheme: "exact",
       network: "solana-mainnet",
       maxAmountRequired: "5000000",  // 5 USDC
       payTo: "<seller-wallet>",
       asset: "<USDC-mint>",
       ...
     }]
   }
   ↓
3. Frontend prompts wallet for USDC transfer
   ↓
4. Wallet signs + broadcasts transaction
   ↓
5. Frontend retries request with X-PAYMENT header
   X-PAYMENT: base64(JSON({
     signature: "<tx-sig>",
     from: "<buyer-wallet>",
     to: "<seller-wallet>",
     amount: "5000000",
     mint: "<USDC-mint>"
   }))
   ↓
6. API verifies transaction on-chain:
   - Signature exists on Solana
   - Amount matches
   - Recipient matches seller
   - Token is USDC
   ↓
7. API returns 200 OK with deliveryUrl
   {
     success: true,
     deliveryUrl: "https://...",
     txHash: "<signature>"
   }
```

### Core Files

- **`app/api/purchase/route.ts`**: Main x402 endpoint (402 response + payment verification)
- **`lib/x402/facilitator.ts`**: Payment verification and settlement logic
- **`lib/x402/utils.ts`**: Payload encoding/decoding helpers
- **`types/x402.ts`**: Protocol type definitions

### Key Functions

```typescript
// Create 402 response
createPaymentRequired(listingId, title, price, sellerWallet)

// Verify payment on-chain
verifyPayment({ x402Version, paymentHeader, paymentRequirements })

// Settle payment (confirm transaction)
settlePayment({ x402Version, paymentHeader, paymentRequirements })

// Verify transaction on Solana blockchain
verifyTransactionOnChain(connection, signature, from, to, amount, mint)
```

---

## 🎫 Token Gating

### Implementation

All users (buyers and sellers) must hold **50,000 $PumpMarket** to access the marketplace.

**Flow:**
1. User connects wallet
2. Backend checks SPL token balance via RPC
3. Balance cached for 5 minutes (avoid rate limits)
4. If balance < 50k → show Token Gate Modal
5. If balance >= 50k → grant access

**Files:**
- `hooks/useAuth.ts` - Authentication hook with token checking
- `lib/tokenGatingCache.ts` - Balance caching logic
- `components/auth/TokenGateModal.tsx` - UI modal

**Configuration:**
```typescript
// config/constants.ts
export const MIN_SRX402_BALANCE = 50000;
export const SRX402_MINT = '49AfJsWb9E7VjBDTdZ2DjnSLFgSEvCoP1wdXuhHbpump';
```

---

## 💳 Purchase Flow

### User Journey

```
Browse Listings
    ↓
View Listing Detail
    ↓
Check Token Balance (50k+ required)
    ↓
Click "Buy" → HTTP 402
    ↓
Wallet Prompts USDC Transfer
    ↓
Sign Transaction
    ↓
On-chain Verification
    ↓
Delivery URL Released
    ↓
Transaction Recorded
    ↓
View in Profile Modal
```

### Database Records

```typescript
// Transaction created on successful purchase
{
  _id: ObjectId,
  listingId: string,
  buyerWallet: string,
  sellerWallet: string,
  amount: number,
  txnHash: string,           // Solana transaction signature
  deliveryUrl: string,        // Encrypted with AES-256
  status: 'success' | 'failed',
  createdAt: Date
}
```

---

## 🛡️ Admin Dashboard

### Features

- **Listing Review Queue**: Approve/reject pending listings
- **Risk Flagging**: Mark listings as high-risk (future: higher fees for buyback/burn)
- **Pull Listings**: Remove from marketplace
- **Republish**: Restore pulled listings
- **Activity Logs**: Track admin actions

### Access

```
URL: /admin
Auth: Session cookie (admin_session=active)
Code: Set in .env (ADMIN_CODE)
```

### Routes

```
POST /api/admin/login              - Admin authentication
GET  /api/admin/listings           - Get all listings
POST /api/admin/listings/:id/approve   - Approve listing
POST /api/admin/listings/:id/reject    - Reject listing
POST /api/admin/listings/:id/risk      - Flag as high-risk
POST /api/admin/listings/:id/republish - Republish pulled listing
```

---

## 🧪 Development & Testing

### Environment Setup

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Run x402 payment test (devnet)
npm run testx402
```

### Environment Variables

```env
# .env.local
NEXT_PUBLIC_MOCK_MODE=true              # Enable mock mode (no DB)
NEXT_PUBLIC_MOCK_TOKEN_GATING=true      # Bypass token gate
NEXT_PUBLIC_DISABLE_ADMIN=false         # Enable admin panel

# Solana
NEXT_PUBLIC_SOLANA_MAINNET_RPC=https://...
NEXT_PUBLIC_SOLANA_DEVNET_RPC=https://...

# Token Addresses
NEXT_PUBLIC_SRX402_MINT_ADDRESS=49AfJsWb9E7VjBDTdZ2DjnSLFgSEvCoP1wdXuhHbpump
NEXT_PUBLIC_USDC_MINT_MAINNET=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
NEXT_PUBLIC_USDC_MINT_DEVNET=4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU

# Database
MONGODB_URI=mongodb+srv://...

# Security
JWT_SECRET=your-secret-key
APP_SECRET=your-encryption-key
ADMIN_CODE=your-admin-code

# Storage
CLOUDINARY_URL=cloudinary://...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

### Mock Mode

For rapid development without MongoDB:

```typescript
// config/constants.ts
export const CONFIG = {
  MOCK_MODE: process.env.NEXT_PUBLIC_MOCK_MODE === 'true',
  MOCK_TOKEN_GATING_PASSED: process.env.NEXT_PUBLIC_MOCK_TOKEN_GATING === 'true',
};
```

**Features:**
- In-memory data storage
- Persists during server session
- Lost on restart
- See `MOCK_DATA_PERSISTENCE.md` for details

### Testing x402 Payments

```bash
npm run testx402
```

This script:
1. Creates buyer/seller wallets
2. Mints test USDC on devnet
3. Simulates 402 → payment → verification flow
4. Verifies on-chain transaction
5. Confirms balance changes

**Output:**
```
✅ x402 payment flow works perfectly!
✅ Buyer sent 5 TEST-USDC
✅ Seller received 5.00 TEST-USDC
✅ Funds moved successfully
```

---

## 🔒 Security

### Encryption

- **Delivery URLs**: AES-256 encrypted before database storage
- **Decryption**: Only on successful payment verification
- **Key**: `APP_SECRET` environment variable

```typescript
// lib/crypto/encryption.ts
encrypt(deliveryUrl) → ciphertext
decrypt(ciphertext) → deliveryUrl
```

### Authentication

1. **Wallet Signatures**: Users sign messages with ed25519 private key
2. **JWT Tokens**: Session tokens for authenticated requests
3. **Nonce**: Prevent replay attacks
4. **Timestamp**: ±5 minute tolerance for SIWS

### Payment Verification

- Transaction signature must exist on Solana
- Amount must match listing price
- Recipient must match seller wallet
- Token mint must be USDC
- Transaction must be confirmed (not failed)

---

## 📊 Database Models

### User

```typescript
{
  wallet: string (unique),
  hasAcceptedTOS: boolean,
  createdAt: Date
}
```

### Listing

```typescript
{
  wallet: string,              // Seller
  title: string,
  description: string,
  price: number,               // USDC
  category: string,
  imageUrl: string,
  deliveryUrl: string,         // Encrypted
  state: 'in_review' | 'on_market' | 'pulled',
  approved: boolean,
  riskLevel: 'standard' | 'high-risk',
  failedPurchaseCount: number, // Auto-pull after 3
  createdAt: Date,
  updatedAt: Date
}
```

### Transaction

```typescript
{
  listingId: string,
  buyerWallet: string,
  sellerWallet: string,
  amount: number,
  txnHash: string,             // Solana signature
  deliveryUrl: string,         // Encrypted
  status: 'success' | 'failed',
  createdAt: Date
}
```

---

## 🚀 Deployment

### Production Checklist

- [ ] Set `MONGODB_URI` to production cluster
- [ ] Set `NEXT_PUBLIC_MOCK_MODE=false`
- [ ] Set strong `JWT_SECRET` and `APP_SECRET`
- [ ] Configure Cloudinary for file uploads
- [ ] Set up domain with SSL
- [ ] Enable rate limiting
- [ ] Test mainnet USDC transfers
- [ ] Security audit
- [ ] Load testing

### Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables
vercel env add MONGODB_URI
vercel env add JWT_SECRET
# ... (add all env vars)

# Production deploy
vercel --prod
```

### Environment-Specific Config

```typescript
// config/constants.ts
NODE_ENV: 'development' | 'production' | 'test'
```

---

## 📈 Monitoring & Logs

### Winston Logger

```typescript
// lib/logger.ts (to be implemented)
logger.info('Purchase completed', { listingId, amount });
logger.error('Payment verification failed', { error });
```

### Transaction Logs

All purchases create `Transaction` records with:
- Transaction hash (Solana signature)
- Buyer/seller wallets
- Amount
- Status
- Timestamp

Query via:
```typescript
Transaction.find({ buyerWallet: wallet })
Transaction.find({ sellerWallet: wallet })
```

---

## 🔧 Configuration

### Constants

All app constants in `config/constants.ts`:

```typescript
// Token gating
MIN_SRX402_BALANCE = 50000

// Listing limits
TITLE_MIN = 5
TITLE_MAX = 100
PRICE_MIN = 0.10 (USDC)

// Rate limits
LISTINGS_PER_DAY = 5
PURCHASES_PER_HOUR = 3

// Categories
['Trading Bot', 'API Tool', 'Script', 'Custom']
```

---

## 🧩 Key Components

### Frontend

- **`useAuth`**: Wallet connection + token gating
- **`useUSDCBalance`**: Real-time USDC balance display
- **`TokenGateModal`**: 50k requirement UI
- **`ProfileModal`**: Purchase/sale history
- **`Navbar`**: Wallet connection + USDC display

### Backend

- **`/api/purchase`**: x402 payment endpoint
- **`/api/listings`**: CRUD operations
- **`/api/auth/connect`**: Token gating check
- **`/api/transactions`**: Purchase history

---

## 🎓 Learning Resources

### x402 Protocol
- [HTTP 402 RFC](https://www.rfc-editor.org/rfc/rfc9110#status.402)
- [Coinbase x402 Spec](https://github.com/coinbase/x402) (Ethereum-focused)

### Solana Development
- [Solana Web3.js Docs](https://solana-labs.github.io/solana-web3.js/)
- [SPL Token Program](https://spl.solana.com/token)

### Next.js 15
- [App Router](https://nextjs.org/docs/app)
- [Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)

---

## 📝 TODO

### High Priority
- [ ] Production MongoDB setup
- [ ] Mainnet transaction testing
- [ ] Security audit
- [ ] Rate limiting implementation

### Medium Priority
- [ ] Search/filter listings
- [ ] User reputation system
- [ ] Seller profiles
- [ ] Analytics dashboard

### Low Priority
- [ ] Multi-file delivery
- [ ] Subscription listings
- [ ] Dispute resolution

---

## 🤝 Contributing

This is a private repository. For issues or questions, contact the development team.

---

## 📄 License

Proprietary - All rights reserved.

---

## 🔗 Links

- **Token**: [DexScreener](https://dexscreener.com/solana/4dquGRPzcjskMsHtiFagPuguMfY37ywkNMNBg4F54fNW)
- **Community**: [X Community](https://x.com/i/communities/1982622474983637154)
- **GitHub**: [Tanner253](https://github.com/Tanner253)

---

**Built with ❤️ by Tanner253**

