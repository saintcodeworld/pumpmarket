import dotenv from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

dotenv.config({ path: resolve('.env.local') });

async function updateUsersSchema() {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  console.log('🔄 Updating users table schema...');

  try {
    // Read the SQL file
    const sql = fs.readFileSync('scripts/update-users-schema.sql', 'utf-8');
    
    // Execute the SQL
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error('❌ Error updating schema:', error);
      
      // Try executing individual statements
      const statements = sql.split(';').filter(s => s.trim());
      for (const statement of statements) {
        if (statement.trim()) {
          console.log('🔧 Executing:', statement.trim().substring(0, 50) + '...');
          const { error: stmtError } = await supabase.rpc('exec_sql', { sql_query: statement });
          if (stmtError) {
            console.error('❌ Statement failed:', stmtError);
          } else {
            console.log('✅ Statement executed');
          }
        }
      }
    } else {
      console.log('✅ Users table schema updated successfully!');
    }
  } catch (error: any) {
    console.error('❌ Schema update failed:', error.message);
  }
}

updateUsersSchema();
