-- Migration: Add tables for tracking edited and deleted records
-- Run this script in your Supabase SQL Editor

-- ============================================
-- EDITED LOANS TRACKING TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS loan_edits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  loan_id UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  -- Old values
  o_date DATE,
  o_number INTEGER,
  o_loan_type VARCHAR(10),
  o_customer_name VARCHAR(255),
  o_aadhaar VARCHAR(12),
  o_loan_amount DECIMAL(15, 2),
  -- New values
  n_date DATE,
  n_number INTEGER,
  n_loan_type VARCHAR(10),
  n_customer_name VARCHAR(255),
  n_aadhaar VARCHAR(12),
  n_loan_amount DECIMAL(15, 2),
  -- Metadata
  user_name VARCHAR(255) NOT NULL,
  edited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- DELETED LOANS TRACKING TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS loan_deletions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  loan_id UUID,
  date DATE,
  number INTEGER,
  loan_type VARCHAR(10),
  customer_name VARCHAR(255),
  aadhaar VARCHAR(12),
  loan_amount DECIMAL(15, 2),
  user_name VARCHAR(255) NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- DELETED TRANSACTIONS TRACKING TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS transaction_deletions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id UUID,
  d_date DATE,
  nameofthe_account VARCHAR(255),
  particulars TEXT,
  account_number VARCHAR(50),
  credit DECIMAL(15, 2),
  debit DECIMAL(15, 2),
  user_name VARCHAR(255) NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_loan_edits_loan_id ON loan_edits(loan_id);
CREATE INDEX IF NOT EXISTS idx_loan_edits_edited_at ON loan_edits(edited_at);
CREATE INDEX IF NOT EXISTS idx_loan_edits_user_name ON loan_edits(user_name);

CREATE INDEX IF NOT EXISTS idx_loan_deletions_deleted_at ON loan_deletions(deleted_at);
CREATE INDEX IF NOT EXISTS idx_loan_deletions_user_name ON loan_deletions(user_name);
CREATE INDEX IF NOT EXISTS idx_loan_deletions_date ON loan_deletions(date);

CREATE INDEX IF NOT EXISTS idx_transaction_deletions_deleted_at ON transaction_deletions(deleted_at);
CREATE INDEX IF NOT EXISTS idx_transaction_deletions_user_name ON transaction_deletions(user_name);
CREATE INDEX IF NOT EXISTS idx_transaction_deletions_d_date ON transaction_deletions(d_date);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================
ALTER TABLE loan_edits ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_deletions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_deletions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on loan_edits" ON loan_edits
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on loan_deletions" ON loan_deletions
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on transaction_deletions" ON transaction_deletions
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- FUNCTION TO TRACK LOAN EDITS
-- ============================================
CREATE OR REPLACE FUNCTION track_loan_edit()
RETURNS TRIGGER AS $$
BEGIN
  -- Only track if significant fields changed
  IF OLD.date IS DISTINCT FROM NEW.date OR
     OLD.number IS DISTINCT FROM NEW.number OR
     OLD.loan_type IS DISTINCT FROM NEW.loan_type OR
     OLD.customer_name IS DISTINCT FROM NEW.customer_name OR
     OLD.aadhaar IS DISTINCT FROM NEW.aadhaar OR
     OLD.loan_amount IS DISTINCT FROM NEW.loan_amount THEN
    
    INSERT INTO loan_edits (
      loan_id,
      o_date, o_number, o_loan_type, o_customer_name, o_aadhaar, o_loan_amount,
      n_date, n_number, n_loan_type, n_customer_name, n_aadhaar, n_loan_amount,
      user_name
    ) VALUES (
      NEW.id,
      OLD.date, OLD.number, OLD.loan_type, OLD.customer_name, OLD.aadhaar, OLD.loan_amount,
      NEW.date, NEW.number, NEW.loan_type, NEW.customer_name, NEW.aadhaar, NEW.loan_amount,
      COALESCE(NEW.user_name, 'SYSTEM')
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for loan edits
DROP TRIGGER IF EXISTS trigger_track_loan_edit ON loans;
CREATE TRIGGER trigger_track_loan_edit
  AFTER UPDATE ON loans
  FOR EACH ROW
  WHEN (OLD.is_deleted = false)
  EXECUTE FUNCTION track_loan_edit();

-- ============================================
-- FUNCTION TO TRACK LOAN DELETIONS
-- ============================================
CREATE OR REPLACE FUNCTION track_loan_deletion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_deleted = true AND OLD.is_deleted = false THEN
    INSERT INTO loan_deletions (
      loan_id,
      date, number, loan_type, customer_name, aadhaar, loan_amount,
      user_name
    ) VALUES (
      NEW.id,
      NEW.date, NEW.number, NEW.loan_type, NEW.customer_name, NEW.aadhaar, NEW.loan_amount,
      COALESCE(NEW.user_name, 'SYSTEM')
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for loan deletions
DROP TRIGGER IF EXISTS trigger_track_loan_deletion ON loans;
CREATE TRIGGER trigger_track_loan_deletion
  AFTER UPDATE ON loans
  FOR EACH ROW
  WHEN (NEW.is_deleted = true AND OLD.is_deleted = false)
  EXECUTE FUNCTION track_loan_deletion();

-- ============================================
-- FUNCTION TO TRACK TRANSACTION DELETIONS
-- ============================================
CREATE OR REPLACE FUNCTION track_transaction_deletion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_deleted = true AND OLD.is_deleted = false THEN
    INSERT INTO transaction_deletions (
      transaction_id,
      d_date, nameofthe_account, particulars, account_number, credit, debit,
      user_name
    ) VALUES (
      NEW.id,
      NEW.date, NEW.account_name, NEW.particulars, NEW.number, NEW.credit, NEW.debit,
      COALESCE(NEW.user_name, 'SYSTEM')
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for transaction deletions
DROP TRIGGER IF EXISTS trigger_track_transaction_deletion ON transactions;
CREATE TRIGGER trigger_track_transaction_deletion
  AFTER UPDATE ON transactions
  FOR EACH ROW
  WHEN (NEW.is_deleted = true AND OLD.is_deleted = false)
  EXECUTE FUNCTION track_transaction_deletion();

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================
COMMENT ON TABLE loan_edits IS 'Tracks all edits made to loan records';
COMMENT ON TABLE loan_deletions IS 'Tracks all deleted loan records';
COMMENT ON TABLE transaction_deletions IS 'Tracks all deleted transaction records';

