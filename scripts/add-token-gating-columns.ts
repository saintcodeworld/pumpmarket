import dotenv from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: resolve('.env.local') });

async function addTokenGatingColumns() {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  console.log('🔄 Adding token gating columns to users table...');

  try {
    // Add is_token_gated column
    console.log('🔧 Adding is_token_gated column...');
    const { error: error1 } = await supabase.rpc('exec', {
      sql: 'ALTER TABLE users ADD COLUMN IF NOT EXISTS is_token_gated BOOLEAN DEFAULT FALSE'
    });
    
    if (error1 && !error1.message.includes('already exists')) {
      console.error('❌ Error adding is_token_gated:', error1);
    } else {
      console.log('✅ is_token_gated column added');
    }

    // Add token_balance column
    console.log('🔧 Adding token_balance column...');
    const { error: error2 } = await supabase.rpc('exec', {
      sql: 'ALTER TABLE users ADD COLUMN IF NOT EXISTS token_balance BIGINT DEFAULT 0'
    });
    
    if (error2 && !error2.message.includes('already exists')) {
      console.error('❌ Error adding token_balance:', error2);
    } else {
      console.log('✅ token_balance column added');
    }

    // Add last_seen column
    console.log('🔧 Adding last_seen column...');
    const { error: error3 } = await supabase.rpc('exec', {
      sql: 'ALTER TABLE users ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW()'
    });
    
    if (error3 && !error3.message.includes('already exists')) {
      console.error('❌ Error adding last_seen:', error3);
    } else {
      console.log('✅ last_seen column added');
    }

    console.log('🎉 Token gating columns added successfully!');
  } catch (error: any) {
    console.error('❌ Failed to add columns:', error.message);
  }
}

addTokenGatingColumns();
