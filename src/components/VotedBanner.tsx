"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

const noop = () => () => {};
/** true só no navegador, depois de hidratar (portal não pode existir no HTML do servidor) */
const useMounted = () => useSyncExternalStore(noop, () => true, () => false);
import { AnimatePresence, motion } from "motion/react";
import { CircleCheck } from "lucide-react";
import { Burst } from "@/components/motion/Burst";

export type VoteTone = "yes" | "no" | "vote";

/** O formulário marca isto ao enviar; o banner consome e toca o efeito uma vez. */
export const justVotedKey = (pollId: string) => `voteme:just-voted:${pollId}`;

const TONES: Record<VoteTone, { bg: string; text: string; colors: string[] | null }> = {
  yes: { bg: "bg-good", text: "Você votou Sim", colors: ["--good", "--gold"] },
  no: { bg: "bg-bad", text: "Você votou Não", colors: null },
  vote: { bg: "bg-accent", text: "Voto registrado", colors: ["--accent", "--gold"] },
};
const GOOD_GOLD = TONES.yes.colors!;
const ACCENT_GOLD = TONES.vote.colors!;

export function VotedBanner({ pollId, canChange }: { pollId: string; canChange: boolean }) {
  const [effect, setEffect] = useState<VoteTone | null>(null);
  const mounted = useMounted();

  useEffect(() => {
    let tone: string | null = null;
    try {
      tone = sessionStorage.getItem(justVotedKey(pollId));
      sessionStorage.removeItem(justVotedKey(pollId));
    } catch {
      /* sem storage */
    }
    if (tone !== "yes" && tone !== "no" && tone !== "vote") return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- lê o sessionStorage só depois de montar (no servidor não existe)
    setEffect(tone);
    const t = setTimeout(() => setEffect(null), 1700);
    return () => clearTimeout(t);
  }, [pollId]);

  return (
    <>
      <motion.p
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 rounded-xl bg-good-soft px-4 py-3 text-sm font-medium text-good"
      >
        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 15, delay: 0.1 }}>
          <CircleCheck size={18} />
        </motion.span>
        <span>
          Seu voto foi registrado
          {canChange && " — você ainda pode mudar enquanto estiver aberta."}
        </span>
      </motion.p>

      {/* portal: fica fora dos blocos animados (transform prenderia o "fixed" dentro deles) */}
      {mounted &&
        createPortal(
          <AnimatePresence>{effect && <VoteCast tone={effect} onDone={() => setEffect(null)} />}</AnimatePresence>,
          document.body,
        )}
    </>
  );
}

function VoteCast({ tone, onDone }: { tone: VoteTone; onDone: () => void }) {
  const t = TONES[tone];
  const isNo = tone === "no";

  return (
    <motion.div
      className="fixed inset-0 z-50 grid place-items-center bg-bg/70 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.35 } }}
      onClick={onDone}
      role="status"
      aria-live="polite"
    >
      {t.colors && <Burst colors={tone === "yes" ? GOOD_GOLD : ACCENT_GOLD} count={tone === "yes" ? 80 : 60} />}

      <div className="flex flex-col items-center gap-5">
        <div className="relative grid place-items-center">
          {/* anéis que se espalham */}
          {[0, 0.12].map((delay) => (
            <motion.span
              key={delay}
              className={`absolute size-28 rounded-full border-2 ${isNo ? "border-bad" : tone === "yes" ? "border-good" : "border-accent"}`}
              initial={{ scale: 0.8, opacity: 0.8 }}
              animate={{ scale: 2.1, opacity: 0 }}
              transition={{ duration: 0.9, delay: 0.15 + delay, ease: "easeOut" }}
            />
          ))}

          <motion.div
            className={`grid size-28 place-items-center rounded-full ${t.bg} text-white shadow-2xl`}
            initial={{ scale: 0, rotate: isNo ? 0 : -45 }}
            animate={isNo ? { scale: 1, rotate: 0, x: [0, 0, -9, 9, -6, 6, 0] } : { scale: 1, rotate: 0 }}
            transition={
              isNo
                ? { scale: { type: "spring", stiffness: 400, damping: 16 }, x: { duration: 0.55, delay: 0.35 } }
                : { type: "spring", stiffness: 380, damping: 15 }
            }
          >
            <svg viewBox="0 0 24 24" className="size-14">
              {isNo ? (
                <>
                  <motion.path d="M6.5 6.5l11 11" {...stroke(0.2)} />
                  <motion.path d="M17.5 6.5l-11 11" {...stroke(0.32)} />
                </>
              ) : (
                <motion.path d="M4.5 12.5l5 5L19.5 7" {...stroke(0.2)} />
              )}
            </svg>
          </motion.div>
        </div>

        <motion.p
          className="text-xl font-bold tracking-tight"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          {t.text}
        </motion.p>
      </div>
    </motion.div>
  );
}

const stroke = (delay: number) => ({
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  initial: { pathLength: 0 },
  animate: { pathLength: 1 },
  transition: { duration: 0.35, delay, ease: "easeOut" as const },
});
