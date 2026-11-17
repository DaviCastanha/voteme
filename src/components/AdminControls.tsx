"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { DeletePollButton } from "@/components/DeletePollButton";
import { closePoll, createRunoff } from "@/lib/polls/actions";

export function AdminControls({
  slug,
  title,
  adminKey,
  open,
  canRunoff,
}: {
  slug: string;
  title: string;
  adminKey: string;
  open: boolean;
  canRunoff: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const run = (fn: () => Promise<{ error?: string } | undefined>) =>
    start(async () => {
      setError(null);
      const res = await fn();
      if (res?.error) setError(res.error);
    });

  return (
    <section className="card space-y-3">
      {open && (
        <button
          type="button"
          className="btn-ghost w-full border-bad/40 text-bad"
          disabled={pending}
          onClick={() => {
            if (confirm("Encerrar a votação agora? Ninguém mais poderá votar.")) run(() => closePoll(slug, adminKey));
          }}
        >
          {pending ? "Encerrando…" : "Encerrar votação agora"}
        </button>
      )}

      {canRunoff && (
        <>
          <p className="text-sm text-muted">Deu empate. Quer abrir uma nova rodada só com as opções empatadas?</p>
          <button
            type="button"
            className="btn-primary w-full"
            disabled={pending}
            onClick={() => run(() => createRunoff(slug, adminKey))}
          >
            {pending ? "Criando…" : "Criar rodada de desempate"}
          </button>
        </>
      )}

      {error && <p className="text-sm font-medium text-bad">{error}</p>}

      <DeletePollButton
        slug={slug}
        adminKey={adminKey}
        title={title}
        variant="full"
        onDeleted={() => router.replace("/")}
      />
    </section>
  );
}
