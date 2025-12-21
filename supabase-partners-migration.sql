-- Migration: Add new fields to partners table
-- Run this script in your Supabase SQL Editor

-- Add new columns to partners table
ALTER TABLE partners 
ADD COLUMN IF NOT EXISTS partner_id INTEGER,
ADD COLUMN IF NOT EXISTS is_md BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS md_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS village VARCHAR(255),
ADD COLUMN IF NOT EXISTS home_phone VARCHAR(20);

-- Create index on partner_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_partners_partner_id ON partners(partner_id);

-- Create index on is_md for filtering MD partners
CREATE INDEX IF NOT EXISTS idx_partners_is_md ON partners(is_md);

-- Update the updated_at timestamp trigger (if not already exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at (if not already exists)
DROP TRIGGER IF EXISTS update_partners_updated_at ON partners;
CREATE TRIGGER update_partners_updated_at
    BEFORE UPDATE ON partners
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

