-- ============================================
-- COMPLETE SCHEMA MIGRATION
-- IMPORTANT: Run this SQL in your Supabase SQL Editor
-- ============================================
-- This ensures all tables match the provided schema exactly
-- Run this after CASHBOOK_MIGRATION.sql
-- ============================================

-- ============================================
-- 1. CUSTOMERS TABLE
-- ============================================

-- Ensure image_url exists (if not already added)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'customers' AND column_name = 'image_url'
  ) THEN
    ALTER TABLE customers ADD COLUMN image_url TEXT;
  END IF;
END $$;

-- Ensure customer_id is unique
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'customers' 
    AND constraint_name = 'customers_customer_id_key'
  ) THEN
    ALTER TABLE customers ADD CONSTRAINT customers_customer_id_key UNIQUE (customer_id);
  END IF;
END $$;

-- Add indexes for customers
CREATE INDEX IF NOT EXISTS idx_customers_customer_id ON customers(customer_id);
CREATE INDEX IF NOT EXISTS idx_customers_aadhaar ON customers(aadhaar) WHERE aadhaar IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);

-- ============================================
-- 2. GUARANTORS TABLE
-- ============================================

-- Ensure image_url exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'guarantors' AND column_name = 'image_url'
  ) THEN
    ALTER TABLE guarantors ADD COLUMN image_url TEXT;
  END IF;
END $$;

-- Ensure guarantor_id is unique
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'guarantors' 
    AND constraint_name = 'guarantors_guarantor_id_key'
  ) THEN
    ALTER TABLE guarantors ADD CONSTRAINT guarantors_guarantor_id_key UNIQUE (guarantor_id);
  END IF;
END $$;

-- Add indexes for guarantors
CREATE INDEX IF NOT EXISTS idx_guarantors_guarantor_id ON guarantors(guarantor_id);
CREATE INDEX IF NOT EXISTS idx_guarantors_aadhaar ON guarantors(aadhaar) WHERE aadhaar IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_guarantors_name ON guarantors(name);

-- ============================================
-- 3. PARTNERS TABLE
-- ============================================

-- Add indexes for partners
CREATE INDEX IF NOT EXISTS idx_partners_name ON partners(name);
CREATE INDEX IF NOT EXISTS idx_partners_partner_id ON partners(partner_id) WHERE partner_id IS NOT NULL;

-- ============================================
-- 4. LOANS TABLE
-- ============================================

-- Ensure all image URL columns exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'loans' AND column_name = 'customer_image_url'
  ) THEN
    ALTER TABLE loans ADD COLUMN customer_image_url TEXT;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'loans' AND column_name = 'guarantor1_image_url'
  ) THEN
    ALTER TABLE loans ADD COLUMN guarantor1_image_url TEXT;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'loans' AND column_name = 'guarantor2_image_url'
  ) THEN
    ALTER TABLE loans ADD COLUMN guarantor2_image_url TEXT;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'loans' AND column_name = 'partner_image_url'
  ) THEN
    ALTER TABLE loans ADD COLUMN partner_image_url TEXT;
  END IF;
END $$;

-- Ensure foreign key to partners exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'loans' 
    AND constraint_name = 'loans_partner_id_fkey'
  ) THEN
    ALTER TABLE loans 
    ADD CONSTRAINT loans_partner_id_fkey 
    FOREIGN KEY (partner_id) REFERENCES partners(id);
  END IF;
END $$;

-- Add indexes for loans
CREATE INDEX IF NOT EXISTS idx_loans_number ON loans(number);
CREATE INDEX IF NOT EXISTS idx_loans_date ON loans(date DESC);
CREATE INDEX IF NOT EXISTS idx_loans_loan_type ON loans(loan_type);
CREATE INDEX IF NOT EXISTS idx_loans_partner_id ON loans(partner_id) WHERE partner_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_loans_is_deleted ON loans(is_deleted) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_loans_customer_name ON loans(customer_name);

-- ============================================
-- 5. INSTALLMENTS TABLE
-- ============================================

-- Ensure foreign key to loans exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'installments' 
    AND constraint_name = 'installments_loan_id_fkey'
  ) THEN
    ALTER TABLE installments 
    ADD CONSTRAINT installments_loan_id_fkey 
    FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add indexes for installments
CREATE INDEX IF NOT EXISTS idx_installments_loan_id ON installments(loan_id);
CREATE INDEX IF NOT EXISTS idx_installments_due_date ON installments(due_date);
CREATE INDEX IF NOT EXISTS idx_installments_sn ON installments(loan_id, sn);

-- ============================================
-- 6. TRANSACTIONS TABLE (Already handled in CASHBOOK_MIGRATION.sql)
-- ============================================
-- Indexes and structure already created in CASHBOOK_MIGRATION.sql

-- ============================================
-- 7. CREATE UPDATED_AT TRIGGERS FOR ALL TABLES
-- ============================================

-- Function already created in CASHBOOK_MIGRATION.sql
-- Just add triggers to other tables

DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_guarantors_updated_at ON guarantors;
CREATE TRIGGER update_guarantors_updated_at
    BEFORE UPDATE ON guarantors
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_partners_updated_at ON partners;
CREATE TRIGGER update_partners_updated_at
    BEFORE UPDATE ON partners
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_loans_updated_at ON loans;
CREATE TRIGGER update_loans_updated_at
    BEFORE UPDATE ON loans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_installments_updated_at ON installments;
CREATE TRIGGER update_installments_updated_at
    BEFORE UPDATE ON installments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 8. VERIFY ALL TABLES
-- ============================================

-- List all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- All tables now match the provided schema
-- All indexes are in place for optimal performance
-- All foreign key relationships are established
-- ============================================
