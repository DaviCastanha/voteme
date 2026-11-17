"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

const noop = () => () => {};
/** true só no navegador, depois de hidratar (portal não pode existir no HTML do servidor) */
const useMounted = () => useSyncExternalStore(noop, () => true, () => false);
import { AnimatePresence, motion } from "motion/react";
import { Check, Scale, Trophy, X } from "lucide-react";
import { Burst } from "@/components/motion/Burst";
import { OptionImage } from "@/components/OptionImage";
import type { TallyResult } from "@/lib/polls/tally";
import type { Poll } from "@/lib/polls/types";

const GOLD = ["--gold", "--accent", "--gold"];
const GREEN = ["--good", "--gold"];
const DURATION = 3200;

type Scene =
  | { type: "winner"; label: string; image: string | null; votes: number; pct: number }
  | { type: "approved"; yes: number; no: number }
  | { type: "rejected"; yes: number; no: number }
  | { type: "tie"; labels: string[] };

function sceneFor(poll: Poll, result: TallyResult): Scene | null {
  const { outcome } = result;
  if (outcome.type === "no_votes") return null;
  const row = (id: string) => result.rows.find((r) => r.optionId === id);
  const label = (id: string) => poll.options.find((o) => o.id === id)?.label ?? "?";

  if (poll.kind === "approval") {
    const yesId = poll.options.find((o) => o.position === 0)?.id ?? "";
    const noId = poll.options.find((o) => o.position === 1)?.id ?? "";
    const yes = row(yesId)?.votes ?? 0;
    const no = row(noId)?.votes ?? 0;
    if (outcome.type === "tie") return { type: "tie", labels: ["Sim", "Não"] };
    return outcome.optionIds[0] === yesId ? { type: "approved", yes, no } : { type: "rejected", yes, no };
  }

  if (outcome.type === "tie") return { type: "tie", labels: outcome.optionIds.map(label) };
  const id = outcome.optionIds[0];
  const r = row(id);
  return {
    type: "winner",
    label: label(id),
    image: poll.options.find((o) => o.id === id)?.imageUrl ?? null,
    votes: r?.votes ?? 0,
    pct: Math.round((r?.share ?? 0) * 100),
  };
}

/**
 * Efeito breve que revela o resultado ao abrir uma votação encerrada (toda vez que abrir).
 * Toque, clique ou Esc pulam. Quem pediu menos movimento no sistema não vê o efeito.
 */
export function WinnerReveal({ poll, result }: { poll: Poll; result: TallyResult }) {
  const [show, setShow] = useState(false);
  const mounted = useMounted();
  const scene = sceneFor(poll, result);

  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- só no cliente, depois de montar
    setShow(true);
    const t = setTimeout(() => setShow(false), DURATION);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setShow(false);
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  // portal: fica fora dos blocos animados (transform prenderia o "fixed" dentro deles)
  if (!mounted) return null;
  return createPortal(
    <AnimatePresence>
      {show && scene && (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center overflow-hidden bg-bg/80 px-6 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.45 } }}
          onClick={() => setShow(false)}
          role="dialog"
          aria-label="Resultado da votação"
        >
          {(scene.type === "winner" || scene.type === "approved") && (
            <Burst colors={scene.type === "winner" ? GOLD : GREEN} count={90} spread={0.55} />
          )}

          <motion.div
            className="relative flex max-w-sm flex-col items-center gap-4 text-center"
            initial={{ y: 20 }}
            animate={{ y: 0 }}
            exit={{ y: -12, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
          >
            <motion.p
              className="line-clamp-2 text-xs font-semibold tracking-[0.2em] text-muted uppercase"
              initial={{ opacity: 0, letterSpacing: "0.5em" }}
              animate={{ opacity: 1, letterSpacing: "0.2em" }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            >
              {poll.title}
            </motion.p>

            <Emblem scene={scene} />

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-1"
            >
              <Caption scene={scene} />
            </motion.div>

            <motion.p
              className="pt-4 text-xs text-muted"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.8 }}
              transition={{ delay: 1.4 }}
            >
              Toque pra ver os detalhes
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

function Emblem({ scene }: { scene: Scene }) {
  const pop = { type: "spring", stiffness: 300, damping: 14, delay: 0.15 } as const;

  if (scene.type === "winner") {
    return (
      <div className="relative grid place-items-center py-2">
        {/* raios girando atrás */}
        <motion.div
          className="absolute size-72 rounded-full opacity-60"
          style={{
            background:
              "repeating-conic-gradient(from 0deg, color-mix(in oklab, var(--gold) 40%, transparent) 0deg 8deg, transparent 8deg 24deg)",
            maskImage: "radial-gradient(circle, black 20%, transparent 68%)",
          }}
          initial={{ scale: 0.4, opacity: 0, rotate: 0 }}
          animate={{ scale: 1, opacity: 0.6, rotate: 90 }}
          transition={{ scale: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }, opacity: { duration: 0.6 }, rotate: { duration: 8, ease: "linear" } }}
          aria-hidden
        />
        <motion.div initial={{ scale: 0, rotate: -12 }} animate={{ scale: 1, rotate: 0 }} transition={pop} className="relative">
          {scene.image ? (
            <div className="relative">
              <OptionImage
                src={scene.image}
                alt={scene.label}
                className="size-40 rounded-3xl shadow-[0_20px_50px_-15px_var(--gold)] ring-4 ring-gold"
              />
              <span className="absolute -right-3 -bottom-3 grid size-12 place-items-center rounded-full bg-gold text-white shadow-lg">
                <Trophy size={24} />
              </span>
            </div>
          ) : (
            <span className="grid size-28 place-items-center rounded-full bg-linear-to-br from-gold to-[color-mix(in_oklab,var(--gold)_70%,var(--accent))] text-white shadow-[0_20px_50px_-12px_var(--gold)]">
              <Trophy size={52} strokeWidth={1.8} />
            </span>
          )}
        </motion.div>
      </div>
    );
  }

  if (scene.type === "approved" || scene.type === "rejected") {
    const ok = scene.type === "approved";
    return (
      <div className="relative grid place-items-center py-2">
        {ok &&
          [0, 0.15].map((d) => (
            <motion.span
              key={d}
              className="absolute size-28 rounded-full border-2 border-good"
              initial={{ scale: 0.8, opacity: 0.8 }}
              animate={{ scale: 2.2, opacity: 0 }}
              transition={{ duration: 1, delay: 0.3 + d, ease: "easeOut" }}
              aria-hidden
            />
          ))}
        <motion.span
          className={`grid size-28 place-items-center rounded-full text-white shadow-2xl ${ok ? "bg-good" : "bg-bad"}`}
          initial={ok ? { scale: 0 } : { scale: 1.8, opacity: 0, rotate: -14 }}
          animate={ok ? { scale: 1 } : { scale: 1, opacity: 1, rotate: -6 }}
          transition={ok ? pop : { type: "spring", stiffness: 500, damping: 22, delay: 0.15 }}
        >
          {ok ? <Check size={56} strokeWidth={3} /> : <X size={56} strokeWidth={3} />}
        </motion.span>
      </div>
    );
  }

  return (
    <motion.span
      className="grid size-28 place-items-center rounded-full bg-warn text-white shadow-2xl"
      initial={{ scale: 0, rotate: 0 }}
      animate={{ scale: 1, rotate: [0, -10, 10, -5, 0] }}
      transition={{ scale: pop, rotate: { duration: 1.1, delay: 0.4 } }}
    >
      <Scale size={50} strokeWidth={2} />
    </motion.span>
  );
}

function Caption({ scene }: { scene: Scene }) {
  switch (scene.type) {
    case "winner":
      return (
        <>
          <p className="text-sm font-medium text-gold">Venceu</p>
          <p className="text-3xl font-bold tracking-tight text-balance">{scene.label}</p>
          <p className="text-sm text-muted">
            {scene.votes} {scene.votes === 1 ? "voto" : "votos"} · {scene.pct}%
          </p>
        </>
      );
    case "approved":
    case "rejected":
      return (
        <>
          <p className={`text-3xl font-bold tracking-tight ${scene.type === "approved" ? "text-good" : "text-bad"}`}>
            {scene.type === "approved" ? "Aprovado" : "Rejeitado"}
          </p>
          <p className="text-sm text-muted">
            {scene.yes} Sim × {scene.no} Não
          </p>
        </>
      );
    case "tie":
      return (
        <>
          <p className="text-3xl font-bold tracking-tight text-warn">Empate</p>
          <p className="text-sm text-muted text-balance">entre {scene.labels.join(" e ")}</p>
        </>
      );
  }
}
