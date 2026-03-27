-- =============================================================================
-- Update Fundraisers Table Schema Migration
-- =============================================================================
-- Run this in your Supabase project: SQL Editor → New Query
-- This will add missing columns to the fundraisers table

-- Add missing columns if they don't exist
DO $$
BEGIN
    -- Add price column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'fundraisers' AND column_name = 'price') THEN
        ALTER TABLE fundraisers ADD COLUMN price DECIMAL(10,2) NOT NULL DEFAULT 0.10;
        ALTER TABLE fundraisers ADD CONSTRAINT fundraisers_price_check 
            CHECK (price >= 0.10);
    END IF;

    -- Add raised_amount column (rename current_amount if it exists)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'fundraisers' AND column_name = 'raised_amount') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'fundraisers' AND column_name = 'current_amount') THEN
            ALTER TABLE fundraisers RENAME COLUMN current_amount TO raised_amount;
        ELSE
            ALTER TABLE fundraisers ADD COLUMN raised_amount DECIMAL(10,2) DEFAULT 0;
        END IF;
    END IF;

    -- Add demo_video_url column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'fundraisers' AND column_name = 'demo_video_url') THEN
        ALTER TABLE fundraisers ADD COLUMN demo_video_url TEXT;
    END IF;

    -- Add whitepaper_url column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'fundraisers' AND column_name = 'whitepaper_url') THEN
        ALTER TABLE fundraisers ADD COLUMN whitepaper_url TEXT;
    END IF;

    -- Add github_url column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'fundraisers' AND column_name = 'github_url') THEN
        ALTER TABLE fundraisers ADD COLUMN github_url TEXT;
    END IF;

    -- Add pinned column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'fundraisers' AND column_name = 'pinned') THEN
        ALTER TABLE fundraisers ADD COLUMN pinned BOOLEAN DEFAULT FALSE;
    END IF;

    -- Add pinned_at column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'fundraisers' AND column_name = 'pinned_at') THEN
        ALTER TABLE fundraisers ADD COLUMN pinned_at TIMESTAMP WITH TIME ZONE;
    END IF;

    -- Add reports_count column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'fundraisers' AND column_name = 'reports_count') THEN
        ALTER TABLE fundraisers ADD COLUMN reports_count INTEGER DEFAULT 0;
    END IF;

    -- Add failed_purchase_count column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'fundraisers' AND column_name = 'failed_purchase_count') THEN
        ALTER TABLE fundraisers ADD COLUMN failed_purchase_count INTEGER DEFAULT 0;
    END IF;

    -- Add last_failure_at column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'fundraisers' AND column_name = 'last_failure_at') THEN
        ALTER TABLE fundraisers ADD COLUMN last_failure_at TIMESTAMP WITH TIME ZONE;
    END IF;

    -- Add views column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'fundraisers' AND column_name = 'views') THEN
        ALTER TABLE fundraisers ADD COLUMN views INTEGER DEFAULT 0;
    END IF;

    -- Update category default to 'Other' if needed
    UPDATE fundraisers SET category = 'Other' WHERE category = 'Custom';

END $$;

-- Create missing indexes
CREATE INDEX IF NOT EXISTS idx_fundraisers_pinned ON fundraisers(pinned);
CREATE INDEX IF NOT EXISTS idx_fundraisers_pinned_at ON fundraisers(pinned_at);
CREATE INDEX IF NOT EXISTS idx_fundraisers_views ON fundraisers(views);

-- Create or replace the increment_views function
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
-- Fundraisers table schema updated successfully!
-- The table now has all required columns for the fundraiser service.
