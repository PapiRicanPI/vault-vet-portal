import { createClient } from '@supabase/supabase-js';

export function createContext({ req }) {
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
  );
  return { supabase, req };
}
