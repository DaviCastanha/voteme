import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { EyeOff } from "lucide-react";
import { LiveRefresh } from "@/components/LiveRefresh";
import { ManageLink } from "@/components/LocalPolls";
import { PollHeader, PollSkeleton } from "@/components/PollHeader";
import { Results } from "@/components/Results";
import { VoteForm } from "@/components/VoteForm";
import { VotedBanner } from "@/components/VotedBanner";
import { Rise } from "@/components/motion/Rise";
import { getMyBallot, getPoll, getTally } from "@/lib/polls/queries";
import { isOpen } from "@/lib/polls/types";

/** Título e descrição viram o preview do link no WhatsApp. */
export async function generateMetadata({ params }: PageProps<"/p/[slug]">): Promise<Metadata> {
  const poll = await getPoll((await params).slug);
  if (!poll) return { title: "Votação não encontrada" };
  const description = poll.description ?? `${poll.options.length} opções · toque pra votar`;
  // se as opções têm imagem, a primeira vira a foto do preview no WhatsApp
  const image = poll.options.find((o) => o.imageUrl)?.imageUrl;
  return {
    title: poll.title,
    description,
    openGraph: { title: `🗳️ ${poll.title}`, description, type: "website", ...(image ? { images: [image] } : {}) },
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
      <Rise>
        <PollHeader poll={poll} open={open} />
      </Rise>
      <ManageLink slug={poll.slug} />

      {mine && <VotedBanner pollId={poll.id} canChange={canVote} />}

      {canVote && (
        <Rise i={1}>
          <VoteForm
            poll={poll}
            initialChoices={mine?.optionIds ?? []}
            initialName={mine?.name ?? null}
            isChange={Boolean(mine)}
          />
        </Rise>
      )}

      <Rise i={canVote ? 2 : 1}>
        {showResults ? (
          <Results poll={poll} result={result} closed={!open} />
        ) : (
          <section className="card flex flex-col items-center gap-2 py-8 text-center">
            <span className="grid size-12 place-items-center rounded-full bg-accent-soft text-accent">
              <EyeOff size={22} />
            </span>
            <p className="font-medium">O resultado aparece quando a votação encerrar.</p>
            <p className="flex items-center gap-2 text-sm text-muted">
              <span className="live-dot" aria-hidden />
              {result.ballots === 1 ? "1 pessoa já votou" : `${result.ballots} pessoas já votaram`}
            </p>
          </section>
        )}
      </Rise>

      <p className="pt-4 text-center text-sm text-muted">
        Precisa decidir alguma coisa?{" "}
        <Link href="/nova" className="font-semibold text-accent hover:underline">
          Crie sua votação
        </Link>
      </p>
    </div>
  );
}
