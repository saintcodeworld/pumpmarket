-- =============================================================================
-- AUTH_SESSIONS TABLE FOR X403 AUTHENTICATION
-- =============================================================================
-- This script creates the auth_sessions table for storing x403 authentication sessions
-- Run this in your Supabase project: SQL Editor → New Query

-- Create auth_sessions table for x403 authentication tracking
CREATE TABLE IF NOT EXISTS auth_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  wallet_address VARCHAR(44) UNIQUE NOT NULL,
  session_token VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_auth_sessions_wallet_address ON auth_sessions(wallet_address);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_session_token ON auth_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires_at ON auth_sessions(expires_at);

-- Enable RLS
ALTER TABLE auth_sessions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert/update auth sessions (for authentication)
CREATE POLICY "Anyone can manage auth sessions" ON auth_sessions FOR ALL WITH CHECK (true);

COMMIT;
