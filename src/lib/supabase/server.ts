import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { supabaseUrl } from "./url";

let client: SupabaseClient | null = null;

/**
 * Cliente com a secret key (service_role). Ignora RLS — só pode existir no servidor.
 * Toda regra de acesso é aplicada no código de `src/lib/polls/*` e nas funções SQL.
 */
export function db(): SupabaseClient {
  if (client) return client;

  const url = supabaseUrl();
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase não configurado: defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SECRET_KEY no .env.local",
    );
  }

  client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}

/** Erros do Supabase vêm como objeto puro; isto vira um Error com mensagem legível no overlay/logs. */
export function dbError(e: { message: string; code?: string; hint?: string | null }): Error {
  return new Error(`[supabase ${e.code ?? "?"}] ${e.message}${e.hint ? ` (dica: ${e.hint})` : ""}`, { cause: e });
}
