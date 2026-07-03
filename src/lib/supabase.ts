import { createClient, SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Null hasta que existan las env vars — la app usa localStorage mientras tanto.
export const supabase: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey) : null;
