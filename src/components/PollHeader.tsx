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
          <span className="chip bg-good-soft text-good">
            <span className="live-dot" aria-hidden /> Aberta
          </span>
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
    <div className="space-y-4" aria-busy aria-label="Carregando">
      <div className="skeleton h-8 w-3/4 rounded-lg" />
      <div className="flex gap-2">
        <div className="skeleton h-6 w-16 rounded-full" />
        <div className="skeleton h-6 w-24 rounded-full" />
        <div className="skeleton h-6 w-20 rounded-full" />
      </div>
      <div className="card space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="skeleton h-13 rounded-xl" />
        ))}
        <div className="skeleton h-12 rounded-xl opacity-70" />
      </div>
    </div>
  );
}
