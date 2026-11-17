import type { TallyResult } from "@/lib/polls/tally";
import type { Poll } from "@/lib/polls/types";

function plural(n: number, one: string, many: string) {
  return `${n.toLocaleString("pt-BR")} ${n === 1 ? one : many}`;
}

function Headline({ poll, result, closed }: { poll: Poll; result: TallyResult; closed: boolean }) {
  const { outcome } = result;
  const label = (id: string) => poll.options.find((o) => o.id === id)?.label ?? "?";

  if (outcome.type === "no_votes") return <p className="text-muted">Ninguém votou ainda.</p>;

  if (poll.kind === "approval") {
    const approved = outcome.type === "winner" && label(outcome.optionIds[0]) === "Sim";
    const text =
      outcome.type === "tie" ? "Empate entre Sim e Não" : approved ? "Aprovado" : "Rejeitado";
    return (
      <p className={`text-lg font-semibold ${approved ? "text-good" : outcome.type === "tie" ? "text-warn" : "text-bad"}`}>
        {closed ? text : `Parcial: ${text.toLowerCase()}`}
      </p>
    );
  }

  if (outcome.type === "tie") {
    return (
      <p className="text-lg font-semibold text-warn">
        {closed ? "Empate" : "Empatado"} entre {outcome.optionIds.map(label).join(", ")}
      </p>
    );
  }

  return (
    <p className="text-lg font-semibold">
      {closed ? "Venceu: " : "Liderando: "}
      <span className="text-accent">{label(outcome.optionIds[0])}</span>
    </p>
  );
}

export function Results({ poll, result, closed }: { poll: Poll; result: TallyResult; closed: boolean }) {
  const leaders = new Set(result.outcome.type === "no_votes" ? [] : result.outcome.optionIds);

  return (
    <section className="card space-y-4" aria-live="polite">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold tracking-wide text-muted uppercase">
          {closed ? "Resultado final" : "Ao vivo"}
        </h2>
        <span className="text-sm text-muted">{plural(result.ballots, "participante", "participantes")}</span>
      </div>

      <Headline poll={poll} result={result} closed={closed} />

      <ul className="space-y-3">
        {result.rows.map((row) => {
          const lead = leaders.has(row.optionId);
          const pct = Math.round(row.share * 100);
          return (
            <li key={row.optionId}>
              <div className="mb-1 flex justify-between gap-3 text-sm">
                <span className={lead ? "font-semibold" : row.isAbstention ? "text-muted" : ""}>{row.label}</span>
                <span className="shrink-0 text-muted tabular-nums">
                  {plural(row.votes, "voto", "votos")}
                  {!row.isAbstention && ` · ${pct}%`}
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-bg">
                <div
                  className={`h-full rounded-full transition-[width] duration-500 ${
                    row.isAbstention ? "bg-line" : lead ? "bg-accent" : "bg-accent/35"
                  }`}
                  style={{ width: `${row.isAbstention ? 0 : Math.max(pct, row.votes > 0 ? 2 : 0)}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>

      {poll.kind === "multiple" && result.ballots > 0 && (
        <p className="text-xs text-muted">Na múltipla escolha cada pessoa pode marcar mais de uma opção.</p>
      )}
    </section>
  );
}
