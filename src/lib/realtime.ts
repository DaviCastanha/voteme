import "server-only";
import { supabaseUrl } from "@/lib/supabase/url";

export const pollChannel = (pollId: string) => `poll:${pollId}`;
export const POLL_CHANGED = "changed";

/**
 * Avisa quem está com a votação aberta que algo mudou (novo voto, encerramento).
 * O aviso não carrega dados: o cliente só re-renderiza a página pelo servidor,
 * então "resultado oculto até o fim" continua oculto.
 *
 * Usa o endpoint REST de broadcast do Supabase Realtime — sem manter websocket no servidor.
 * Falha silenciosamente: o voto já foi gravado, o ao vivo é só conveniência.
 */
export async function notifyPollChanged(pollId: string): Promise<void> {
  const url = supabaseUrl();
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) return;

  try {
    await fetch(`${url}/realtime/v1/api/broadcast`, {
      method: "POST",
      // só `apikey`: as chaves novas (sb_secret_…) não são JWT e não vão no Authorization
      headers: { "Content-Type": "application/json", apikey: key },
      body: JSON.stringify({
        messages: [{ topic: pollChannel(pollId), event: POLL_CHANGED, payload: { at: Date.now() } }],
      }),
      signal: AbortSignal.timeout(2000),
    });
  } catch (err) {
    console.warn("[realtime] broadcast falhou", err);
  }
}
