import 'react-native-url-polyfill/auto';

import { createClient } from '@supabase/supabase-js';

import { env, validateEnv } from './env';

validateEnv();

export const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    persistSession: false,
    detectSessionInUrl: false,
    autoRefreshToken: true,
  },
});

export type SupabaseClient = typeof supabase;
