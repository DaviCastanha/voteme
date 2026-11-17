"use client";

import { startTransition, useActionState, useState } from "react";
import { castVote, type ActionState } from "@/lib/polls/actions";
import type { Poll } from "@/lib/polls/types";

interface Props {
  poll: Pick<Poll, "slug" | "kind" | "maxChoices" | "identityMode" | "options">;
  initialChoices: string[];
  initialName: string | null;
  isChange: boolean;
}

export function VoteForm({ poll, initialChoices, initialName, isChange }: Props) {
  const [state, action, pending] = useActionState<ActionState, FormData>(castVote.bind(null, poll.slug), undefined);
  const [selected, setSelected] = useState<string[]>(initialChoices);

  const multiple = poll.kind === "multiple";
  const abstentionId = poll.options.find((o) => o.isAbstention)?.id;
  const limitReached = multiple && poll.maxChoices !== null && selected.length >= poll.maxChoices;

  function toggle(id: string) {
    if (!multiple) return setSelected([id]);
    setSelected((cur) => {
      if (cur.includes(id)) return cur.filter((x) => x !== id);
      if (id === abstentionId) return [id]; // abstenção é exclusiva
      const base = cur.filter((x) => x !== abstentionId);
      if (poll.maxChoices !== null && base.length >= poll.maxChoices) return base;
      return [...base, id];
    });
  }

  return (
    <form
      className="card space-y-4"
      onSubmit={(e) => {
        // sem <form action>: o React 19 limparia os campos mesmo quando volta erro
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => action(data));
      }}
    >
      <fieldset className="space-y-2.5">
        <legend className="mb-3 text-sm text-muted">
          {multiple
            ? poll.maxChoices
              ? `Marque até ${poll.maxChoices} opções`
              : "Marque quantas quiser"
            : "Escolha uma opção"}
        </legend>

        {poll.options.map((o) => {
          const checked = selected.includes(o.id);
          const disabled = !checked && limitReached && o.id !== abstentionId;
          return (
            <label
              key={o.id}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3.5 transition select-none ${
                checked ? "border-accent bg-accent-soft" : "border-line hover:border-accent/50"
              } ${disabled ? "cursor-not-allowed opacity-50" : ""} ${o.isAbstention ? "text-muted" : ""}`}
            >
              <input
                type={multiple ? "checkbox" : "radio"}
                name="option"
                value={o.id}
                checked={checked}
                disabled={disabled}
                onChange={() => toggle(o.id)}
                className="size-5 accent-[var(--accent)]"
              />
              <span className="text-base">{o.label}</span>
            </label>
          );
        })}
      </fieldset>

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
            defaultValue={initialName ?? ""}
            autoComplete="name"
            placeholder="Como o grupo te conhece"
          />
          <p className="mt-1 text-xs text-muted">Nessa votação todos veem quem participou.</p>
        </div>
      )}

      {state?.error && <p className="text-sm font-medium text-bad">{state.error}</p>}

      <button type="submit" className="btn-primary w-full text-base" disabled={pending || selected.length === 0}>
        {pending ? "Enviando…" : isChange ? "Alterar meu voto" : "Votar"}
      </button>
    </form>
  );
}
