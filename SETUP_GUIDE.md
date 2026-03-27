# 🔑 Environment Setup Guide for SilkRoadx402

Follow these steps to get all the required API keys and credentials for your project.

## 📋 Quick Start (Development Only)

If you just want to test the app locally without external services:

1. Copy `.env.example` to `.env.local`
2. Set only these variables:
   ```env
   NEXT_PUBLIC_MOCK_MODE=true
   NEXT_PUBLIC_MOCK_TOKEN_GATING=true
   NEXT_PUBLIC_DISABLE_ADMIN=false
   ```
3. Run `npm run dev` - The app will work with in-memory storage!

---

## 🚀 Full Setup Guide

### 1. Solana RPC Endpoints (Required for blockchain)

**Options:**
- **Helius** (Recommended): https://www.helius.dev/
- **QuickNode**: https://www.quicknode.com/
- **Alchemy**: https://www.alchemy.com/
- **Public endpoints** (limited rate limits)

**Steps:**
1. Go to https://www.helius.dev/
2. Click "Sign Up" and create a free account
3. Go to your dashboard
4. Create a new project
5. Copy your RPC endpoint URL
6. Replace `YOUR_HELIUS_KEY` in your .env.local

**Example:**
```
NEXT_PUBLIC_SOLANA_MAINNET_RPC=https://mainnet.helius-rpc.com/?api-key=abc123-def456-ghi789
NEXT_PUBLIC_SOLANA_DEVNET_RPC=https://devnet.helius-rpc.com/?api-key=abc123-def456-ghi789
```

---

### 2. MongoDB Atlas (Database)

**Steps:**
1. Go to https://www.mongodb.com/cloud/atlas
2. Click "Try Free" and create an account
3. Create a new project (name it "silkroad")
4. Click "Build a Database"
5. Choose "M0 Sandbox" (free tier)
6. Select a cloud provider and region (closest to you)
7. Leave cluster name as default or change to "silkroad-cluster"
8. Click "Create Cluster"
9. **Create Database User:**
   - Username: `silkroad-admin` (or your choice)
   - Password: Generate a strong password
10. **Add IP Address:**
    - Click "Add My Current IP Address" (for local development)
    - Or add `0.0.0.0/0` (allows access from anywhere)
11. Click "Finish and Close"
12. **Get Connection String:**
    - Click "Connect" → "Drivers"
    - Copy the MongoDB URI
    - Replace `<password>` with your actual password
    - Replace `<database>` with `silkroad`

**Example:**
```
MONGODB_URI=mongodb+srv://silkroad-admin:YourStrongPassword123@silkroad-cluster.mongodb.net/silkroad?retryWrites=true&w=majority
```

---

### 3. Security Keys (Generate yourself)

**JWT Secret:**
```bash
# Generate a random 32+ character string
openssl rand -base64 32
# Or use an online generator like https://randomkeygen.com/
```

**App Secret:**
```bash
# Generate another random 32+ character string
openssl rand -base64 32
```

**Admin Code:**
```bash
# Create a simple code for admin access
# Example: ADMIN_CODE=admin123secret
```

**Example:**
```
JWT_SECRET=U2FsdGVkX1+vupppZksvRf5pq5g5XjFRIipRkwB0K1Y96Qsv2Lm+31cmzaAILwyt
APP_SECRET=7cY9B2pW3sR8kF1jM5nX6qZ4vL8hG2dA9cE3fT1jK5nP8rQ2wS6vX4zN7mB1cD3
ADMIN_CODE=admin123secret
```

---

### 4. Cloudinary (Image Uploads)

**Steps:**
1. Go to https://cloudinary.com/
2. Click "Sign up for free"
3. Fill in your details (free tier includes 25 credits/month)
4. Verify your email
5. Go to your Dashboard
6. You'll see your:
   - **Cloud name** (e.g., `demo`)
   - **API Key** (numeric, e.g., `123456789012345`)
   - **API Secret** (e.g., `abc123def456`)

**Build Cloudinary URL:**
```
CLOUDINARY_URL=cloudinary://API_KEY:API_SECRET@CLOUD_NAME
```

**Example:**
```
CLOUDINARY_URL=cloudinary://123456789012345:abc123def456@demo
CLOUDINARY_CLOUD_NAME=demo
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abc123def456
```

---

### 5. Optional: reCAPTCHA (Security)

**Steps:**
1. Go to https://www.google.com/recaptcha/
2. Click "v3 Admin Console"
3. Sign in with Google account
4. Click "+" to register a new site
5. Label: "SilkRoadx402"
6. Domains: `localhost` (for development), `yourdomain.com` (for production)
7. Choose "reCAPTCHA v2" ("I'm not a robot" Checkbox)
8. Accept terms and submit
9. Copy your Site Key and Secret Key

**Example:**
```
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=6LeIxAcTAAAAAJcZVRqyHh71UMIEbQjYyV4z4kKy
RECAPTCHA_SECRET_KEY=6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe
```

---

## 🎯 Final Setup

1. **Copy the example file:**
   ```bash
   cp .env.example .env.local
   ```

2. **Fill in your actual values** in `.env.local`

3. **Test your setup:**
   ```bash
   npm install
   npm run dev
   ```

4. **Test x402 payments:**
   ```bash
   npm run testx402
   ```

---

## 🔍 Troubleshooting

**MongoDB Connection Issues:**
- Make sure IP whitelist includes your IP
- Check username/password are correct
- Verify database name in connection string

**Solana RPC Issues:**
- Free RPC endpoints have rate limits
- Try different providers if one is slow
- For production, use paid RPC plans

**Cloudinary Issues:**
- Verify API key and secret are correct
- Check cloud name matches your account
- Free tier has limits (25 credits/month)

**General Tips:**
- Never commit `.env.local` to Git
- Use different values for development vs production
- Keep secrets secure and don't share them

---

## 📞 Need Help?

If you get stuck on any step:
1. Check the service's documentation
2. Verify you copied keys correctly
3. Make sure your account is verified
4. Try the development-only setup first

Happy coding! 🚀
