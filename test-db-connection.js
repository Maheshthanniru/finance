/**
 * Database Connection Test Script
 * Run with: node test-db-connection.js
 * 
 * This script tests if all database tables are connected and accessible.
 * 
 * Requirements:
 * - Create a .env.local file in project root with:
 *   NEXT_PUBLIC_SUPABASE_URL=your_url
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
 * 
 * OR set environment variables before running:
 *   set NEXT_PUBLIC_SUPABASE_URL=your_url (Windows)
 *   export NEXT_PUBLIC_SUPABASE_URL=your_url (Linux/Mac)
 */

// Try to load dotenv if available (optional)
try {
  require('dotenv').config({ path: '.env.local' });
} catch (e) {
  // dotenv not installed, that's okay - use environment variables directly
}

async function testDatabaseConnection() {
  console.log('🔍 Testing Database Connection...\n');
  
  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  console.log('📋 Environment Variables Check:');
  console.log(`  NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? '✅ Set' : '❌ Missing'}`);
  console.log(`  NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseKey ? '✅ Set' : '❌ Missing'}\n`);
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ ERROR: Missing required environment variables!');
    console.error('Please create a .env.local file with:');
    console.error('  NEXT_PUBLIC_SUPABASE_URL=your_url');
    console.error('  NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key\n');
    process.exit(1);
  }
  
  // Test Supabase connection
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log('🔗 Testing Supabase Connection...');
    console.log(`  URL: ${supabaseUrl}\n`);
    
    // Test each table
    const tables = [
      { name: 'loans', description: 'Loan records' },
      { name: 'transactions', description: 'Financial transactions' },
      { name: 'partners', description: 'Partner information' },
      { name: 'customers', description: 'Customer master data' },
      { name: 'guarantors', description: 'Guarantor data' },
      { name: 'installments', description: 'Installment schedules' }
    ];
    
    console.log('📊 Testing Database Tables:\n');
    
    let allConnected = true;
    
    for (const table of tables) {
      try {
        const { data, error, count } = await supabase
          .from(table.name)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
            console.log(`  ❌ ${table.name.padEnd(15)} - Table does not exist`);
            allConnected = false;
          } else {
            console.log(`  ⚠️  ${table.name.padEnd(15)} - Error: ${error.message}`);
            allConnected = false;
          }
        } else {
          // Get actual count
          const { count: actualCount } = await supabase
            .from(table.name)
            .select('*', { count: 'exact', head: true });
          
          console.log(`  ✅ ${table.name.padEnd(15)} - Connected (${actualCount || 0} rows) - ${table.description}`);
        }
      } catch (err) {
        console.log(`  ❌ ${table.name.padEnd(15)} - Connection failed: ${err.message}`);
        allConnected = false;
      }
    }
    
    // Test Storage Bucket
    console.log('\n📦 Testing Storage Buckets:\n');
    
    try {
      const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
      
      if (bucketError) {
        console.log(`  ⚠️  Could not list buckets: ${bucketError.message}`);
      } else {
        const loanImagesBucket = buckets?.find(b => b.name === 'loan-images');
        if (loanImagesBucket) {
          console.log(`  ✅ loan-images - Connected (${loanImagesBucket.public ? 'Public' : 'Private'})`);
          
          // Try to list files in bucket
          try {
            const { data: files, error: listError } = await supabase.storage
              .from('loan-images')
              .list('', { limit: 1 });
            
            if (listError) {
              console.log(`     ⚠️  Cannot list files: ${listError.message}`);
            } else {
              console.log(`     ✅ Can access files (${files?.length || 0} files visible)`);
            }
          } catch (err) {
            console.log(`     ⚠️  Cannot access files: ${err.message}`);
          }
        } else {
          console.log(`  ❌ loan-images - Bucket does not exist`);
          allConnected = false;
        }
      }
    } catch (err) {
      console.log(`  ❌ Storage access failed: ${err.message}`);
      allConnected = false;
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    if (allConnected) {
      console.log('✅ ALL DATABASE CONNECTIONS SUCCESSFUL!');
      console.log('✅ All tables are connected and accessible');
      console.log('✅ Storage bucket is connected');
      console.log('\n🚀 Your database is ready to use!');
    } else {
      console.log('⚠️  SOME CONNECTIONS FAILED');
      console.log('Please check the errors above and fix them.');
      console.log('\nCommon fixes:');
      console.log('  1. Ensure all tables exist in your Supabase database');
      console.log('  2. Run database schema/migrations');
      console.log('  3. Create the "loan-images" storage bucket');
      console.log('  4. Check RLS policies if using authentication');
      process.exit(1);
    }
    console.log('='.repeat(60) + '\n');
    
  } catch (error) {
    console.error('\n❌ FATAL ERROR: Could not connect to Supabase');
    console.error('Error:', error.message);
    console.error('\nPlease check:');
    console.error('  1. Your Supabase URL is correct');
    console.error('  2. Your Supabase anon key is correct');
    console.error('  3. Your Supabase project is active (not paused)');
    console.error('  4. You have internet connection');
    process.exit(1);
  }
}

// Run the test
testDatabaseConnection().catch(console.error);
