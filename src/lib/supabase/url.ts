/**
 * Leitura das variáveis do Supabase, aceitando os dois jeitos de nomear:
 * - os nossos (.env.example): NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY / SUPABASE_SECRET_KEY
 * - os da integração Supabase ↔ Vercel: NEXT_PUBLIC_SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY
 *
 * Obs.: variáveis NEXT_PUBLIC_* precisam ser lidas literalmente (process.env.NOME)
 * pro Next embutir o valor no código do navegador.
 */

/** Aceita a URL mesmo se colaram o endpoint da API ("https://x.supabase.co/rest/v1/"). */
export function supabaseUrl(): string | undefined {
  const raw = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL)?.trim();
  if (!raw) return undefined;
  return raw.replace(/\/+$/, "").replace(/\/(rest|realtime|auth)\/v1$/, "");
}

/** Chave pública — pode ir pro navegador. */
export function publishableKey(): string | undefined {
  return (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)?.trim() || undefined;
}
