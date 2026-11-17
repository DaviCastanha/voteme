import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense, type CSSProperties } from "react";
import { Rise } from "@/components/motion/Rise";
import { AdminControls } from "@/components/AdminControls";
import { LiveRefresh } from "@/components/LiveRefresh";
import { RememberPoll } from "@/components/LocalPolls";
import { PollHeader, PollSkeleton } from "@/components/PollHeader";
import { Results } from "@/components/Results";
import { SharePanel } from "@/components/SharePanel";
import { getParticipants, getPollAsAdmin, getTally } from "@/lib/polls/queries";
import { isOpen } from "@/lib/polls/types";

// o token de admin está na URL: não vaza via Referer nem vai pra indexação
export const metadata: Metadata = {
  title: "Painel da votação",
  referrer: "no-referrer",
  robots: { index: false, follow: false },
};

export default function AdminPage({ params, searchParams }: PageProps<"/p/[slug]/admin">) {
  return (
    <Suspense fallback={<PollSkeleton />}>
      <AdminView params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function AdminView({ params, searchParams }: Pick<PageProps<"/p/[slug]/admin">, "params" | "searchParams">) {
  await connection();
  const { slug } = await params;
  const { k } = await searchParams;
  const key = typeof k === "string" ? k : undefined;

  const poll = await getPollAsAdmin(slug, key);
  if (!poll || !key) {
    return (
      <div className="card space-y-2 text-center">
        <h1 className="text-xl font-bold">Link de administrador inválido</h1>
        <p className="text-muted">Confira se copiou o link inteiro.</p>
        <Link href={`/p/${slug}`} className="font-semibold text-accent hover:underline">
          Ir pra página de votação
        </Link>
      </div>
    );
  }

  const open = isOpen(poll);
  const [result, participants] = await Promise.all([
    getTally(poll),
    poll.identityMode === "named" ? getParticipants(poll) : Promise.resolve([]),
  ]);
  const canRunoff = !open && poll.kind !== "approval" && result.outcome.type === "tie";

  return (
    <div className="space-y-5">
      <RememberPoll slug={poll.slug} title={poll.title} adminKey={key} />
      <LiveRefresh pollId={poll.id} />

      <Rise>
        <PollHeader poll={poll} open={open} />
      </Rise>

      {open && (
        <Rise i={1}>
          <SharePanel slug={poll.slug} title={poll.title} adminKey={key} />
        </Rise>
      )}

      <Rise i={2} className="space-y-2">
        <Results poll={poll} result={result} closed={!open} />
        {poll.resultsVisibility === "after_close" && open && (
          <p className="px-1 text-xs text-muted">Só você vê o resultado parcial. Os votantes veem ao encerrar.</p>
        )}
      </Rise>

      {participants.length > 0 && (
        <Rise i={3}>
          <section className="card">
            <h2 className="mb-3 text-sm font-semibold tracking-wide text-muted uppercase">Quem votou</h2>
            <ul className="flex flex-wrap gap-2">
              {participants.map((p, i) => (
                // chave estável: quem já estava não re-anima; quem acabou de votar entra animado
                <li
                  key={`${p.votedAt}-${i}`}
                  className="chip animate-rise text-ink"
                  style={{ "--i": Math.min(i, 12) } as CSSProperties}
                >
                  {p.name ?? "—"}
                </li>
              ))}
            </ul>
          </section>
        </Rise>
      )}

      <Rise i={4}>
        <AdminControls slug={poll.slug} title={poll.title} adminKey={key} open={open} canRunoff={canRunoff} />
      </Rise>

      <Link href={`/p/${poll.slug}`} className="block text-center text-sm font-semibold text-accent hover:underline">
        Ver como votante →
      </Link>
    </div>
  );
}
