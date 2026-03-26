// Test environment variables
import dotenv from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';

// Load .env.local
dotenv.config({ path: resolve('.env.local') });

console.log('🔍 Testing environment variables...');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ Set' : '❌ Missing');
console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing');

async function testConnection() {
  if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
    console.log('\n✅ Environment variables loaded successfully');
    
    // Test Supabase connection
    try {
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      );
      
      console.log('✅ Supabase client created');
      
      // Test basic connection by trying to query fundraisers table directly
      const { data, error } = await supabase
        .from('fundraisers')
        .select('id')
        .limit(1);
      
      if (error) {
        if (error.message.includes('relation') && error.message.includes('does not exist')) {
          console.log('❌ Fundraisers table does not exist');
          console.log('🔧 Please run the schema migration script first:');
          console.log('   1. Go to your Supabase project dashboard');
          console.log('   2. Navigate to SQL Editor');
          console.log('   3. Run the contents of: supabase-schema.sql');
          console.log('   4. Then run: update-fundraisers-schema.sql');
        } else {
          console.error('❌ Error checking fundraisers table:', error.message);
        }
      } else {
        console.log(`✅ Fundraisers table exists (found ${data.length} records)`);
      }
    } catch (err) {
      console.error('❌ Supabase connection error:', err.message);
    }
  } else {
    console.error('\n❌ Missing required environment variables');
  }
}

testConnection();
