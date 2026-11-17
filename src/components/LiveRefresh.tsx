"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { browserClient } from "@/lib/supabase/browser";

/**
 * Ouve o canal da votação e re-renderiza a página (pelo servidor) quando alguém vota.
 * Sem Supabase configurado, cai pra um refresh a cada 15s.
 */
export function LiveRefresh({ pollId }: { pollId: string }) {
  const router = useRouter();

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const refresh = () => {
      clearTimeout(timer);
      timer = setTimeout(() => router.refresh(), 250); // agrupa rajadas de votos
    };

    const supabase = browserClient();
    if (!supabase) {
      const id = setInterval(() => router.refresh(), 15_000);
      return () => clearInterval(id);
    }

    const channel = supabase.channel(`poll:${pollId}`).on("broadcast", { event: "changed" }, refresh).subscribe();
    // ao voltar pra aba (celular bloqueado, troca de app), busca o estado mais recente
    const onVisible = () => document.visibilityState === "visible" && refresh();
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
      supabase.removeChannel(channel);
    };
  }, [pollId, router]);

  return null;
}
