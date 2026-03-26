-- =============================================================================
-- SilkRoadx402 Supabase Database Schema
-- =============================================================================
-- This SQL creates all required tables for the marketplace
-- Run this in your Supabase project: SQL Editor → New Query

-- Enable UUID extension for unique IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- USERS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  wallet VARCHAR(44) UNIQUE NOT NULL,
  has_accepted_tos BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for wallet lookups
CREATE INDEX IF NOT EXISTS idx_users_wallet ON users(wallet);

-- =============================================================================
-- LISTINGS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS listings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  wallet VARCHAR(44) NOT NULL REFERENCES users(wallet),
  title VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0.10),
  category VARCHAR(50) DEFAULT 'Custom',
  image_url TEXT,
  delivery_url TEXT NOT NULL, -- Will be encrypted
  state VARCHAR(20) DEFAULT 'in_review' CHECK (state IN ('in_review', 'on_market', 'pulled')),
  approved BOOLEAN DEFAULT FALSE,
  risk_level VARCHAR(20) DEFAULT 'standard' CHECK (risk_level IN ('standard', 'high-risk')),
  failed_purchase_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for listings
CREATE INDEX IF NOT EXISTS idx_listings_wallet ON listings(wallet);
CREATE INDEX IF NOT EXISTS idx_listings_state ON listings(state);
CREATE INDEX IF NOT EXISTS idx_listings_category ON listings(category);
CREATE INDEX IF NOT EXISTS idx_listings_approved ON listings(approved);
CREATE INDEX IF NOT EXISTS idx_listings_created_at ON listings(created_at);

-- =============================================================================
-- TRANSACTIONS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  buyer_wallet VARCHAR(44) NOT NULL REFERENCES users(wallet),
  seller_wallet VARCHAR(44) NOT NULL REFERENCES users(wallet),
  amount DECIMAL(10,2) NOT NULL,
  txn_hash VARCHAR(88) UNIQUE NOT NULL, -- Solana transaction signature
  delivery_url TEXT NOT NULL, -- Will be encrypted
  status VARCHAR(20) DEFAULT 'success' CHECK (status IN ('success', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for transactions
CREATE INDEX IF NOT EXISTS idx_transactions_listing_id ON transactions(listing_id);
CREATE INDEX IF NOT EXISTS idx_transactions_buyer_wallet ON transactions(buyer_wallet);
CREATE INDEX IF NOT EXISTS idx_transactions_seller_wallet ON transactions(seller_wallet);
CREATE INDEX IF NOT EXISTS idx_transactions_txn_hash ON transactions(txn_hash);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);

-- =============================================================================
-- REPORTS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  reporter_wallet VARCHAR(44) NOT NULL REFERENCES users(wallet),
  reason VARCHAR(100) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unique index: one report per user per listing
CREATE UNIQUE INDEX IF NOT EXISTS idx_reports_unique ON reports(listing_id, reporter_wallet);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);

-- =============================================================================
-- LOGS TABLE (for system logging)
-- =============================================================================
CREATE TABLE IF NOT EXISTS logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  level VARCHAR(10) NOT NULL CHECK (level IN ('error', 'warn', 'info', 'debug')),
  message TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for logs with TTL (auto-delete after 7 days)
CREATE INDEX IF NOT EXISTS idx_logs_created_at ON logs(created_at);

-- =============================================================================
-- ACTIVE_SESSIONS TABLE (for token gating cache)
-- =============================================================================
CREATE TABLE IF NOT EXISTS active_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id VARCHAR(64) UNIQUE NOT NULL,
  wallet VARCHAR(44) NOT NULL,
  token_balance DECIMAL(20,0) NOT NULL,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create TTL index - auto-delete after 5 minutes
CREATE INDEX IF NOT EXISTS idx_active_sessions_last_seen ON active_sessions(last_seen);

-- =============================================================================
-- CHAT_MESSAGES TABLE (for marketplace chat)
-- =============================================================================
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  wallet VARCHAR(44) NOT NULL REFERENCES users(wallet),
  message TEXT NOT NULL,
  room VARCHAR(50) DEFAULT 'general',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create TTL index - auto-purge after 7 days
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);

-- =============================================================================
-- COMMENTS TABLE (for listing reviews)
-- =============================================================================
CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  buyer_wallet VARCHAR(44) NOT NULL REFERENCES users(wallet),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unique index: one comment per buyer per listing
CREATE UNIQUE INDEX IF NOT EXISTS idx_comments_unique ON comments(listing_id, buyer_wallet);
CREATE INDEX IF NOT EXISTS idx_comments_rating ON comments(rating);

-- =============================================================================
-- FUNDRAISERS TABLE (similar to listings but for fundraising)
-- =============================================================================
CREATE TABLE IF NOT EXISTS fundraisers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  wallet VARCHAR(44) NOT NULL REFERENCES users(wallet),
  title VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0.10),
  goal_amount DECIMAL(10,2) NOT NULL DEFAULT 500,
  raised_amount DECIMAL(10,2) DEFAULT 0,
  category VARCHAR(50) DEFAULT 'Other',
  image_url TEXT,
  demo_video_url TEXT,
  whitepaper_url TEXT,
  github_url TEXT,
  delivery_url TEXT NOT NULL, -- Will be encrypted
  state VARCHAR(20) DEFAULT 'in_review' CHECK (state IN ('in_review', 'on_market', 'pulled')),
  approved BOOLEAN DEFAULT FALSE,
  risk_level VARCHAR(20) DEFAULT 'standard' CHECK (risk_level IN ('standard', 'high-risk')),
  pinned BOOLEAN DEFAULT FALSE,
  pinned_at TIMESTAMP WITH TIME ZONE,
  reports_count INTEGER DEFAULT 0,
  failed_purchase_count INTEGER DEFAULT 0,
  last_failure_at TIMESTAMP WITH TIME ZONE,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for fundraisers
CREATE INDEX IF NOT EXISTS idx_fundraisers_wallet ON fundraisers(wallet);
CREATE INDEX IF NOT EXISTS idx_fundraisers_state ON fundraisers(state);
CREATE INDEX IF NOT EXISTS idx_fundraisers_category ON fundraisers(category);
CREATE INDEX IF NOT EXISTS idx_fundraisers_approved ON fundraisers(approved);

-- =============================================================================
-- RLS (Row Level Security) Policies
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE fundraisers ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (wallet = auth.jwt() ->> 'wallet');
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (wallet = auth.jwt() ->> 'wallet');

-- Anyone can read approved listings
CREATE POLICY "Anyone can view approved listings" ON listings FOR SELECT USING (approved = true);
CREATE POLICY "Sellers can manage own listings" ON listings FOR ALL USING (wallet = auth.jwt() ->> 'wallet');

-- Users can view their own transactions
CREATE POLICY "Users can view own transactions" ON transactions FOR SELECT USING (
  buyer_wallet = auth.jwt() ->> 'wallet' OR 
  seller_wallet = auth.jwt() ->> 'wallet'
);

-- Users can manage their own reports
CREATE POLICY "Users can manage own reports" ON reports FOR ALL USING (reporter_wallet = auth.jwt() ->> 'wallet');

-- Anyone can insert chat messages
CREATE POLICY "Anyone can chat" ON chat_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read chat" ON chat_messages FOR SELECT USING (true);

-- Users can manage their own comments
CREATE POLICY "Users can manage own comments" ON comments FOR ALL USING (buyer_wallet = auth.jwt() ->> 'wallet');

-- =============================================================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_listings_updated_at BEFORE UPDATE ON listings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_fundraisers_updated_at BEFORE UPDATE ON fundraisers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- VIEWS FOR COMMON QUERIES
-- =============================================================================

-- Active listings view
CREATE VIEW active_listings AS
SELECT 
  id, wallet, title, description, price, category, image_url, 
  state, approved, risk_level, created_at, updated_at
FROM listings 
WHERE state = 'on_market' AND approved = true
ORDER BY created_at DESC;

-- User transaction summary view
CREATE VIEW user_transaction_summary AS
SELECT 
  u.wallet,
  COUNT(CASE WHEN t.buyer_wallet = u.wallet THEN 1 END) as purchases,
  COUNT(CASE WHEN t.seller_wallet = u.wallet THEN 1 END) as sales,
  COALESCE(SUM(CASE WHEN t.buyer_wallet = u.wallet THEN t.amount ELSE 0 END), 0) as total_spent,
  COALESCE(SUM(CASE WHEN t.seller_wallet = u.wallet THEN t.amount ELSE 0 END), 0) as total_earned
FROM users u
LEFT JOIN transactions t ON (u.wallet = t.buyer_wallet OR u.wallet = t.seller_wallet)
GROUP BY u.wallet;

-- =============================================================================
-- SAMPLE DATA (OPTIONAL - for testing)
-- =============================================================================

-- Insert sample user (comment out in production)
-- INSERT INTO users (wallet, has_accepted_tos) 
-- VALUES ('11111111111111111111111111111112', true);

-- =============================================================================
-- STORED FUNCTIONS
-- =============================================================================

-- Function to increment fundraiser views
CREATE OR REPLACE FUNCTION increment_views(fundraiser_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE fundraisers 
  SET views = views + 1,
      updated_at = NOW()
  WHERE id = fundraiser_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- COMPLETION MESSAGE
-- =============================================================================
-- Schema created successfully!
-- Next steps:
-- 1. Set up Supabase Auth (optional)
-- 2. Configure API keys in your environment
-- 3. Update application code to use Supabase client
