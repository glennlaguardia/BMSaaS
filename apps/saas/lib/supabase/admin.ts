import { createClient } from '@supabase/supabase-js';

/**
 * Service role Supabase client — bypasses RLS.
 * Only use this on the server side for admin operations.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
