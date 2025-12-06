-- Finance Management Database Schema for Supabase
-- Run this SQL in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Partners table
CREATE TABLE IF NOT EXISTS partners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Loans table
CREATE TABLE IF NOT EXISTS loans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  number INTEGER NOT NULL,
  date TEXT NOT NULL,
  loan_type TEXT NOT NULL CHECK (loan_type IN ('CD', 'HP', 'STBD', 'TBD', 'FD', 'OD', 'RD')),
  customer_name TEXT NOT NULL,
  father_name TEXT,
  aadhaar TEXT,
  c_no TEXT,
  address TEXT NOT NULL,
  phone1 TEXT,
  phone2 TEXT,
  guarantor1_name TEXT,
  guarantor1_aadhaar TEXT,
  guarantor1_phone TEXT,
  guarantor2_name TEXT,
  guarantor2_aadhaar TEXT,
  guarantor2_phone TEXT,
  particulars TEXT,
  loan_amount DECIMAL(15, 2) NOT NULL,
  rate_of_interest DECIMAL(5, 2),
  period INTEGER NOT NULL,
  document_charges DECIMAL(15, 2),
  partner_id UUID REFERENCES partners(id),
  partner_name TEXT,
  user_name TEXT NOT NULL,
  entry_time TEXT NOT NULL,
  -- CD Loan specific fields
  receipt_no INTEGER,
  rate DECIMAL(5, 2),
  amount_paid DECIMAL(15, 2),
  present_interest DECIMAL(15, 2),
  total_balance DECIMAL(15, 2),
  document_status TEXT,
  document_type TEXT,
  loan_date TEXT,
  due_date TEXT,
  due_days INTEGER,
  next_due_date TEXT,
  penalty DECIMAL(15, 2),
  total_amt_for_renewal DECIMAL(15, 2),
  total_amt_for_close DECIMAL(15, 2),
  document_returned BOOLEAN DEFAULT FALSE,
  -- STBD Loan specific fields
  account_number INTEGER,
  inst_paying_receipt_no INTEGER,
  installment_amount DECIMAL(15, 2),
  total_installments INTEGER,
  last_date TEXT,
  total_amount DECIMAL(15, 2),
  late_fees DECIMAL(15, 2),
  total_payable DECIMAL(15, 2),
  -- TBD Loan specific fields
  premium DECIMAL(15, 2),
  premium_days INTEGER,
  paid_amount DECIMAL(15, 2),
  paid_days INTEGER,
  due_amount DECIMAL(15, 2),
  total_days INTEGER,
  joined_date TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,
  is_deleted BOOLEAN DEFAULT FALSE,
  edited_at TIMESTAMP WITH TIME ZONE,
  is_edited BOOLEAN DEFAULT FALSE
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date TEXT NOT NULL,
  account_name TEXT NOT NULL,
  particulars TEXT NOT NULL,
  rno TEXT,
  number TEXT,
  credit DECIMAL(15, 2) NOT NULL DEFAULT 0,
  debit DECIMAL(15, 2) NOT NULL DEFAULT 0,
  user_name TEXT NOT NULL,
  entry_time TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,
  is_deleted BOOLEAN DEFAULT FALSE,
  edited_at TIMESTAMP WITH TIME ZONE,
  is_edited BOOLEAN DEFAULT FALSE
);

-- Installments table (for HP/STBD loans)
CREATE TABLE IF NOT EXISTS installments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  loan_id UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  sn INTEGER NOT NULL,
  due_date TEXT NOT NULL,
  installment_amount DECIMAL(15, 2) NOT NULL,
  paid_amount DECIMAL(15, 2) DEFAULT 0,
  due_amount DECIMAL(15, 2) NOT NULL,
  paid_date TEXT,
  due_days INTEGER DEFAULT 0,
  penalty DECIMAL(15, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customers table (derived from loans)
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  father_name TEXT,
  aadhaar TEXT,
  c_no TEXT,
  address TEXT,
  phone1 TEXT,
  phone2 TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_loans_date ON loans(date);
CREATE INDEX IF NOT EXISTS idx_loans_loan_type ON loans(loan_type);
CREATE INDEX IF NOT EXISTS idx_loans_customer_name ON loans(customer_name);
CREATE INDEX IF NOT EXISTS idx_loans_partner_id ON loans(partner_id);
CREATE INDEX IF NOT EXISTS idx_loans_number ON loans(number);
CREATE INDEX IF NOT EXISTS idx_loans_is_deleted ON loans(is_deleted);

CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_account_name ON transactions(account_name);
CREATE INDEX IF NOT EXISTS idx_transactions_is_deleted ON transactions(is_deleted);

CREATE INDEX IF NOT EXISTS idx_installments_loan_id ON installments(loan_id);

CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX IF NOT EXISTS idx_customers_phone1 ON customers(phone1);

-- Enable Row Level Security (RLS) - adjust policies as needed
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations (adjust based on your security needs)
CREATE POLICY "Allow all operations on partners" ON partners FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on loans" ON loans FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on transactions" ON transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on installments" ON installments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on customers" ON customers FOR ALL USING (true) WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to automatically update updated_at
CREATE TRIGGER update_partners_updated_at BEFORE UPDATE ON partners
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_loans_updated_at BEFORE UPDATE ON loans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_installments_updated_at BEFORE UPDATE ON installments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

