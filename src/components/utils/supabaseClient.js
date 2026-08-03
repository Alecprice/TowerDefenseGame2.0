import { createClient } from '@supabase/supabase-js';

// These come from a .env.local file (see .env.example) and, in production,
// from the environment variables you set in the Vercel project dashboard.
// Vite only exposes env vars prefixed with VITE_ to client code.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// If the env vars aren't set (e.g. someone clones the repo without
// configuring Supabase yet), export null instead of throwing, so the rest
// of the app can fall back to local-only behavior instead of crashing.
export const supabase =
    supabaseUrl && supabaseAnonKey
        ? createClient(supabaseUrl, supabaseAnonKey)
        : null;

if (!supabase && import.meta.env.DEV) {
    console.warn(
        '[supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are not set — ' +
        'high scores will fall back to this device only. See .env.example.'
    );
}
