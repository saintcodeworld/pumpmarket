# Vercel Environment Variables Setup

## Required Environment Variables for Vercel Deployment

Copy these variables to your Vercel project settings (Project Settings > Environment Variables):

### 🔐 Security Keys (Generate these yourself)
```
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
APP_SECRET=your-super-secret-encryption-key-min-32-chars
ADMIN_CODE=your-admin-access-code
```

### 🌐 Solana Blockchain RPC Endpoints
```
NEXT_PUBLIC_SOLANA_MAINNET_RPC=https://mainnet.helius-rpc.com/?api-key=YOUR_HELIUS_KEY
NEXT_PUBLIC_SOLANA_DEVNET_RPC=https://devnet.helius-rpc.com/?api-key=YOUR_HELIUS_KEY
```

### 🗄️ Supabase Database (Most Important)
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
SUPABASE_URL=your-supabase-project-url
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
SUPABASE_DATABASE_URL=postgresql://user:pass@host:port/dbname
```

### 📸 Cloudinary (Image Uploads)
```
CLOUDINARY_URL=cloudinary://your-api-key:your-api-secret@your-cloud-name
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-numeric-api-key
CLOUDINARY_API_SECRET=your-api-secret-key
```

### 🔗 x402 Payment Protocol
```
X402_FACILITATOR_URL_DEVNET=https://devnet.x402.org/api
X402_FACILITATOR_URL_MAINNET=https://x402.org/api
```

### 🎯 Token Addresses (Fixed - No Changes Needed)
```
NEXT_PUBLIC_SRX402_MINT_ADDRESS=9y3ZHj6DTLKShcZr6JJVdZXHvph5m9QhyQmxpnBBpump
NEXT_PUBLIC_SRX402_DEXSCREENER_URL=https://dexscreener.com/solana/9y3ZHj6DTLKShcZr6JJVdZXHvph5m9QhyQmxpnBBpump
NEXT_PUBLIC_USDC_MINT_MAINNET=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
NEXT_PUBLIC_USDC_MINT_DEVNET=4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU
```

### 🌍 App Configuration
```
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
NODE_ENV=production
```

### 🚀 Development Settings (For Production)
```
NEXT_PUBLIC_MOCK_MODE=false
NEXT_PUBLIC_MOCK_TOKEN_GATING=false
NEXT_PUBLIC_DISABLE_ADMIN=false
```

---

## 🔧 Setup Instructions

### 1. Supabase Setup (Most Important)
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Run the SQL from `supabase-schema.sql` in the Supabase SQL Editor
4. Get your credentials from Project Settings > API
5. Add the Supabase variables above

### 2. Solana RPC Setup
1. Get a free Helius account: [helius.dev](https://www.helius.dev/)
2. Create API keys for mainnet and devnet
3. Add the RPC URLs above

### 3. Security Keys
Generate strong random strings:
```bash
# Generate JWT secret
openssl rand -base64 32

# Generate app secret  
openssl rand -base64 32

# Generate admin code
openssl rand -base64 16
```

### 4. Cloudinary Setup (Optional)
1. Get a free Cloudinary account: [cloudinary.com](https://cloudinary.com/)
2. Get your credentials from Dashboard
3. Add the Cloudinary variables above

### 5. x402 Protocol (Optional)
1. Register at [x402.org](https://x402.org/)
2. Get your facilitator URLs
3. Add the x402 variables above

---

## 🚀 Quick Deploy

1. **Connect Vercel to GitHub**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository

2. **Add Environment Variables**
   - Copy all the variables above to Vercel
   - Make sure to replace placeholder values

3. **Deploy**
   - Click "Deploy"
   - Wait for deployment to complete

4. **Test**
   - Visit your deployed app
   - Test wallet connection
   - Test fundraiser functionality

---

## 🎯 Critical Variables for Basic Functionality

For the app to work at minimum, you need:
- ✅ Supabase credentials (database)
- ✅ Solana RPC endpoints  
- ✅ Security keys (JWT, APP_SECRET, ADMIN_CODE)

Everything else is optional for basic functionality.

---

## 🔍 Troubleshooting

### Common Issues:
1. **Database connection failed** → Check Supabase credentials
2. **RPC connection failed** → Check Solana RPC URLs
3. **Build failed** → Check for missing environment variables
4. **Token gating still active** → Set `NEXT_PUBLIC_MOCK_TOKEN_GATING=false`

### Debug Mode:
Add these to see more logs:
```
DEBUG=*
NODE_ENV=development
```

---

## 📞 Support

If you need help:
1. Check Vercel deployment logs
2. Check Supabase logs
3. Review the README.md in the project
4. Check the PRODUCTION_SETUP_GUIDE.md file
