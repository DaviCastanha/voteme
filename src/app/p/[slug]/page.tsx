import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { LiveRefresh } from "@/components/LiveRefresh";
import { ManageLink } from "@/components/LocalPolls";
import { PollHeader, PollSkeleton } from "@/components/PollHeader";
import { Results } from "@/components/Results";
import { VoteForm } from "@/components/VoteForm";
import { getMyBallot, getPoll, getTally } from "@/lib/polls/queries";
import { isOpen } from "@/lib/polls/types";

/** Título e descrição viram o preview do link no WhatsApp. */
export async function generateMetadata({ params }: PageProps<"/p/[slug]">): Promise<Metadata> {
  const poll = await getPoll((await params).slug);
  if (!poll) return { title: "Votação não encontrada" };
  const description = poll.description ?? `${poll.options.length} opções · toque pra votar`;
  return {
    title: poll.title,
    description,
    openGraph: { title: `🗳️ ${poll.title}`, description, type: "website" },
  };
}

export default function PollPage({ params }: PageProps<"/p/[slug]">) {
  return (
    <Suspense fallback={<PollSkeleton />}>
      <PollView params={params} />
    </Suspense>
  );
}

async function PollView({ params }: Pick<PageProps<"/p/[slug]">, "params">) {
  await connection();
  const poll = await getPoll((await params).slug);
  if (!poll) notFound();

  const open = isOpen(poll);
  const [mine, result] = await Promise.all([getMyBallot(poll), getTally(poll)]);
  const showResults = poll.resultsVisibility === "live" || !open;
  const canVote = open && (!mine || poll.allowVoteChange);

  return (
    <div className="space-y-5">
      <LiveRefresh pollId={poll.id} />
      <PollHeader poll={poll} open={open} />
      <ManageLink slug={poll.slug} />

      {mine && (
        <p className="rounded-xl bg-good-soft px-4 py-3 text-sm font-medium text-good">
          ✓ Seu voto foi registrado
          {canVote && " — você ainda pode mudar enquanto estiver aberta."}
        </p>
      )}

      {canVote && (
        <VoteForm
          poll={poll}
          initialChoices={mine?.optionIds ?? []}
          initialName={mine?.name ?? null}
          isChange={Boolean(mine)}
        />
      )}

      {showResults ? (
        <Results poll={poll} result={result} closed={!open} />
      ) : (
        <section className="card text-center">
          <p className="font-medium">O resultado aparece quando a votação encerrar.</p>
          <p className="mt-1 text-sm text-muted">
            {result.ballots === 1 ? "1 pessoa já votou" : `${result.ballots} pessoas já votaram`}
          </p>
        </section>
      )}

      <p className="pt-4 text-center text-sm text-muted">
        Precisa decidir alguma coisa?{" "}
        <Link href="/nova" className="font-semibold text-accent hover:underline">
          Crie sua votação
        </Link>
      </p>
    </div>
  );
}
