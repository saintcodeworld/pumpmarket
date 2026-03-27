/**
 * Supabase Database Connection
 * 
 * Replaces MongoDB with Supabase PostgreSQL
 * Provides singleton connection for Next.js API routes
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CONFIG } from '@/config/constants';

/**
 * Cached Supabase client for serverless environments
 */
interface CachedSupabase {
  client: SupabaseClient | null;
  promise: Promise<SupabaseClient> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var supabaseCache: CachedSupabase | undefined;
  // eslint-disable-next-line no-var
  var supabaseInitLogged: boolean | undefined;
}

let cached: CachedSupabase = global.supabaseCache || {
  client: null,
  promise: null,
};

if (!global.supabaseCache) {
  global.supabaseCache = cached;
}

// Log database configuration on startup (only once)
if (!global.supabaseInitLogged) {
  if (CONFIG.MOCK_MODE) {
    console.log('🧪 MOCK MODE: Using file-based persistence');
  } else if (CONFIG.SUPABASE_URL && CONFIG.SUPABASE_ANON_KEY) {
    console.log('✅ Supabase configured');
  } else {
    console.warn('⚠️  SUPABASE_URL or SUPABASE_ANON_KEY not configured!');
  }
  global.supabaseInitLogged = true;
}

/**
 * Connect to Supabase
 * 
 * Uses cached connection in serverless environments
 * 
 * @returns Promise<SupabaseClient> - Supabase client instance
 */
async function connectSupabase(): Promise<SupabaseClient> {
  // Return cached client if exists
  if (cached.client) {
    return cached.client;
  }

  // Return existing promise if connection is in progress
  if (cached.promise) {
    return cached.promise;
  }

  // Check for Supabase configuration
  if (!CONFIG.SUPABASE_URL || !CONFIG.SUPABASE_ANON_KEY) {
    throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY must be configured in environment variables');
  }

  // Create new connection
  try {
    const client = createClient(
      CONFIG.SUPABASE_URL,
      CONFIG.SUPABASE_ANON_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
    
    console.log('✅ Supabase connected');
    cached.client = client;
    cached.promise = Promise.resolve(client);
    return client;
  } catch (error: any) {
    console.error('❌ Supabase connection error:', error.message);
    cached.promise = null;
    throw error;
  }
}

/**
 * Get Supabase client (synchronous version for API routes)
 * 
 * @returns SupabaseClient - Supabase client instance
 */
function getSupabaseClient(): SupabaseClient {
  if (!cached.client) {
    throw new Error('Supabase not initialized. Call connectSupabase() first.');
  }
  return cached.client;
}

/**
 * Get Supabase service role client (for admin operations)
 * 
 * @returns SupabaseClient - Supabase client with service role key
 */
function getSupabaseServiceClient(): SupabaseClient {
  if (!CONFIG.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY not configured in environment variables');
  }

  return createClient(
    CONFIG.SUPABASE_URL,
    CONFIG.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}

/**
 * Check if Supabase is connected
 * 
 * @returns boolean - True if connected
 */
function isConnected(): boolean {
  return cached.client !== null;
}

// Export functions
export {
  connectSupabase,
  getSupabaseClient,
  getSupabaseServiceClient,
  isConnected
};

// Export types
export type { SupabaseClient };
