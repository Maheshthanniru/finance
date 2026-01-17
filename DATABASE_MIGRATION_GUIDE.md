# Database Migration Guide for Cash Book Entry Form

## Overview

This guide explains how to set up and migrate your database to support the Cash Book Entry Form feature.

## Migration Files

Two migration files have been created:

1. **CASHBOOK_MIGRATION.sql** - Optimizations specifically for Cash Book Entry Form
2. **SCHEMA_MIGRATION.sql** - Complete schema alignment with all tables

## Step-by-Step Migration Instructions

### Step 1: Run CASHBOOK_MIGRATION.sql

This migration:
- Adds `transaction_type` column to categorize transactions (optional enhancement)
- Creates indexes for optimal performance on Cash Book queries
- Ensures required columns are NOT NULL
- Creates a `cash_book_entries` view for easy querying
- Creates a `get_cash_book_summary()` function for statistics
- Adds automatic `updated_at` trigger

**How to run:**
1. Open your Supabase Dashboard
2. Go to SQL Editor
3. Copy and paste the contents of `CASHBOOK_MIGRATION.sql`
4. Click "Run" or press Ctrl+Enter

### Step 2: Run SCHEMA_MIGRATION.sql

This migration:
- Ensures all tables match the provided schema exactly
- Adds missing columns (image_url, etc.)
- Creates all necessary indexes
- Establishes foreign key relationships
- Adds `updated_at` triggers to all tables

**How to run:**
1. In the same SQL Editor (or new query)
2. Copy and paste the contents of `SCHEMA_MIGRATION.sql`
3. Click "Run" or press Ctrl+Enter

## What Gets Created/Modified

### Tables (No changes - already exist)
- ✅ `customers` - Customer master data
- ✅ `guarantors` - Guarantor information
- ✅ `partners` - Partner information
- ✅ `loans` - Loan records
- ✅ `installments` - Installment schedules
- ✅ `transactions` - Financial transactions (used for Cash Book)

### New Columns Added
- `transactions.transaction_type` - Optional: Categorizes transaction type
  - Default: `'cash_book_entry'`
  - Other possible values: `'loan_transaction'`, `'capital_entry'`, etc.

### Indexes Created
For optimal performance, the following indexes are created:

**On transactions table:**
- `idx_transactions_account_name` - Fast account lookups
- `idx_transactions_date` - Date-based queries
- `idx_transactions_entry_time` - Chronological ordering
- `idx_transactions_type` - Filter by transaction type
- `idx_transactions_date_account` - Composite index for common queries
- `idx_transactions_is_deleted` - Filter active transactions

**On other tables:**
- Indexes on customer_id, guarantor_id, loan numbers, dates, etc.

### Views Created
- `cash_book_entries` - View that shows all active Cash Book entries
  ```sql
  SELECT * FROM cash_book_entries;
  ```

### Functions Created
- `get_cash_book_summary(start_date, end_date)` - Get summary statistics
  ```sql
  SELECT * FROM get_cash_book_summary();
  SELECT * FROM get_cash_book_summary('2024-01-01', '2024-12-31');
  ```

## Code Changes Made

### TypeScript Types Updated
- `Transaction` interface now includes optional `transactionType` field

### Data Layer Updated
- `mapTransactionFromDb()` - Maps `transaction_type` from database
- `mapTransactionToDb()` - Maps `transactionType` to database, defaults to `'cash_book_entry'`

### Cash Book Form Updated
- Automatically sets `transactionType: 'cash_book_entry'` for all entries

## Verification

After running migrations, verify the setup:

```sql
-- Check transactions table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'transactions'
ORDER BY ordinal_position;

-- Check indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'transactions';

-- Test the view
SELECT * FROM cash_book_entries LIMIT 10;

-- Test the function
SELECT * FROM get_cash_book_summary();
```

## Usage

### Cash Book Entry Form
The Cash Book Entry Form (`/cashbook`) automatically:
1. Uses the `transactions` table
2. Sets `transaction_type = 'cash_book_entry'`
3. Saves entries with proper validation
4. Displays all entries in the subform table

### Querying Cash Book Entries
```sql
-- Get all cash book entries
SELECT * FROM cash_book_entries;

-- Get entries for specific date
SELECT * FROM cash_book_entries 
WHERE date = '2024-01-17';

-- Get entries for date range
SELECT * FROM cash_book_entries 
WHERE date BETWEEN '2024-01-01' AND '2024-01-31';

-- Get summary
SELECT * FROM get_cash_book_summary('2024-01-01', '2024-01-31');
```

## Performance Optimization

The migrations add several indexes for optimal performance:
- Queries by account name are fast
- Date-based queries are optimized
- Composite indexes support common query patterns
- Soft-deleted records are filtered efficiently

## Notes

1. **Backward Compatibility**: The `transaction_type` column is optional. Existing code will continue to work without it.

2. **Default Values**: If `transaction_type` is NULL, it defaults to `'cash_book_entry'` in the application layer.

3. **Existing Data**: Existing transactions will have `transaction_type = NULL` or `'cash_book_entry'` (if you set a default during migration).

4. **Views**: The `cash_book_entries` view filters out deleted transactions automatically.

## Troubleshooting

### Error: Column already exists
- If you see errors about columns already existing, that's fine. The migrations use `IF NOT EXISTS` checks.

### Error: Index already exists
- Similar to above, indexes use `IF NOT EXISTS` checks.

### Error: Constraint already exists
- Foreign key constraints are checked before creation.

### Performance Issues
- If queries are slow, check that indexes were created:
  ```sql
  SELECT * FROM pg_indexes WHERE tablename = 'transactions';
  ```

## Next Steps

1. ✅ Run `CASHBOOK_MIGRATION.sql`
2. ✅ Run `SCHEMA_MIGRATION.sql`
3. ✅ Verify tables and indexes
4. ✅ Test Cash Book Entry Form in the application
5. ✅ Check that entries are saving correctly

## Support

If you encounter any issues:
1. Check the Supabase logs for SQL errors
2. Verify your database connection
3. Ensure all required columns exist
4. Check that RLS policies allow transactions

---

**Migration Date**: Run as needed  
**Status**: Ready to execute  
**Compatibility**: Supabase PostgreSQL
