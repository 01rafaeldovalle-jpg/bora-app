import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Inicialização segura do cliente Supabase
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

if (!supabase) {
  console.warn(
    'Supabase: VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não configurados no arquivo .env. ' +
    'O app rodará em modo local-mock (carregando dados offline de Curitiba).'
  );
}
