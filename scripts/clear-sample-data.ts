import dotenv from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: resolve('.env.local') });

async function clearSampleData() {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('🗑️ Clearing sample fundraisers...');
  const { error } = await supabase.from('fundraisers').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  
  if (error) {
    console.error('❌ Error:', error.message);
  } else {
    console.log('✅ Sample fundraisers cleared');
  }
}

clearSampleData();
