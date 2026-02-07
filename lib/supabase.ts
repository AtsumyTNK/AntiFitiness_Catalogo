import { createClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase (lado cliente)
 * Usa variáveis públicas definidas no .env.local
 */
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);