-- Customers Table Schema for Supabase
-- This table stores all customer information
-- Run this script in your Supabase SQL Editor

-- ============================================
-- CUSTOMERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id INTEGER UNIQUE NOT NULL,
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
CREATE INDEX IF NOT EXISTS idx_customers_customer_id ON customers(customer_id);
CREATE INDEX IF NOT EXISTS idx_customers_aadhaar ON customers(aadhaar);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX IF NOT EXISTS idx_customers_phone1 ON customers(phone1);
CREATE INDEX IF NOT EXISTS idx_customers_village ON customers(village);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================
-- Enable RLS on customers table
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users
CREATE POLICY "Allow all operations on customers" ON customers
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- TRIGGER FOR UPDATED_AT TIMESTAMP
-- ============================================
-- Create or replace the function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at (if not already exists)
DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================
COMMENT ON TABLE customers IS 'Stores customer information for the finance management system';
COMMENT ON COLUMN customers.customer_id IS 'Unique customer identifier (integer)';
COMMENT ON COLUMN customers.aadhaar IS 'Aadhaar number (12 digits)';
COMMENT ON COLUMN customers.name IS 'Customer full name (required)';
COMMENT ON COLUMN customers.father IS 'Father name or guardian name';
COMMENT ON COLUMN customers.address IS 'Complete address of the customer (required)';
COMMENT ON COLUMN customers.village IS 'Village name';
COMMENT ON COLUMN customers.mandal IS 'Mandal name';
COMMENT ON COLUMN customers.district IS 'District name';
COMMENT ON COLUMN customers.phone1 IS 'Primary phone number';
COMMENT ON COLUMN customers.phone2 IS 'Secondary/alternate phone number';
COMMENT ON COLUMN customers.image_url IS 'URL to customer photo in Supabase Storage';

