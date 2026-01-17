import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables! Check your .env file.');
}

// Fallback to avoid crashing app if keys are missing
// The auth won't work, but at least the page will render
export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);
