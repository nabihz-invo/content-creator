import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabaseConfigured = Boolean(url && anonKey);

/** Browser client: anon key + the user's session. RLS decides what it can see. */
export const supabase = createClient(
  url ?? "http://localhost:54321",
  anonKey ?? "missing-anon-key",
  {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  },
);

export const API_URL: string =
  (import.meta.env.VITE_API_URL as string | undefined) || `${url ?? ""}/functions/v1/api`;
