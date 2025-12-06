# Supabase Setup Guide

This guide will help you connect your Finance Management application to Supabase.

## Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in your project details:
   - Name: `finance-management` (or your preferred name)
   - Database Password: Choose a strong password
   - Region: Choose the closest region to your users
5. Click "Create new project"

## Step 2: Get Your Supabase Credentials

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)

## Step 3: Set Up Environment Variables

1. Create a `.env.local` file in the root of your project (if it doesn't exist)
2. Add the following variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

Replace `your_project_url_here` and `your_anon_key_here` with the values from Step 2.

## Step 4: Run the Database Schema

1. In your Supabase project dashboard, go to **SQL Editor**
2. Click "New query"
3. Open the `supabase-schema.sql` file from this project
4. Copy and paste the entire SQL script into the SQL Editor
5. Click "Run" to execute the script
6. Verify that all tables were created successfully:
   - `partners`
   - `loans`
   - `transactions`
   - `installments`
   - `customers`

## Step 5: Verify the Setup

1. Make sure your `.env.local` file is configured correctly
2. Restart your Next.js development server:
   ```bash
   npm run dev
   ```
3. Open your application at `http://localhost:3000`
4. Try creating a loan or transaction to verify the database connection

## Troubleshooting

### Error: Missing Supabase environment variables
- Make sure `.env.local` exists in the project root
- Verify the variable names are exactly: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Restart your development server after creating/updating `.env.local`

### Error: Row Level Security (RLS) blocking queries
- The schema includes RLS policies that allow all operations
- If you encounter permission errors, check the RLS policies in Supabase Dashboard → Authentication → Policies

### Database connection issues
- Verify your Supabase project is active (not paused)
- Check that your IP address is not blocked
- Ensure you're using the correct project URL and anon key

## Next Steps

- Consider setting up authentication if needed
- Review and adjust RLS policies based on your security requirements
- Set up database backups in Supabase dashboard
- Consider adding indexes for frequently queried fields

