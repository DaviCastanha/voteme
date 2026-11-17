"use client";

import { startTransition, useActionState, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, Loader2, ThumbsDown, ThumbsUp, X } from "lucide-react";
import { OptionImage } from "@/components/OptionImage";
import { castVote, type ActionState } from "@/lib/polls/actions";
import type { Poll, PollOption } from "@/lib/polls/types";
import { justVotedKey, type VoteTone } from "@/components/VotedBanner";

interface Props {
  poll: Pick<Poll, "id" | "slug" | "kind" | "maxChoices" | "identityMode" | "options">;
  initialChoices: string[];
  initialName: string | null;
  isChange: boolean;
}

const spring = { type: "spring", stiffness: 500, damping: 30 } as const;

export function VoteForm({ poll, initialChoices, initialName, isChange }: Props) {
  const [state, action, pending] = useActionState<ActionState, FormData>(castVote.bind(null, poll.slug), undefined);
  const [selected, setSelected] = useState<string[]>(initialChoices);
  const [name, setName] = useState(initialName ?? "");

  const multiple = poll.kind === "multiple";
  const abstention = poll.options.find((o) => o.isAbstention);
  const contenders = poll.options.filter((o) => !o.isAbstention);
  const withImages = contenders.some((o) => o.imageUrl);
  const limitReached = multiple && poll.maxChoices !== null && selected.filter((id) => id !== abstention?.id).length >= poll.maxChoices;

  // se o voto falhar, não toca o efeito de "voto registrado"
  useEffect(() => {
    if (state?.error) sessionStorage.removeItem(justVotedKey(poll.id));
  }, [state, poll.id]);

  function toggle(id: string) {
    if (!multiple) return setSelected((cur) => (cur[0] === id ? cur : [id]));
    setSelected((cur) => {
      if (cur.includes(id)) return cur.filter((x) => x !== id);
      if (id === abstention?.id) return [id]; // abstenção é exclusiva
      const base = cur.filter((x) => x !== abstention?.id);
      if (poll.maxChoices !== null && base.length >= poll.maxChoices) return base;
      return [...base, id];
    });
  }

  function tone(): VoteTone {
    if (poll.kind !== "approval") return "vote";
    const pick = poll.options.find((o) => o.id === selected[0]);
    if (!pick || pick.isAbstention) return "vote";
    return pick.position === 0 ? "yes" : "no";
  }

  const choiceProps = (o: PollOption) => ({
    option: o,
    checked: selected.includes(o.id),
    disabled: !selected.includes(o.id) && limitReached && o.id !== abstention?.id,
    multiple,
    onToggle: () => toggle(o.id),
  });

  return (
    <form
      className="card space-y-5"
      onSubmit={(e) => {
        // sem <form action>: o React 19 limparia os campos mesmo quando volta erro
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        try {
          sessionStorage.setItem(justVotedKey(poll.id), tone());
        } catch {
          /* sem storage: só não toca o efeito */
        }
        startTransition(() => action(data));
      }}
    >
      {selected.map((id) => (
        <input key={id} type="hidden" name="option" value={id} />
      ))}

      <p className="text-sm text-muted">
        {poll.kind === "approval"
          ? "Qual é o seu voto?"
          : multiple
            ? poll.maxChoices
              ? `Marque até ${poll.maxChoices} opções`
              : "Marque quantas quiser"
            : "Escolha uma opção"}
      </p>

      {poll.kind === "approval" ? (
        <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Seu voto">
          {contenders.slice(0, 2).map((o) => (
            <ApprovalTile key={o.id} {...choiceProps(o)} positive={o.position === 0} dimmed={selected.length > 0 && !selected.includes(o.id)} />
          ))}
        </div>
      ) : withImages ? (
        <div className="grid grid-cols-2 gap-3" role={multiple ? "group" : "radiogroup"} aria-label="Opções">
          {contenders.map((o, i) => (
            <ImageChoice key={o.id} {...choiceProps(o)} index={i} />
          ))}
        </div>
      ) : (
        <div className="space-y-2.5" role={multiple ? "group" : "radiogroup"} aria-label="Opções">
          {contenders.map((o, i) => (
            <RowChoice key={o.id} {...choiceProps(o)} index={i} />
          ))}
        </div>
      )}

      {abstention && (
        <div className="flex justify-center">
          <motion.button
            type="button"
            role={multiple ? "checkbox" : "radio"}
            aria-checked={selected.includes(abstention.id)}
            onClick={() => toggle(abstention.id)}
            whileTap={{ scale: 0.96 }}
            className={`rounded-full border px-4 py-2 text-sm transition-colors ${
              selected.includes(abstention.id)
                ? "border-ink bg-ink text-bg"
                : "border-line text-muted hover:border-muted hover:text-ink"
            }`}
          >
            {selected.includes(abstention.id) ? "✓ Me abstenho" : "Prefiro me abster"}
          </motion.button>
        </div>
      )}

      {poll.identityMode === "named" && (
        <div>
          <label htmlFor="name" className="label">
            Seu nome
          </label>
          <input
            id="name"
            name="name"
            className="input"
            required
            maxLength={80}
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            placeholder="Como o grupo te conhece"
          />
          <p className="mt-1 text-xs text-muted">Nessa votação todos veem quem participou.</p>
        </div>
      )}

      <AnimatePresence>
        {state?.error && (
          <motion.p
            key={state.error}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0, x: [0, -5, 5, -2, 0] }}
            exit={{ opacity: 0 }}
            className="text-sm font-medium text-bad"
            role="alert"
          >
            {state.error}
          </motion.p>
        )}
      </AnimatePresence>

      <button type="submit" className="btn-primary w-full py-3.5 text-base" disabled={pending || selected.length === 0}>
        {pending ? (
          <>
            <Loader2 size={18} className="animate-spin" /> Enviando…
          </>
        ) : isChange ? (
          "Alterar meu voto"
        ) : (
          "Votar"
        )}
      </button>
    </form>
  );
}

interface ChoiceProps {
  option: PollOption;
  checked: boolean;
  disabled: boolean;
  multiple: boolean;
  onToggle: () => void;
}

/** Bolinha/quadradinho com o check desenhado. */
function Indicator({ checked, multiple }: { checked: boolean; multiple: boolean }) {
  return (
    <span
      className={`grid size-6 shrink-0 place-items-center border-2 transition-colors duration-200 ${
        multiple ? "rounded-md" : "rounded-full"
      } ${checked ? "border-accent bg-accent" : "border-line bg-card"}`}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" className="size-4 text-accent-ink">
        <motion.path
          d="M5 12.5l4.5 4.5L19 7.5"
          fill="none"
          stroke="currentColor"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={false}
          animate={{ pathLength: checked ? 1 : 0, opacity: checked ? 1 : 0 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
        />
      </svg>
    </span>
  );
}

function RowChoice({ option, checked, disabled, multiple, onToggle, index }: ChoiceProps & { index: number }) {
  return (
    <motion.button
      type="button"
      role={multiple ? "checkbox" : "radio"}
      aria-checked={checked}
      disabled={disabled}
      onClick={onToggle}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: disabled ? 0.45 : 1, y: 0, scale: checked ? [1, 1.015, 1] : 1 }}
      transition={{ ...spring, delay: index * 0.04, scale: { duration: 0.3 } }}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition-colors duration-200 ${
        checked
          ? "border-accent bg-accent-soft shadow-[0_0_0_3px_color-mix(in_oklab,var(--accent)_18%,transparent)]"
          : "border-line hover:border-accent/50 hover:bg-bg"
      } ${disabled ? "cursor-not-allowed" : ""}`}
    >
      <Indicator checked={checked} multiple={multiple} />
      <span className="text-base">{option.label}</span>
    </motion.button>
  );
}

function ImageChoice({ option, checked, disabled, multiple, onToggle, index }: ChoiceProps & { index: number }) {
  return (
    <motion.button
      type="button"
      role={multiple ? "checkbox" : "radio"}
      aria-checked={checked}
      disabled={disabled}
      onClick={onToggle}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: disabled ? 0.45 : 1, y: 0 }}
      transition={{ ...spring, delay: index * 0.05 }}
      whileHover={disabled ? undefined : { y: -2 }}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      className={`group relative flex flex-col overflow-hidden rounded-2xl border-2 bg-card text-left transition-[border-color,box-shadow] duration-200 ${
        checked
          ? "border-accent shadow-[0_8px_24px_-10px_var(--accent)]"
          : "border-line hover:border-accent/40"
      }`}
    >
      {option.imageUrl ? (
        <OptionImage src={option.imageUrl} alt={option.label} className="aspect-[4/3] w-full" />
      ) : (
        <div className="grid aspect-[4/3] w-full place-items-center bg-accent-soft text-4xl font-bold text-accent" aria-hidden>
          {option.label.trim().charAt(0).toUpperCase()}
        </div>
      )}
      <div className="flex items-center gap-2 p-3">
        <Indicator checked={checked} multiple={multiple} />
        <span className="line-clamp-2 text-sm font-medium">{option.label}</span>
      </div>
      <AnimatePresence>
        {checked && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute inset-0 bg-accent/10"
            aria-hidden
          />
        )}
      </AnimatePresence>
    </motion.button>
  );
}

/** Bloco grande de Sim / Não, cada um com sua reação ao toque. */
function ApprovalTile({
  option,
  checked,
  onToggle,
  positive,
  dimmed,
}: ChoiceProps & { positive: boolean; dimmed: boolean }) {
  const Icon = positive ? ThumbsUp : ThumbsDown;
  const Mark = positive ? Check : X;

  return (
    <motion.button
      type="button"
      role="radio"
      aria-checked={checked}
      onClick={onToggle}
      animate={
        checked
          ? positive
            ? { scale: [1, 1.04, 1], opacity: 1 }
            : { x: [0, -7, 7, -4, 4, 0], scale: 1, opacity: 1 }
          : { scale: dimmed ? 0.96 : 1, opacity: dimmed ? 0.55 : 1, x: 0 }
      }
      transition={{ duration: 0.4, ease: "easeOut" }}
      whileTap={{ scale: 0.95 }}
      className={`relative flex aspect-[5/4] flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border-2 transition-colors duration-300 ${
        checked
          ? positive
            ? "border-good bg-good text-white"
            : "border-bad bg-bad text-white"
          : positive
            ? "border-good/30 bg-good-soft text-good hover:border-good/60"
            : "border-bad/30 bg-bad-soft text-bad hover:border-bad/60"
      }`}
    >
      {/* onda que se espalha ao escolher */}
      <AnimatePresence>
        {checked && (
          <motion.span
            key="ripple"
            className="pointer-events-none absolute top-1/2 left-1/2 size-24 -translate-1/2 rounded-full bg-white/35"
            initial={{ scale: 0, opacity: 0.7 }}
            animate={{ scale: 4, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            aria-hidden
          />
        )}
      </AnimatePresence>

      <span className="relative grid size-12 place-items-center">
        <AnimatePresence mode="popLayout" initial={false}>
          {checked ? (
            <motion.span
              key="mark"
              initial={{ scale: 0, rotate: positive ? -30 : 30 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0 }}
              transition={{ type: "spring", stiffness: 600, damping: 18 }}
            >
              <Mark size={40} strokeWidth={3} />
            </motion.span>
          ) : (
            <motion.span key="icon" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.6, opacity: 0 }}>
              <Icon size={30} strokeWidth={2.2} />
            </motion.span>
          )}
        </AnimatePresence>
      </span>
      <span className="relative text-xl font-bold">{option.label}</span>
    </motion.button>
  );
}
