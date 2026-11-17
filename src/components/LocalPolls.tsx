"use client";

import { useEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  readLocalPolls,
  rememberLocalPoll,
  serverLocalPolls,
  subscribeLocalPolls,
} from "@/lib/local-polls";

function useLocalPolls() {
  return useSyncExternalStore(subscribeLocalPolls, readLocalPolls, serverLocalPolls);
}

/** Guarda a votação neste aparelho quando o criador abre o painel de admin. */
export function RememberPoll({ slug, title, adminKey }: { slug: string; title: string; adminKey: string }) {
  useEffect(() => rememberLocalPoll({ slug, title, adminKey }), [slug, title, adminKey]);
  return null;
}

/** Na página de voto: se este aparelho criou a votação, mostra o atalho pro painel. */
export function ManageLink({ slug }: { slug: string }) {
  const mine = useLocalPolls().find((p) => p.slug === slug);
  if (!mine) return null;
  return (
    <Link
      href={`/p/${slug}/admin?k=${mine.adminKey}`}
      className="block rounded-xl bg-accent-soft px-4 py-3 text-center text-sm font-semibold text-accent"
    >
      Você criou esta votação · Abrir painel
    </Link>
  );
}

export function MyPolls() {
  const polls = useLocalPolls();
  if (polls.length === 0) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold tracking-wide text-muted uppercase">Criadas neste aparelho</h2>
      <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-card">
        {polls.map((p) => (
          <li key={p.slug}>
            <Link
              href={`/p/${p.slug}/admin?k=${p.adminKey}`}
              className="flex items-center justify-between gap-3 px-5 py-4 hover:bg-bg"
            >
              <span className="truncate font-medium">{p.title}</span>
              <span className="shrink-0 text-sm text-muted">Gerenciar →</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
