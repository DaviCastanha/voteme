"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { animate, AnimatePresence, LayoutGroup, motion } from "motion/react";
import { Trophy } from "lucide-react";
import { OptionImage } from "@/components/OptionImage";
import { WinnerReveal } from "@/components/WinnerReveal";
import type { TallyResult } from "@/lib/polls/tally";
import type { Poll } from "@/lib/polls/types";

const EASE = [0.16, 1, 0.3, 1] as const;

function plural(n: number, one: string, many: string) {
  return n === 1 ? one : many;
}

/** Número que conta até o novo valor quando muda (no primeiro render já mostra o valor final). */
function AnimatedNumber({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const prev = useRef(value);

  useLayoutEffect(() => {
    const node = ref.current;
    const from = prev.current;
    prev.current = value;
    if (!node || from === value) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      node.textContent = value.toLocaleString("pt-BR");
      return;
    }
    const controls = animate(from, value, {
      duration: 0.7,
      ease: EASE,
      onUpdate: (v) => (node.textContent = Math.round(v).toLocaleString("pt-BR")),
    });
    return () => controls.stop();
  }, [value]);

  return (
    <span ref={ref} className="tabular-nums">
      {value.toLocaleString("pt-BR")}
    </span>
  );
}

/** Guarda quanto cada opção ganhou desde o último render, pra mostrar "+1" por um instante. */
function useDeltas(rows: TallyResult["rows"]) {
  const prev = useRef<Map<string, number> | null>(null);
  const [deltas, setDeltas] = useState<Record<string, number>>({});

  useEffect(() => {
    const before = prev.current;
    prev.current = new Map(rows.map((r) => [r.optionId, r.votes]));
    if (!before) return;
    const next: Record<string, number> = {};
    for (const r of rows) {
      const d = r.votes - (before.get(r.optionId) ?? 0);
      if (d > 0) next[r.optionId] = d;
    }
    if (!Object.keys(next).length) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reage a dados novos vindos do servidor
    setDeltas(next);
    const t = setTimeout(() => setDeltas({}), 1600);
    return () => clearTimeout(t);
  }, [rows]);

  return deltas;
}

function Headline({ poll, result, closed }: { poll: Poll; result: TallyResult; closed: boolean }) {
  const { outcome } = result;
  const label = (id: string) => poll.options.find((o) => o.id === id)?.label ?? "?";

  let text: ReactNode;
  let key: string;
  let tone = "";

  if (outcome.type === "no_votes") {
    key = "none";
    text = <span className="text-muted">Ninguém votou ainda.</span>;
  } else if (poll.kind === "approval") {
    const approved = outcome.type === "winner" && label(outcome.optionIds[0]) === "Sim";
    const word = outcome.type === "tie" ? "Empate entre Sim e Não" : approved ? "Aprovado" : "Rejeitado";
    key = `approval-${word}-${closed}`;
    tone = approved ? "text-good" : outcome.type === "tie" ? "text-warn" : "text-bad";
    text = closed ? word : `Parcial: ${word.toLowerCase()}`;
  } else if (outcome.type === "tie") {
    key = `tie-${outcome.optionIds.join()}-${closed}`;
    tone = "text-warn";
    text = `${closed ? "Empate" : "Empatado"} entre ${outcome.optionIds.map(label).join(", ")}`;
  } else {
    key = `win-${outcome.optionIds[0]}-${closed}`;
    text = (
      <>
        {closed ? "Venceu: " : "Liderando: "}
        <span className="text-accent">{label(outcome.optionIds[0])}</span>
      </>
    );
  }

  return (
    <div className="min-h-7">
      <AnimatePresence mode="wait" initial={false}>
        <motion.p
          key={key}
          initial={{ opacity: 0, y: 6, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -6, filter: "blur(4px)" }}
          transition={{ duration: 0.3 }}
          className={`text-lg font-semibold ${tone}`}
        >
          {text}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

export function Results({
  poll,
  result,
  closed,
  reveal = true,
}: {
  poll: Poll;
  result: TallyResult;
  closed: boolean;
  /** toca o efeito do vencedor ao abrir uma votação encerrada */
  reveal?: boolean;
}) {
  const leaders = new Set(result.outcome.type === "no_votes" ? [] : result.outcome.optionIds);
  const winnerId = closed && result.outcome.type === "winner" ? result.outcome.optionIds[0] : null;
  const deltas = useDeltas(result.rows);
  const images = new Map(poll.options.map((o) => [o.id, o.imageUrl]));
  const hasImages = poll.options.some((o) => o.imageUrl);
  const approval = poll.kind === "approval";

  function barColor(optionId: string, isAbstention: boolean, position: number) {
    if (isAbstention) return "bg-line";
    if (approval) return position === 0 ? "bg-good" : "bg-bad";
    if (optionId === winnerId) return "bg-linear-to-r from-accent to-gold";
    return leaders.has(optionId) ? "bg-accent" : "bg-accent/35";
  }

  return (
    <section className="card space-y-4" aria-live="polite">
      {reveal && closed && result.outcome.type !== "no_votes" && <WinnerReveal poll={poll} result={result} />}

      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold tracking-wide text-muted uppercase">
          {closed ? (
            <>
              <Trophy size={15} className="text-gold" /> Resultado final
            </>
          ) : (
            <>
              <span className="live-dot" aria-hidden /> Ao vivo
            </>
          )}
        </h2>
        <span className="text-sm text-muted">
          <AnimatedNumber value={result.ballots} /> {plural(result.ballots, "participante", "participantes")}
        </span>
      </div>

      <Headline poll={poll} result={result} closed={closed} />

      <LayoutGroup>
        <ul className="space-y-3.5">
          {result.rows.map((row, i) => {
            const pct = Math.round(row.share * 100);
            const position = poll.options.find((o) => o.id === row.optionId)?.position ?? 0;
            const img = images.get(row.optionId);
            const isWinner = row.optionId === winnerId;
            return (
              <motion.li
                key={row.optionId}
                layout
                transition={{ layout: { type: "spring", stiffness: 400, damping: 35 } }}
                className="flex items-center gap-3"
              >
                {hasImages && !row.isAbstention && (
                  <div className="relative shrink-0">
                    {img ? (
                      <OptionImage src={img} alt={row.label} className="size-11 rounded-lg" />
                    ) : (
                      <div className="grid size-11 place-items-center rounded-lg bg-accent-soft font-bold text-accent" aria-hidden>
                        {row.label.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
                    <span
                      className={`flex min-w-0 items-center gap-1.5 ${
                        leaders.has(row.optionId) ? "font-semibold" : row.isAbstention ? "text-muted" : ""
                      }`}
                    >
                      {isWinner && <Trophy size={14} className="shrink-0 text-gold" aria-label="Vencedor" />}
                      <span className="truncate">{row.label}</span>
                      <AnimatePresence>
                        {deltas[row.optionId] && (
                          <motion.span
                            key="delta"
                            initial={{ opacity: 0, y: 6, scale: 0.8 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -8 }}
                            className="rounded-full bg-good-soft px-1.5 text-xs font-bold text-good"
                          >
                            +{deltas[row.optionId]}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </span>
                    <span className="shrink-0 text-muted">
                      <AnimatedNumber value={row.votes} /> {plural(row.votes, "voto", "votos")}
                      {!row.isAbstention && (
                        <>
                          {" · "}
                          <AnimatedNumber value={pct} />%
                        </>
                      )}
                    </span>
                  </div>
                  <div className={`h-2.5 overflow-hidden rounded-full bg-bg ${isWinner ? "sheen" : ""}`}>
                    <motion.div
                      className={`h-full rounded-full ${barColor(row.optionId, row.isAbstention, position)}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${row.isAbstention ? 0 : Math.max(pct, row.votes > 0 ? 2 : 0)}%` }}
                      transition={{ duration: 0.9, ease: EASE, delay: 0.1 + i * 0.06 }}
                    />
                  </div>
                </div>
              </motion.li>
            );
          })}
        </ul>
      </LayoutGroup>

      {poll.kind === "multiple" && result.ballots > 0 && (
        <p className="text-xs text-muted">Na múltipla escolha cada pessoa pode marcar mais de uma opção.</p>
      )}
    </section>
  );
}
