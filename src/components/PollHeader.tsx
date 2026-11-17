import Link from "next/link";
import { LocalTime } from "@/components/LocalTime";
import { KIND_LABEL, type Poll } from "@/lib/polls/types";

export function PollHeader({ poll, open }: { poll: Poll; open: boolean }) {
  return (
    <header className="space-y-3">
      {poll.parentSlug && (
        <Link href={`/p/${poll.parentSlug}`} className="text-sm font-medium text-accent hover:underline">
          ← Rodada de desempate
        </Link>
      )}
      <h1 className="text-2xl font-bold tracking-tight text-balance sm:text-3xl">{poll.title}</h1>
      {poll.description && <p className="text-muted">{poll.description}</p>}
      <div className="flex flex-wrap gap-2">
        {open ? (
          <span className="chip bg-good-soft text-good">● Aberta</span>
        ) : (
          <span className="chip">Encerrada</span>
        )}
        <span className="chip">{KIND_LABEL[poll.kind]}</span>
        <span className="chip">{poll.identityMode === "named" ? "Com nome" : "Anônima"}</span>
        {open && poll.closesAt && (
          <span className="chip">
            Encerra <LocalTime iso={poll.closesAt} />
          </span>
        )}
      </div>
    </header>
  );
}

export function PollSkeleton() {
  return (
    <div className="animate-pulse space-y-4" aria-busy>
      <div className="h-8 w-3/4 rounded-lg bg-line" />
      <div className="h-5 w-1/3 rounded-lg bg-line" />
      <div className="card h-64" />
    </div>
  );
}
