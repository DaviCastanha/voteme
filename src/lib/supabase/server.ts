import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { supabaseUrl } from "./url";

let client: SupabaseClient | null = null;

/** Chave secreta — NUNCA no navegador. Aceita o nome da integração Vercel também. */
export function secretKey(): string | undefined {
  return (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)?.trim() || undefined;
}

/**
 * Cliente com a secret key (service_role). Ignora RLS — só pode existir no servidor.
 * Toda regra de acesso é aplicada no código de `src/lib/polls/*` e nas funções SQL.
 */
export function db(): SupabaseClient {
  if (client) return client;

  const url = supabaseUrl();
  const key = secretKey();
  if (!url || !key) {
    throw new Error(
      `Supabase não configurado: falta ${!url ? "NEXT_PUBLIC_SUPABASE_URL" : "SUPABASE_SECRET_KEY (ou SUPABASE_SERVICE_ROLE_KEY)"}`,
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
