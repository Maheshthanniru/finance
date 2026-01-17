# Cash Book Entry Form - Table Structure

## Table Used: `transactions`

The **Cash Book Entry Form** uses the existing **`transactions`** table. This is the same table used for all financial transactions in the system (loans, capital entries, etc.).

---

## Table Schema

```sql
CREATE TABLE public.transactions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  date date NOT NULL,
  account_name character varying NOT NULL,           -- Head of A/c
  particulars text NOT NULL,                         -- Transaction description
  rno character varying,                             -- Receipt number (optional)
  number character varying,                          -- Account number (optional)
  credit numeric NOT NULL DEFAULT 0,                 -- Credit amount
  debit numeric NOT NULL DEFAULT 0,                  -- Debit amount
  user_name character varying NOT NULL,              -- User who created entry
  entry_time timestamp with time zone DEFAULT now(), -- When entry was created
  transaction_type character varying(50),            -- 'cash_book_entry', 'loan_transaction', etc. (optional)
  is_deleted boolean DEFAULT false,                  -- Soft delete flag
  deleted_at timestamp with time zone,               -- When deleted (if soft deleted)
  created_at timestamp with time zone DEFAULT now(), -- Record creation time
  updated_at timestamp with time zone DEFAULT now(), -- Last update time
  CONSTRAINT transactions_pkey PRIMARY KEY (id)
);
```

---

## Field Mapping: Form → Database

| Form Field | Database Column | Type | Required | Notes |
|------------|----------------|------|----------|-------|
| **Date** | `date` | DATE | ✅ Yes | Transaction date |
| **Head of A/c** | `account_name` | VARCHAR | ✅ Yes | Account head name (e.g., "NPA A/C", "INTEREST A") |
| **Account_Number** | `number` | VARCHAR | ❌ Optional | Account or loan number |
| **Account_Number** | `rno` | VARCHAR | ❌ Optional | Receipt number (same as number) |
| **Particulars** | `particulars` | TEXT | ✅ Yes | Transaction description |
| **Credit** | `credit` | NUMERIC | ✅ Yes | Credit amount (default: 0.00) |
| **Debit** | `debit` | NUMERIC | ✅ Yes | Debit amount (default: 0.00) |
| - | `user_name` | VARCHAR | ✅ Yes | Auto-set to "RAMESH" |
| - | `entry_time` | TIMESTAMP | ✅ Yes | Auto-set to current timestamp |
| - | `transaction_type` | VARCHAR | ❌ Optional | Auto-set to "cash_book_entry" |
| - | `id` | UUID | ✅ Yes | Auto-generated |
| - | `created_at` | TIMESTAMP | ✅ Yes | Auto-set |
| - | `updated_at` | TIMESTAMP | ✅ Yes | Auto-set |

---

## Example Entry

When you fill out the Cash Book Entry Form:

**Form Input:**
- Date: `2024-01-17`
- Head of A/c: `NPA A/C`
- Account_Number: `8360`
- Particulars: `BUDIGE MAHESH`
- Debit: `11.00`
- Credit: `0.00`

**Database Record:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "date": "2024-01-17",
  "account_name": "NPA A/C",
  "particulars": "BUDIGE MAHESH",
  "number": "8360",
  "rno": "8360",
  "credit": 0.00,
  "debit": 11.00,
  "user_name": "RAMESH",
  "entry_time": "2024-01-17T10:30:00Z",
  "transaction_type": "cash_book_entry",
  "is_deleted": false,
  "created_at": "2024-01-17T10:30:00Z",
  "updated_at": "2024-01-17T10:30:00Z"
}
```

---

## View: `cash_book_entries`

For easier querying, a view is available that shows only Cash Book entries:

```sql
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
```

**Usage:**
```sql
-- Get all cash book entries
SELECT * FROM cash_book_entries;

-- Get entries for a specific date
SELECT * FROM cash_book_entries WHERE date = '2024-01-17';

-- Get entries for date range
SELECT * FROM cash_book_entries 
WHERE date BETWEEN '2024-01-01' AND '2024-01-31';
```

---

## Validation Rules

1. **Date**: Required, must be a valid date
2. **Head of A/c**: Required, cannot be empty
3. **Particulars**: Required, cannot be empty
4. **Credit or Debit**: At least one must be > 0
5. **Both Credit and Debit**: Cannot both be > 0 (must choose one)

---

## Indexes for Performance

The following indexes are created for optimal query performance:

```sql
-- Fast account name lookups
CREATE INDEX idx_transactions_account_name ON transactions(account_name);

-- Date-based queries
CREATE INDEX idx_transactions_date ON transactions(date DESC);

-- Chronological ordering
CREATE INDEX idx_transactions_entry_time ON transactions(entry_time DESC);

-- Transaction type filtering
CREATE INDEX idx_transactions_type ON transactions(transaction_type);

-- Composite index for common queries
CREATE INDEX idx_transactions_date_account ON transactions(date DESC, account_name);

-- Filter active transactions
CREATE INDEX idx_transactions_is_deleted ON transactions(is_deleted) WHERE is_deleted = false;
```

---

## API Endpoints

The Cash Book Entry Form uses these API endpoints:

### Save Entry
```typescript
POST /api/transactions
Content-Type: application/json

{
  "date": "2024-01-17",
  "accountName": "NPA A/C",
  "particulars": "BUDIGE MAHESH",
  "number": "8360",
  "rno": "8360",
  "credit": 0,
  "debit": 11.00,
  "userName": "RAMESH",
  "entryTime": "2024-01-17T10:30:00Z",
  "transactionType": "cash_book_entry"
}
```

### Get All Entries
```typescript
GET /api/transactions
```

Returns all transactions (including cash book entries).

---

## Summary Statistics Function

A function is available to get summary statistics:

```sql
-- Get overall summary
SELECT * FROM get_cash_book_summary();

-- Get summary for date range
SELECT * FROM get_cash_book_summary('2024-01-01', '2024-01-31');
```

**Returns:**
- `total_entries`: Number of entries
- `total_credit`: Sum of all credits
- `total_debit`: Sum of all debits
- `balance`: Total credit - total debit

---

## Notes

1. **No Separate Table**: The Cash Book Entry Form uses the same `transactions` table as other financial entries. The `transaction_type` field distinguishes cash book entries from others.

2. **Soft Delete**: Entries are not physically deleted. The `is_deleted` flag marks them as deleted.

3. **Auto-Generated Fields**: 
   - `id`: UUID generated by database
   - `entry_time`: Current timestamp when saved
   - `created_at`: Record creation time
   - `updated_at`: Automatically updated on changes

4. **User Name**: Currently hardcoded to "RAMESH" in the form. Can be made dynamic if user authentication is added.

---

## Migration Status

✅ Table structure: Ready  
✅ Indexes: Created in `CASHBOOK_MIGRATION.sql`  
✅ View: Created in `CASHBOOK_MIGRATION.sql`  
✅ Function: Created in `CASHBOOK_MIGRATION.sql`  
✅ Code integration: Complete  

Run `CASHBOOK_MIGRATION.sql` to set up indexes, views, and functions!
