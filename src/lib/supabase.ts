import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? '';
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ?? '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '[Supabase] Faltan variables de entorno: VITE_SUPABASE_URL y/o VITE_SUPABASE_ANON_KEY. ' +
    'La app funcionará en modo offline (localStorage).'
  );
}

export const supabase = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  }
);
