import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Server-side client (App Router — no cookies API in this Next 13.5 setup,
// so we use the anon key client; RLS still enforces ownership via auth.uid()).
export function createServerClient() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
  });
}
