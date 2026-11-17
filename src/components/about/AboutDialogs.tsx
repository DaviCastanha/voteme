"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { Modal } from "@/components/Modal";
import { APP_VERSION, formatReleaseDate, RELEASES, type Release } from "@/content/releases";
import { about, unseenReleases, useAbout } from "@/lib/about-store";
import { readLocalPolls } from "@/lib/local-polls";

/** Página de voto (/p/<slug>): quem chegou pelo link do WhatsApp não deve ser interrompido. */
const VOTE_PAGE = /^\/p\/[^/]+\/?$/;

/**
 * "Sobre o VoteMe" e "Novidades". Montado uma vez no layout.
 * Também anuncia sozinho as versões que este aparelho ainda não viu.
 */
export function AboutDialogs() {
  const { view, fresh } = useAbout();

  useEffect(() => {
    if (VOTE_PAGE.test(window.location.pathname)) return;
    const releases = unseenReleases(readLocalPolls().length > 0);
    if (releases.length) about.showNews(releases);
  }, []);

  return (
    <>
      <AboutDialog open={view === "about"} />
      <NewsDialog open={view === "news"} fresh={fresh} />
    </>
  );
}

function AboutDialog({ open }: { open: boolean }) {
  const current = RELEASES[0];
  return (
    <Modal open={open} onClose={about.close} title="Sobre o VoteMe" size="sm">
      <div className="space-y-5 text-center">
        <div className="space-y-2">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-accent text-2xl text-accent-ink" aria-hidden>
            ✓
          </span>
          <h3 className="text-xl font-bold">VoteMe</h3>
          <p className="text-sm text-muted">
            Versão {APP_VERSION} · {formatReleaseDate(current.date)}
          </p>
          <p className="font-medium">Decidam juntos, sem enrolação.</p>
          <p className="text-sm text-muted">
            Crie uma votação em segundos, mande o link no grupo e acompanhe o resultado ao vivo. Ninguém precisa de
            conta pra votar.
          </p>
        </div>
        <button type="button" className="btn-ghost mx-auto py-2" onClick={() => about.showNews()}>
          <Sparkles size={15} /> Novidades da versão
        </button>
        <section className="rounded-xl bg-bg px-4 py-3 text-sm">
          <h4 className="font-semibold">Créditos</h4>
          <p className="text-muted">Criado por Davi Castanha</p>
        </section>
      </div>
    </Modal>
  );
}

function NewsDialog({ open, fresh }: { open: boolean; fresh: Release[] }) {
  const [showOlder, setShowOlder] = useState(false);
  const freshVersions = new Set(fresh.map((r) => r.version));
  const highlighted = fresh.length ? fresh : RELEASES.slice(0, 1);
  const older = RELEASES.filter((r) => !highlighted.some((h) => h.version === r.version));

  const close = () => {
    setShowOlder(false);
    about.close();
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title={fresh.length ? "Novidades do VoteMe" : "Novidades"}
      footer={
        <button type="button" className="btn-primary py-2.5" onClick={close}>
          Entendi
        </button>
      }
    >
      <div className="space-y-6">
        {fresh.length > 0 && <p className="text-sm text-muted">O que mudou desde a última vez que você abriu o app:</p>}
        {highlighted.map((r) => (
          <ReleaseEntry key={r.version} release={r} isNew={freshVersions.has(r.version)} />
        ))}
        {older.length > 0 &&
          (showOlder ? (
            older.map((r) => <ReleaseEntry key={r.version} release={r} />)
          ) : (
            <button
              type="button"
              className="w-full rounded-xl border border-dashed border-line py-2.5 text-sm font-medium text-muted hover:text-ink"
              onClick={() => setShowOlder(true)}
            >
              Ver versões anteriores ({older.length})
            </button>
          ))}
      </div>
    </Modal>
  );
}

function ReleaseEntry({ release, isNew }: { release: Release; isNew?: boolean }) {
  return (
    <article className="space-y-2">
      <header className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-bold ${
            isNew ? "bg-accent text-accent-ink" : "bg-bg text-muted"
          }`}
        >
          v{release.version}
        </span>
        <h3 className="font-semibold">{release.title}</h3>
        <time dateTime={release.date} className="text-xs text-muted">
          {formatReleaseDate(release.date)}
        </time>
      </header>
      <ul className="list-disc space-y-1.5 pl-5 text-sm marker:text-accent">
        {release.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </article>
  );
}

/** Rodapé: "VoteMe v1.1.0 · Novidades" */
export function AboutFooter() {
  return (
    <footer className="mx-auto flex w-full max-w-2xl items-center justify-center gap-3 px-4 pb-8 text-xs text-muted">
      <button type="button" onClick={about.showAbout} className="hover:text-ink hover:underline">
        VoteMe v{APP_VERSION}
      </button>
      <span aria-hidden>·</span>
      <button type="button" onClick={() => about.showNews()} className="hover:text-ink hover:underline">
        Novidades
      </button>
    </footer>
  );
}
