/**
 * Check Supabase Connection and Schema
 * 
 * Run this script to verify Supabase connection and check table structure
 */

import { connectSupabase, getSupabaseServiceClient } from '../lib/supabase.js';

async function checkSupabaseConnection() {
  try {
    console.log('🔍 Checking Supabase connection...');
    
    // Connect to Supabase
    await connectSupabase();
    const supabase = getSupabaseServiceClient();
    
    console.log('✅ Supabase connection successful');
    
    // Check if fundraisers table exists
    console.log('\n🔍 Checking fundraisers table...');
    
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'fundraisers');
    
    if (tablesError) {
      console.error('❌ Error checking tables:', tablesError);
    } else if (tables && tables.length > 0) {
      console.log('✅ Fundraisers table exists');
      
      // Check table columns
      const { data: columns, error: columnsError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable, column_default')
        .eq('table_schema', 'public')
        .eq('table_name', 'fundraisers')
        .order('ordinal_position');
      
      if (columnsError) {
        console.error('❌ Error checking columns:', columnsError);
      } else {
        console.log('\n📋 Fundraisers table columns:');
        columns.forEach(col => {
          console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable}) ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
        });
      }
      
      // Try to fetch fundraisers
      console.log('\n🔍 Testing fundraisers query...');
      const { data: fundraisers, error: fundraisersError } = await supabase
        .from('fundraisers')
        .select('*')
        .limit(5);
      
      if (fundraisersError) {
        console.error('❌ Error fetching fundraisers:', fundraisersError);
      } else {
        console.log(`✅ Found ${fundraisers.length} fundraisers`);
        if (fundraisers.length > 0) {
          console.log('📝 Sample fundraiser:', JSON.stringify(fundraisers[0], null, 2));
        }
      }
    } else {
      console.log('❌ Fundraisers table does not exist');
      console.log('🔧 Please run the schema migration script first:');
      console.log('   1. Go to your Supabase project dashboard');
      console.log('   2. Navigate to SQL Editor');
      console.log('   3. Run the contents of: supabase-schema.sql');
      console.log('   4. Then run: update-fundraisers-schema.sql');
    }
    
  } catch (error: any) {
    console.error('❌ Connection failed:', error.message);
    console.error('\n🔧 Troubleshooting:');
    console.error('1. Check SUPABASE_URL in .env.local');
    console.error('2. Check SUPABASE_ANON_KEY in .env.local');
    console.error('3. Verify Supabase project is active');
    console.error('4. Ensure RLS policies allow service role access');
  }
}

// Run the check
checkSupabaseConnection();
