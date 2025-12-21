-- ============================================
-- IMPORTANT: Run this SQL in your Supabase SQL Editor
-- ============================================
-- This adds the image_url column to the customers table
-- which is required for customer photo uploads

-- Add image_url column to customers table
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN customers.image_url IS 'URL to customer photo in Supabase Storage';

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'customers' AND column_name = 'image_url';

