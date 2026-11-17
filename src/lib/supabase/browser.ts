"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { publishableKey, supabaseUrl } from "./url";

let client: SupabaseClient | null | undefined;

/**
 * Cliente público, usado APENAS pra ouvir o canal realtime (broadcast) de uma votação.
 * Ele não tem permissão pra ler nem escrever nas tabelas (ver migration).
 * Retorna null se o Supabase não estiver configurado — a página continua funcionando sem ao vivo.
 */
export function browserClient(): SupabaseClient | null {
  if (client !== undefined) return client;

  const url = supabaseUrl();
  const key = publishableKey();
  client = url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
  return client;
}
