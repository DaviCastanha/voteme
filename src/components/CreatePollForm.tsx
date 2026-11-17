"use client";

import { startTransition, useActionState, useId, useState } from "react";
import { createPoll, type ActionState } from "@/lib/polls/actions";
import { KIND_LABEL, type PollKind } from "@/lib/polls/types";

const KIND_HINT: Record<PollKind, string> = {
  single: "Cada pessoa escolhe uma opção",
  multiple: "Cada pessoa marca várias",
  approval: "Sim, não ou abstenção",
};

function Choice({
  name,
  value,
  checked,
  onChange,
  title,
  hint,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: () => void;
  title: string;
  hint?: string;
}) {
  return (
    <label
      className={`flex cursor-pointer flex-col rounded-xl border px-3 py-2.5 transition ${
        checked ? "border-accent bg-accent-soft" : "border-line hover:border-accent/50"
      }`}
    >
      <input type="radio" name={name} value={value} checked={checked} onChange={onChange} className="sr-only" />
      <span className="text-sm font-semibold">{title}</span>
      {hint && <span className="text-xs text-muted">{hint}</span>}
    </label>
  );
}

export function CreatePollForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(createPoll, undefined);
  const [kind, setKind] = useState<PollKind>("single");
  const [options, setOptions] = useState<{ id: number; value: string }[]>([
    { id: 1, value: "" },
    { id: 2, value: "" },
    { id: 3, value: "" },
  ]);
  const [identity, setIdentity] = useState<"anonymous" | "named">("anonymous");
  const [visibility, setVisibility] = useState<"live" | "after_close">("live");
  const [closesIn, setClosesIn] = useState("none");
  const [customLocal, setCustomLocal] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const uid = useId();

  const filled = options.filter((o) => o.value.trim()).length;

  function updateOption(id: number, value: string) {
    setOptions((cur) => {
      const next = cur.map((o) => (o.id === id ? { ...o, value } : o));
      // sempre deixa um campo vazio no fim pra ir digitando
      const last = next[next.length - 1];
      if (last.value.trim() && next.length < 20) next.push({ id: Math.max(...next.map((o) => o.id)) + 1, value: "" });
      return next;
    });
  }

  function removeOption(id: number) {
    setOptions((cur) => (cur.length <= 2 ? cur : cur.filter((o) => o.id !== id)));
  }

  // datetime-local vem sem fuso; convertemos aqui, no fuso de quem está criando
  const customIso = customLocal ? new Date(customLocal).toISOString() : "";

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        // sem <form action>: o React 19 limparia os campos mesmo quando volta erro
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => action(data));
      }}
    >
      <div className="card space-y-4">
        <div>
          <label htmlFor={`${uid}-title`} className="label">
            O que vocês precisam decidir?
          </label>
          <input
            id={`${uid}-title`}
            name="title"
            required
            maxLength={200}
            autoFocus
            className="input text-lg"
            placeholder="Onde vamos jantar sexta?"
          />
        </div>

        <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Tipo de votação">
          {(Object.keys(KIND_LABEL) as PollKind[]).map((k) => (
            <Choice
              key={k}
              name="kind"
              value={k}
              checked={kind === k}
              onChange={() => setKind(k)}
              title={KIND_LABEL[k]}
              hint={KIND_HINT[k]}
            />
          ))}
        </div>

        {kind !== "approval" ? (
          <div className="space-y-2">
            <span className="label">Opções</span>
            {options.map((o, i) => (
              <div key={o.id} className="flex items-center gap-2">
                <input
                  name="option"
                  value={o.value}
                  onChange={(e) => updateOption(o.id, e.target.value)}
                  maxLength={120}
                  className="input"
                  placeholder={["Japonês", "Pizza", "Hamburgueria"][i] ?? `Opção ${i + 1}`}
                  aria-label={`Opção ${i + 1}`}
                />
                {options.length > 2 && i < options.length - 1 && (
                  <button
                    type="button"
                    onClick={() => removeOption(o.id)}
                    className="grid size-10 shrink-0 place-items-center rounded-xl text-muted hover:bg-bg hover:text-bad"
                    aria-label={`Remover opção ${i + 1}`}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            {kind === "multiple" && filled > 2 && (
              <div className="flex items-center gap-2 pt-1 text-sm">
                <label htmlFor={`${uid}-max`} className="text-muted">
                  Cada pessoa pode marcar até
                </label>
                <select id={`${uid}-max`} name="maxChoices" className="input w-auto py-1.5" defaultValue="">
                  <option value="">todas</option>
                  {Array.from({ length: filled - 1 }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        ) : (
          <p className="rounded-xl bg-bg px-4 py-3 text-sm text-muted">
            As pessoas vão votar <strong className="text-ink">Sim</strong> ou <strong className="text-ink">Não</strong>.
            Aprovado se tiver mais Sim do que Não.
          </p>
        )}

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="abstention"
            defaultChecked={kind === "approval"}
            key={kind /* reinicia o padrão ao trocar de tipo */}
            className="size-4 accent-[var(--accent)]"
          />
          Incluir opção &quot;Abstenção&quot;
        </label>
      </div>

      <div className="card space-y-4">
        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          className="flex w-full items-center justify-between text-left text-sm font-semibold"
          aria-expanded={showAdvanced}
        >
          Regras da votação
          <span className="text-muted">{showAdvanced ? "−" : "+"}</span>
        </button>
        {!showAdvanced && (
          <p className="-mt-2 text-sm text-muted">
            {identity === "named" ? "Com nome" : "Anônima"} · {visibility === "live" ? "resultado ao vivo" : "resultado só no fim"} ·{" "}
            {closesIn === "none" ? "sem prazo" : "com prazo"}
          </p>
        )}

        {/* inputs ficam sempre no DOM pra irem no submit, mesmo com o painel fechado */}
        <div className={showAdvanced ? "space-y-4" : "hidden"}>
          <fieldset>
            <legend className="label">Quem votou aparece?</legend>
            <div className="grid grid-cols-2 gap-2">
              <Choice name="identityMode" value="anonymous" checked={identity === "anonymous"} onChange={() => setIdentity("anonymous")} title="Anônima" hint="Ninguém sabe quem votou" />
              <Choice name="identityMode" value="named" checked={identity === "named"} onChange={() => setIdentity("named")} title="Com nome" hint="Cada um digita o nome" />
            </div>
          </fieldset>

          <fieldset>
            <legend className="label">Resultado</legend>
            <div className="grid grid-cols-2 gap-2">
              <Choice name="resultsVisibility" value="live" checked={visibility === "live"} onChange={() => setVisibility("live")} title="Ao vivo" hint="Todo mundo acompanha" />
              <Choice name="resultsVisibility" value="after_close" checked={visibility === "after_close"} onChange={() => setVisibility("after_close")} title="Só no fim" hint="Evita efeito manada" />
            </div>
          </fieldset>

          <div>
            <label htmlFor={`${uid}-closes`} className="label">
              Encerrar automaticamente
            </label>
            <select
              id={`${uid}-closes`}
              name="closesIn"
              value={closesIn}
              onChange={(e) => setClosesIn(e.target.value)}
              className="input"
            >
              <option value="none">Não, eu encerro manualmente</option>
              <option value="1h">Em 1 hora</option>
              <option value="1d">Em 24 horas</option>
              <option value="3d">Em 3 dias</option>
              <option value="7d">Em 7 dias</option>
              <option value="custom">Escolher data e hora…</option>
            </select>
            {closesIn === "custom" && (
              <input
                type="datetime-local"
                value={customLocal}
                onChange={(e) => setCustomLocal(e.target.value)}
                className="input mt-2"
              />
            )}
            <input type="hidden" name="closesAtCustom" value={customIso} />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="allowVoteChange" className="size-4 accent-[var(--accent)]" />
            Permitir que a pessoa mude o voto enquanto estiver aberta
          </label>
        </div>
      </div>

      {state?.error && <p className="text-sm font-medium text-bad">{state.error}</p>}

      <button type="submit" className="btn-primary w-full py-4 text-base" disabled={pending}>
        {pending ? "Criando…" : "Criar e pegar o link"}
      </button>
    </form>
  );
}
