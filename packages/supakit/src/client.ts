import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { createLogger } from '@ghouse/core';

const logger = createLogger('supakit');

let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (supabaseClient) {
    return supabaseClient;
  }

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY/SUPABASE_ANON_KEY');
  }

  logger.info({ url }, 'Initializing Supabase client');

  supabaseClient = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return supabaseClient;
}

export function resetSupabaseClient() {
  supabaseClient = null;
}
