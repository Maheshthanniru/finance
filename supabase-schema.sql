-- Finance Management Database Schema for Supabase
-- Run this script in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PARTNERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS partners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- LOANS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS loans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  number INTEGER NOT NULL,
  date DATE NOT NULL,
  loan_type VARCHAR(10) NOT NULL CHECK (loan_type IN ('CD', 'HP', 'STBD', 'TBD', 'FD', 'OD', 'RD')),
  customer_name VARCHAR(255) NOT NULL,
  father_name VARCHAR(255),
  aadhaar VARCHAR(12),
  c_no VARCHAR(50),
  address TEXT NOT NULL,
  phone1 VARCHAR(20),
  phone2 VARCHAR(20),
  guarantor1_name VARCHAR(255),
  guarantor1_aadhaar VARCHAR(12),
  guarantor1_phone VARCHAR(20),
  guarantor2_name VARCHAR(255),
  guarantor2_aadhaar VARCHAR(12),
  guarantor2_phone VARCHAR(20),
  particulars TEXT,
  loan_amount DECIMAL(15, 2) NOT NULL,
  rate_of_interest DECIMAL(5, 2),
  period INTEGER NOT NULL,
  document_charges DECIMAL(10, 2),
  partner_id UUID REFERENCES partners(id),
  partner_name VARCHAR(255),
  user_name VARCHAR(255) NOT NULL,
  entry_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Image URLs for Supabase Storage
  customer_image_url TEXT,
  guarantor1_image_url TEXT,
  guarantor2_image_url TEXT,
  partner_image_url TEXT,
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TRANSACTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  account_name VARCHAR(255) NOT NULL,
  particulars TEXT NOT NULL,
  rno VARCHAR(50),
  number VARCHAR(50),
  credit DECIMAL(15, 2) NOT NULL DEFAULT 0,
  debit DECIMAL(15, 2) NOT NULL DEFAULT 0,
  user_name VARCHAR(255) NOT NULL,
  entry_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INSTALLMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS installments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  loan_id UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  sn INTEGER NOT NULL,
  due_date DATE NOT NULL,
  installment_amount DECIMAL(15, 2) NOT NULL,
  paid_amount DECIMAL(15, 2) DEFAULT 0,
  due_amount DECIMAL(15, 2) NOT NULL,
  paid_date DATE,
  due_days INTEGER DEFAULT 0,
  penalty DECIMAL(15, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(loan_id, sn)
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_loans_date ON loans(date);
CREATE INDEX IF NOT EXISTS idx_loans_loan_type ON loans(loan_type);
CREATE INDEX IF NOT EXISTS idx_loans_customer_name ON loans(customer_name);
CREATE INDEX IF NOT EXISTS idx_loans_partner_id ON loans(partner_id);
CREATE INDEX IF NOT EXISTS idx_loans_is_deleted ON loans(is_deleted);
CREATE INDEX IF NOT EXISTS idx_loans_number ON loans(number);

CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_account_name ON transactions(account_name);
CREATE INDEX IF NOT EXISTS idx_transactions_is_deleted ON transactions(is_deleted);

CREATE INDEX IF NOT EXISTS idx_customers_customer_id ON customers(customer_id);
CREATE INDEX IF NOT EXISTS idx_customers_aadhaar ON customers(aadhaar);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);

CREATE INDEX IF NOT EXISTS idx_installments_loan_id ON installments(loan_id);
CREATE INDEX IF NOT EXISTS idx_installments_due_date ON installments(due_date);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================
-- Enable RLS on all tables
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE installments ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users (adjust based on your auth requirements)
-- For now, allowing all operations for anon users (you may want to restrict this in production)

-- Partners policies
CREATE POLICY "Allow all operations on partners" ON partners
  FOR ALL USING (true) WITH CHECK (true);

-- Customers policies
CREATE POLICY "Allow all operations on customers" ON customers
  FOR ALL USING (true) WITH CHECK (true);

-- Loans policies
CREATE POLICY "Allow all operations on loans" ON loans
  FOR ALL USING (true) WITH CHECK (true);

-- Transactions policies
CREATE POLICY "Allow all operations on transactions" ON transactions
  FOR ALL USING (true) WITH CHECK (true);

-- Installments policies
CREATE POLICY "Allow all operations on installments" ON installments
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- FUNCTIONS FOR UPDATED_AT TIMESTAMP
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_partners_updated_at BEFORE UPDATE ON partners
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_loans_updated_at BEFORE UPDATE ON loans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_installments_updated_at BEFORE UPDATE ON installments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- STORAGE BUCKET SETUP
-- ============================================
-- Create storage bucket for loan images
INSERT INTO storage.buckets (id, name, public)
VALUES ('loan-images', 'loan-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for loan-images bucket
CREATE POLICY "Allow public read access to loan images"
ON storage.objects FOR SELECT
USING (bucket_id = 'loan-images');

CREATE POLICY "Allow authenticated users to upload loan images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'loan-images');

CREATE POLICY "Allow authenticated users to update loan images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'loan-images');

CREATE POLICY "Allow authenticated users to delete loan images"
ON storage.objects FOR DELETE
USING (bucket_id = 'loan-images');

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================
COMMENT ON TABLE partners IS 'Stores partner information';
COMMENT ON TABLE customers IS 'Stores customer information';
COMMENT ON TABLE loans IS 'Stores loan details with customer and guarantor information, including image URLs';
COMMENT ON TABLE transactions IS 'Stores all financial transactions (credit/debit entries)';
COMMENT ON TABLE installments IS 'Stores installment details for installment-based loans (STBD, HP)';
COMMENT ON COLUMN loans.customer_image_url IS 'URL to customer/loan person image in Supabase Storage';
COMMENT ON COLUMN loans.guarantor1_image_url IS 'URL to guarantor 1/surety person image in Supabase Storage';
COMMENT ON COLUMN loans.guarantor2_image_url IS 'URL to guarantor 2 image in Supabase Storage';
COMMENT ON COLUMN loans.partner_image_url IS 'URL to partner image in Supabase Storage';
