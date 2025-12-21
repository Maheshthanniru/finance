-- Migration: Add image_url column to customers table
-- Run this script in your Supabase SQL Editor

-- Add image_url column to customers table
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN customers.image_url IS 'URL to customer photo in Supabase Storage';

