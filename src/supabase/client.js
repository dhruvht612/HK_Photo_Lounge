import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

let clerkTokenGetter = null;

/** Called from ClerkTokenBridge when Clerk is enabled. */
export function setClerkTokenGetter(fn) {
  clerkTokenGetter = fn;
}

function createSupabaseOptions(useClerkToken) {
  if (!useClerkToken) return undefined;
  return {
    accessToken: async () => {
      if (!clerkTokenGetter) return null;
      return clerkTokenGetter();
    },
  };
}

if (!isSupabaseConfigured) {
  console.warn('Supabase credentials missing. Falling back to mock API.');
}

/** Data API — uses Clerk JWT when ClerkTokenBridge is active. */
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey, createSupabaseOptions(true))
  : null;

/** Native Supabase Auth only (admin email/password login). */
export const supabaseAuth = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey)
  : null;
