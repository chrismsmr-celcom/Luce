import { createClient } from "@supabase/supabase-js";

// Same Supabase project as the backend (SUPABASE_URL there). The anon key is public by design.
// When these variables are missing the app runs in local mode: no login, the backend
// falls back to its anonymous cookie session (see luce-backend/auth.py).
const url = import.meta.env["VITE_SUPABASE_URL"] as string | undefined;
const anonKey = import.meta.env["VITE_SUPABASE_ANON_KEY"] as string | undefined;

export const supabase = url && anonKey ? createClient(url, anonKey) : null;
export const AUTH_ENABLED = supabase !== null;
