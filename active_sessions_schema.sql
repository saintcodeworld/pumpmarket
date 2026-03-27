-- =============================================================================
-- UPDATE ACTIVE_SESSIONS TABLE FOR USER ACTIVITY TRACKING
-- =============================================================================
-- This script updates the active_sessions table to match the API requirements
-- Run this in your Supabase project: SQL Editor → New Query

-- Drop existing table if it exists with wrong structure
DROP TABLE IF EXISTS active_sessions CASCADE;

-- Create updated active_sessions table for user activity tracking
CREATE TABLE IF NOT EXISTS active_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id VARCHAR(64) UNIQUE NOT NULL,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  page VARCHAR(255) DEFAULT '/',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create TTL index - auto-delete after 5 minutes
CREATE INDEX IF NOT EXISTS idx_active_sessions_last_seen ON active_sessions(last_seen);

-- Enable RLS
ALTER TABLE active_sessions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert/update sessions (for activity tracking)
CREATE POLICY "Anyone can manage sessions" ON active_sessions FOR ALL WITH CHECK (true);

-- Create trigger for auto-cleanup (optional - Supabase doesn't support auto-cleanup triggers)
-- You'll need to set up a Supabase Edge Function or cron job for cleanup

COMMIT;
