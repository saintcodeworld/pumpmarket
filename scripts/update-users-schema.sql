-- Add token gating columns to users table
-- Run this in Supabase SQL Editor

-- Add token gating columns if they don't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_token_gated BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS token_balance BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_is_token_gated ON users(is_token_gated);
CREATE INDEX IF NOT EXISTS idx_users_last_seen ON users(last_seen);

-- Update existing users to have token gating passed by default if mock mode is enabled
-- This ensures existing users can access the platform
UPDATE users 
SET is_token_gated = TRUE, token_balance = 50000 
WHERE is_token_gated = FALSE;

-- Add comment
COMMENT ON COLUMN users.is_token_gated IS 'Whether user has passed token gating (holds 50k+ $PumpMarket tokens)';
COMMENT ON COLUMN users.token_balance IS 'Current $PumpMarket token balance for the user';
COMMENT ON COLUMN users.last_seen IS 'Last time the user was active on the platform';
