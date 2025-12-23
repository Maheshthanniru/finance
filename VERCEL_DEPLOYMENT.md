# Vercel Deployment Guide

This guide will help you deploy your Finance Management application to Vercel and configure the database connection.

## Prerequisites

1. A Vercel account (sign up at [vercel.com](https://vercel.com))
2. Your Supabase project credentials
3. Your code pushed to a Git repository (GitHub, GitLab, or Bitbucket)

## Step 1: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New Project"
3. Import your Git repository
4. Vercel will auto-detect Next.js settings
5. Click "Deploy"

## Step 2: Configure Environment Variables

**This is the most important step!** Without these, your database won't work in production.

1. In your Vercel project dashboard, go to **Settings** → **Environment Variables**
2. Add the following environment variables:

### Required Variables

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### How to Get Your Supabase Credentials

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → Use as `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → Use as `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Adding Variables in Vercel

1. Click "Add New" in Environment Variables
2. For each variable:
   - **Name**: `NEXT_PUBLIC_SUPABASE_URL` (or `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
   - **Value**: Paste your credential
   - **Environment**: Select **Production**, **Preview**, and **Development** (or at least Production)
3. Click "Save"
4. Repeat for the second variable

## Step 3: Redeploy Your Application

After adding environment variables:

1. Go to **Deployments** tab
2. Click the three dots (⋯) on your latest deployment
3. Click "Redeploy"
4. Or push a new commit to trigger a new deployment

**Important**: Environment variables are only applied to new deployments. You must redeploy after adding/changing them.

## Step 4: Verify the Deployment

1. Open your deployed application URL
2. Try to:
   - Create a new customer
   - Create a new loan
   - Create a new partner
3. Check the browser console (F12) for any errors
4. Check Vercel Function Logs:
   - Go to **Deployments** → Click on your deployment → **Functions** tab
   - Look for any error messages

## Troubleshooting

### Issue: Forms not saving data

**Symptoms**: 
- Forms submit successfully but data doesn't appear
- No error messages shown

**Solutions**:
1. ✅ **Check Environment Variables**: 
   - Go to Vercel Dashboard → Settings → Environment Variables
   - Verify both `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set
   - Make sure they're set for **Production** environment

2. ✅ **Redeploy After Adding Variables**:
   - Environment variables only apply to new deployments
   - Go to Deployments → Redeploy your latest deployment

3. ✅ **Check Function Logs**:
   - Go to Deployments → Click deployment → Functions tab
   - Look for error messages like "Database not configured" or "Supabase environment variables are missing"

4. ✅ **Verify Supabase Credentials**:
   - Double-check the values match your `.env.local` file
   - Make sure there are no extra spaces or quotes
   - The URL should start with `https://` and end with `.supabase.co`

5. ✅ **Check Supabase Project Status**:
   - Go to Supabase Dashboard
   - Make sure your project is active and not paused
   - Check if you've hit any usage limits

### Issue: "Database not configured" error

This means environment variables are missing or incorrect.

1. Check Vercel Environment Variables are set correctly
2. Redeploy the application
3. Verify the variable names are exactly:
   - `NEXT_PUBLIC_SUPABASE_URL` (not `SUPABASE_URL`)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (not `SUPABASE_ANON_KEY`)

### Issue: CORS errors

If you see CORS errors in the browser console:

1. Go to Supabase Dashboard → Settings → API
2. Check "Allowed Origins" or "CORS Settings"
3. Add your Vercel domain (e.g., `https://your-app.vercel.app`)

### Issue: Database connection works locally but not on Vercel

**Common causes**:
1. Environment variables not set in Vercel
2. Environment variables set but not redeployed
3. Wrong environment variable names
4. Supabase project paused or deleted

**Fix**:
1. Verify variables in Vercel dashboard
2. Redeploy the application
3. Check Supabase project is active

## Testing Your Deployment

After deployment, test these features:

1. **Customer Form** (`/customers/new`):
   - Create a new customer
   - Verify it appears in the customers list

2. **Loan Form** (`/loans/new`):
   - Create a new loan
   - Verify it appears in the loans list

3. **Partner Form** (`/partners/new`):
   - Create a new partner
   - Verify it appears in the partners list

4. **Reports**:
   - Check if reports load correctly
   - Verify data appears in reports

## Additional Notes

- **Environment Variables**: Variables starting with `NEXT_PUBLIC_` are exposed to the browser. This is required for Supabase client-side operations.
- **Security**: The `anon` key is safe to expose to the browser. Supabase Row Level Security (RLS) policies protect your data.
- **Database Schema**: Make sure you've run the `supabase-schema.sql` script in your Supabase SQL Editor before deploying.

## Need Help?

If you're still experiencing issues:

1. Check Vercel Function Logs for detailed error messages
2. Check browser console (F12) for client-side errors
3. Verify your Supabase project is active and accessible
4. Make sure your database schema is set up correctly in Supabase

