-- ============================================
-- CASH BOOK ENTRY FORM - DATABASE MIGRATION
-- IMPORTANT: Run this SQL in your Supabase SQL Editor
-- ============================================
-- This migration ensures all tables match the schema
-- and adds optimizations for the Cash Book Entry Form
-- ============================================

-- ============================================
-- 1. ENSURE TRANSACTIONS TABLE STRUCTURE
-- ============================================
-- The transactions table already supports Cash Book entries
-- but let's ensure it has optimal structure and indexes

-- Add transaction_type column if it doesn't exist (optional enhancement to categorize entries)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transactions' AND column_name = 'transaction_type'
  ) THEN
    ALTER TABLE transactions 
    ADD COLUMN transaction_type VARCHAR(50) DEFAULT 'cash_book_entry';
    
    COMMENT ON COLUMN transactions.transaction_type IS 
    'Type of transaction: cash_book_entry, loan_transaction, capital_entry, etc.';
  END IF;
END $$;

-- ============================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- ============================================

-- Index on account_name for faster lookups in Cash Book form
CREATE INDEX IF NOT EXISTS idx_transactions_account_name 
ON transactions(account_name);

-- Index on date for date-based queries
CREATE INDEX IF NOT EXISTS idx_transactions_date 
ON transactions(date DESC);

-- Index on entry_time for chronological ordering
CREATE INDEX IF NOT EXISTS idx_transactions_entry_time 
ON transactions(entry_time DESC);

-- Index on transaction_type if column exists
CREATE INDEX IF NOT EXISTS idx_transactions_type 
ON transactions(transaction_type) 
WHERE transaction_type IS NOT NULL;

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_transactions_date_account 
ON transactions(date DESC, account_name);

-- Index on is_deleted for filtering active transactions
CREATE INDEX IF NOT EXISTS idx_transactions_is_deleted 
ON transactions(is_deleted) 
WHERE is_deleted = false;

-- ============================================
-- 3. ENSURE ALL REQUIRED COLUMNS EXIST
-- ============================================

-- Ensure account_name is NOT NULL (required for Cash Book)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transactions' 
    AND column_name = 'account_name' 
    AND is_nullable = 'YES'
  ) THEN
    -- First, update any NULL values to empty string if any exist
    UPDATE transactions SET account_name = '' WHERE account_name IS NULL;
    -- Then alter to NOT NULL
    ALTER TABLE transactions ALTER COLUMN account_name SET NOT NULL;
  END IF;
END $$;

-- Ensure particulars is NOT NULL
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transactions' 
    AND column_name = 'particulars' 
    AND is_nullable = 'YES'
  ) THEN
    UPDATE transactions SET particulars = '' WHERE particulars IS NULL;
    ALTER TABLE transactions ALTER COLUMN particulars SET NOT NULL;
  END IF;
END $$;

-- Ensure user_name is NOT NULL
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transactions' 
    AND column_name = 'user_name' 
    AND is_nullable = 'YES'
  ) THEN
    UPDATE transactions SET user_name = 'SYSTEM' WHERE user_name IS NULL;
    ALTER TABLE transactions ALTER COLUMN user_name SET NOT NULL;
  END IF;
END $$;

-- ============================================
-- 4. ADD COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE transactions IS 
'Financial transactions table - supports Cash Book entries, loan transactions, and other financial records';

COMMENT ON COLUMN transactions.account_name IS 
'Head of Account - The account name/head (e.g., "NPA A/C", "INTEREST A", "EXP A/C")';

COMMENT ON COLUMN transactions.particulars IS 
'Transaction particulars/details - Description of the transaction';

COMMENT ON COLUMN transactions.rno IS 
'Receipt number or reference number - Optional';

COMMENT ON COLUMN transactions.number IS 
'Account number or loan number - Optional';

COMMENT ON COLUMN transactions.credit IS 
'Credit amount - Money received';

COMMENT ON COLUMN transactions.debit IS 
'Debit amount - Money paid out';

-- ============================================
-- 5. CREATE VIEW FOR CASH BOOK ENTRIES
-- ============================================
-- Optional: A view that filters specifically for Cash Book entries
-- This makes querying Cash Book entries easier

CREATE OR REPLACE VIEW cash_book_entries AS
SELECT 
  id,
  date,
  account_name AS head_of_account,
  number AS account_number,
  particulars,
  debit,
  credit,
  rno,
  user_name,
  entry_time,
  created_at,
  updated_at
FROM transactions
WHERE is_deleted = false
ORDER BY date DESC, entry_time DESC;

COMMENT ON VIEW cash_book_entries IS 
'View of all active Cash Book entries, ordered by date and entry time';

-- ============================================
-- 6. CREATE FUNCTION FOR CASH BOOK ENTRY STATS
-- ============================================
-- Optional: Function to get summary statistics

CREATE OR REPLACE FUNCTION get_cash_book_summary(
  start_date DATE DEFAULT NULL,
  end_date DATE DEFAULT NULL
)
RETURNS TABLE (
  total_entries BIGINT,
  total_credit NUMERIC,
  total_debit NUMERIC,
  balance NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_entries,
    COALESCE(SUM(credit), 0)::NUMERIC as total_credit,
    COALESCE(SUM(debit), 0)::NUMERIC as total_debit,
    COALESCE(SUM(credit - debit), 0)::NUMERIC as balance
  FROM transactions
  WHERE is_deleted = false
    AND (start_date IS NULL OR date >= start_date)
    AND (end_date IS NULL OR date <= end_date);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_cash_book_summary IS 
'Get summary statistics for Cash Book entries within a date range';

-- ============================================
-- 7. CREATE TRIGGER FOR UPDATED_AT
-- ============================================
-- Ensure updated_at is automatically updated

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;
CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 8. VERIFY STRUCTURE
-- ============================================

-- Check that all required columns exist
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'transactions'
ORDER BY ordinal_position;

-- Check indexes
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'transactions'
ORDER BY indexname;

-- ============================================
-- 9. SAMPLE QUERY TO TEST
-- ============================================
-- Uncomment to test after migration:

-- SELECT * FROM cash_book_entries LIMIT 10;
-- SELECT * FROM get_cash_book_summary();

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- The transactions table is now optimized for Cash Book Entry Form
-- All indexes are in place for optimal performance
-- Views and functions are available for easy querying
-- ============================================
