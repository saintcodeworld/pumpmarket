# 🚀 Production Setup Guide for SilkRoadx402

This guide walks you through setting up all production services and migrating from MongoDB to Supabase.

## 📋 Overview

**What you'll get:**
- ✅ Production-ready environment variables
- ✅ Supabase PostgreSQL database (replaces MongoDB)
- ✅ Real Solana RPC endpoints
- ✅ Production image storage
- ✅ Security and monitoring setup

**Time required:** ~30 minutes
**Cost:** ~$0-50/month (depending on services)

---

## 🔑 Step 1: Supabase Database (Required)

**⏰ Time: 10 minutes**
**Cost: Free tier available**

### 1.1 Create Supabase Account
1. Go to https://supabase.com/
2. Click "Start your project" → "Sign up with GitHub"
3. Verify your email

### 1.2 Create New Project
1. Click "New Project"
2. Choose organization (create one if needed)
3. **Project Settings:**
   - Name: `silkroadx402`
   - Database Password: Generate strong password (save it!)
   - Region: Choose closest to your users
   - Click "Create new project"

### 1.3 Get Database Credentials
1. Wait for project to be created (2-3 minutes)
2. Go to **Settings** → **Database**
3. Copy **Connection string** (PostgreSQL)
4. Go to **Settings** → **API**
5. Copy **Project URL**, **anon key**, and **service_role key**

### 1.4 Run Database Schema
1. Go to **SQL Editor** → **New query**
2. Copy the entire contents of `supabase-schema.sql`
3. Paste and click "Run"
4. Verify all tables were created

### 1.5 Add to Environment
```bash
# Add these to your .env.local:
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
SUPABASE_DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT_REF.supabase.co:5432/postgres
```

---

## 🔗 Step 2: Solana RPC Endpoints (Required)

**⏰ Time: 5 minutes**
**Cost: $0-20/month**

### 2.1 Choose Provider
**Option A: Helius (Recommended)**
1. Go to https://www.helius.dev/
2. Click "Sign up" → Create account
3. Go to dashboard → Create new project
4. Choose "Growth" plan ($9/month for production)
5. Copy your API key

**Option B: QuickNode**
1. Go to https://www.quicknode.com/
2. Sign up and create account
3. Create Solana endpoint
4. Copy endpoint URL

### 2.2 Add to Environment
```bash
# Replace with your actual API key
NEXT_PUBLIC_SOLANA_MAINNET_RPC=https://mainnet.helius-rpc.com/?api-key=YOUR_API_KEY
NEXT_PUBLIC_SOLANA_DEVNET_RPC=https://devnet.helius-rpc.com/?api-key=YOUR_API_KEY
```

---

## 🌐 Step 3: Cloudinary Image Storage (Required)

**⏰ Time: 3 minutes**
**Cost: $0-89/month**

### 3.1 Create Production Account
1. Go to https://cloudinary.com/pricing
2. Choose "Plus" plan ($89/month) for production
3. Or start with free tier for testing
4. Complete signup

### 3.2 Get Production Credentials
1. Go to Dashboard → Settings
2. Copy:
   - **Cloud name**
   - **API Key**
   - **API Secret**

### 3.3 Add to Environment
```bash
CLOUDINARY_URL=cloudinary://YOUR_API_KEY:YOUR_API_SECRET@YOUR_CLOUD_NAME
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-numeric-api-key
CLOUDINARY_API_SECRET=your-api-secret-key
```

---

## 🔐 Step 4: Security Keys (Required)

**⏰ Time: 2 minutes**
**Cost: Free**

### 4.1 Generate Strong Keys
```bash
# Generate JWT Secret (64+ characters)
openssl rand -base64 64

# Generate App Secret (64+ characters)
openssl rand -base64 64

# Generate Admin Code
# Choose something secure but memorable
```

### 4.2 Add to Environment
```bash
JWT_SECRET=your_generated_64_char_jwt_secret
APP_SECRET=your_generated_64_char_app_secret
ADMIN_CODE=your_secure_admin_code
```

---

## 🛡️ Step 5: reCAPTCHA (Recommended)

**⏰ Time: 3 minutes**
**Cost: Free**

### 5.1 Create reCAPTCHA Keys
1. Go to https://www.google.com/recaptcha/admin
2. Sign in with Google account
3. Click "+" to register
4. **Settings:**
   - Label: "SilkRoadx402 Production"
   - reCAPTCHA type: "reCAPTCHA v2"
   - Domains: `your-domain.com`
   - Accept terms and submit
5. Copy **Site Key** and **Secret Key**

### 5.2 Add to Environment
```bash
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your_site_key_here
RECAPTCHA_SECRET_KEY=your_secret_key_here
```

---

## 📊 Step 6: Monitoring (Optional)

**⏰ Time: 5 minutes**
**Cost: Free tier available**

### 6.1 Sentry (Error Tracking)
1. Go to https://sentry.io/
2. Create new organization
3. Create new project (Next.js)
4. Copy DSN

### 6.2 Add to Environment
```bash
SENTRY_DSN=your_sentry_dsn_here
```

---

## 🎯 Step 7: Final Environment Configuration

### 7.1 Update .env.local
Copy `.env.production` to `.env.local` and fill in all your actual values:

```bash
cp .env.production .env.local
```

### 7.2 Disable Mock Mode
```bash
# Make sure these are set to false:
NEXT_PUBLIC_MOCK_MODE=false
NEXT_PUBLIC_MOCK_TOKEN_GATING=false
```

### 7.3 Set Production URL
```bash
NEXT_PUBLIC_APP_URL=https://your-domain.com
NODE_ENV=production
```

---

## 🧪 Step 8: Test Your Setup

### 8.1 Install Dependencies
```bash
npm install
```

### 8.2 Test Database Connection
```bash
# Test Supabase connection
npm run dev
# Check console for "✅ Supabase connected"
```

### 8.3 Test x402 Payments
```bash
# Test payment flow on devnet
npm run testx402
```

---

## 🚀 Step 9: Deploy to Production

### 9.1 Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to production
vercel --prod

# Add environment variables in Vercel dashboard
vercel env add SUPABASE_URL
vercel env add SUPABASE_ANON_KEY
# ... add all other variables
```

### 9.2 Other Platforms
- **Railway**: Easy deployment with database
- **DigitalOcean**: Full control
- **AWS**: Enterprise scale

---

## 🔍 Troubleshooting

### Database Issues
```bash
# Check Supabase connection
SELECT 1;

# Verify tables exist
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
```

### RPC Issues
- Check API key is valid
- Verify endpoint is accessible
- Try different provider if slow

### Environment Issues
- Restart server after changing .env.local
- Verify no typos in variable names
- Check for missing required variables

---

## 📁 Environment Variables Checklist

Copy this checklist and mark when complete:

- [ ] `NEXT_PUBLIC_MOCK_MODE=false`
- [ ] `NEXT_PUBLIC_MOCK_TOKEN_GATING=false`
- [ ] `NEXT_PUBLIC_SOLANA_MAINNET_RPC`
- [ ] `NEXT_PUBLIC_SOLANA_DEVNET_RPC`
- [ ] `SUPABASE_URL`
- [ ] `SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `SUPABASE_DATABASE_URL`
- [ ] `JWT_SECRET` (64+ chars)
- [ ] `APP_SECRET` (64+ chars)
- [ ] `ADMIN_CODE`
- [ ] `CLOUDINARY_URL`
- [ ] `CLOUDINARY_CLOUD_NAME`
- [ ] `CLOUDINARY_API_KEY`
- [ ] `CLOUDINARY_API_SECRET`
- [ ] `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`
- [ ] `RECAPTCHA_SECRET_KEY`
- [ ] `NEXT_PUBLIC_APP_URL`
- [ ] `NODE_ENV=production`

---

## 🎉 You're Ready!

Your SilkRoadx402 marketplace is now configured for production with:
- ✅ Supabase PostgreSQL database
- ✅ Real Solana blockchain integration
- ✅ Production image storage
- ✅ Security best practices
- ✅ Monitoring capabilities

**Next steps:**
1. Test all functionality
2. Deploy to production
3. Set up domain and SSL
4. Monitor performance

Happy building! 🚀
