import { createClient } from '@supabase/supabase-js';

/**
 * Read-only Supabase client for the web app.
 * 
 * Uses the anon key which respects Row Level Security policies.
 * This client is safe to use in server components for public data reads.
 */
export function createWebClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !anonKey) {
        throw new Error(
            'Missing Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local'
        );
    }

    return createClient(url, anonKey, {
        auth: { persistSession: false },
    });
}
