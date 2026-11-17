/**
 * Aceita a URL do projeto mesmo se colaram o endpoint da API
 * (ex.: "https://x.supabase.co/rest/v1/") — fica só "https://x.supabase.co".
 */
export function supabaseUrl(): string | undefined {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!raw) return undefined;
  return raw.replace(/\/+$/, "").replace(/\/(rest|realtime|auth)\/v1$/, "");
}
