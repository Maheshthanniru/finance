-- Guarantors Table Schema for Supabase
-- This table stores all guarantor information
-- Run this script in your Supabase SQL Editor

-- ============================================
-- GUARANTORS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS guarantors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  guarantor_id INTEGER UNIQUE NOT NULL,
  aadhaar VARCHAR(12),
  name VARCHAR(255) NOT NULL,
  father VARCHAR(255),
  address TEXT NOT NULL,
  village VARCHAR(255),
  mandal VARCHAR(255),
  district VARCHAR(255),
  phone1 VARCHAR(20),
  phone2 VARCHAR(20),
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_guarantors_guarantor_id ON guarantors(guarantor_id);
CREATE INDEX IF NOT EXISTS idx_guarantors_aadhaar ON guarantors(aadhaar);
CREATE INDEX IF NOT EXISTS idx_guarantors_name ON guarantors(name);
CREATE INDEX IF NOT EXISTS idx_guarantors_phone1 ON guarantors(phone1);
CREATE INDEX IF NOT EXISTS idx_guarantors_village ON guarantors(village);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================
-- Enable RLS on guarantors table
ALTER TABLE guarantors ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users
CREATE POLICY "Allow all operations on guarantors" ON guarantors
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- TRIGGER FOR UPDATED_AT TIMESTAMP
-- ============================================
-- Create or replace the function for updated_at (if not already exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at (if not already exists)
DROP TRIGGER IF EXISTS update_guarantors_updated_at ON guarantors;
CREATE TRIGGER update_guarantors_updated_at
    BEFORE UPDATE ON guarantors
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE guarantors IS 'Stores guarantor information';
COMMENT ON COLUMN guarantors.guarantor_id IS 'Unique guarantor ID number';
COMMENT ON COLUMN guarantors.aadhaar IS 'Aadhaar number (12 digits)';
COMMENT ON COLUMN guarantors.name IS 'Guarantor full name';
COMMENT ON COLUMN guarantors.father IS 'Father name';
COMMENT ON COLUMN guarantors.address IS 'Full address';
COMMENT ON COLUMN guarantors.image_url IS 'URL to guarantor image in Supabase Storage';

