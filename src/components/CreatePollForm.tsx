"use client";

import { startTransition, useActionState, useId, useState, type CSSProperties } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown, ImagePlus, Loader2, X } from "lucide-react";
import { OptionImage } from "@/components/OptionImage";
import { createPoll, type ActionState } from "@/lib/polls/actions";
import { isImageUrl, KIND_LABEL, looksLikeImageLink, type PollKind } from "@/lib/polls/types";

const KIND_HINT: Record<PollKind, string> = {
  single: "Cada pessoa escolhe uma opção",
  multiple: "Cada pessoa marca várias",
  approval: "Sim, não ou abstenção",
};

const spring = { type: "spring", stiffness: 500, damping: 38 } as const;

/** Botão de escolha num grupo; o destaque desliza entre as opções (layoutId). */
function Choice({
  group,
  name,
  value,
  checked,
  onChange,
  title,
  hint,
}: {
  group: string;
  name: string;
  value: string;
  checked: boolean;
  onChange: () => void;
  title: string;
  hint?: string;
}) {
  return (
    <label className="relative flex cursor-pointer flex-col rounded-xl border border-line px-3 py-2.5 transition-colors hover:border-accent/50">
      {checked && (
        <motion.span
          layoutId={`${group}-highlight`}
          className="absolute -inset-px rounded-xl border border-accent bg-accent-soft"
          transition={spring}
          aria-hidden
        />
      )}
      <input type="radio" name={name} value={value} checked={checked} onChange={onChange} className="peer sr-only" />
      <span className="relative text-sm font-semibold">{title}</span>
      {hint && <span className="relative text-xs text-muted">{hint}</span>}
      <span className="pointer-events-none absolute -inset-px rounded-xl peer-focus-visible:ring-2 peer-focus-visible:ring-accent/40" aria-hidden />
    </label>
  );
}

interface Row {
  id: number;
  value: string;
  image: string;
  showImage: boolean;
}

const PLACEHOLDERS = ["Japonês", "Pizza", "Hamburgueria"];

export function CreatePollForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(createPoll, undefined);
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<PollKind>("single");
  const [rows, setRows] = useState<Row[]>([1, 2, 3].map((id) => ({ id, value: "", image: "", showImage: false })));
  const [identity, setIdentity] = useState<"anonymous" | "named">("anonymous");
  const [visibility, setVisibility] = useState<"live" | "after_close">("live");
  const [closesIn, setClosesIn] = useState("none");
  const [customLocal, setCustomLocal] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const uid = useId();

  const isFilled = (r: Row) => Boolean(r.value.trim() || r.image.trim());
  const filled = rows.filter(isFilled).length;

  function patch(id: number, change: Partial<Row>) {
    setRows((cur) => {
      const next = cur.map((r) => (r.id === id ? { ...r, ...change } : r));
      // sempre deixa uma linha vazia no fim pra ir digitando
      const last = next[next.length - 1];
      if (isFilled(last) && next.length < 20) {
        next.push({ id: Math.max(...next.map((r) => r.id)) + 1, value: "", image: "", showImage: false });
      }
      return next;
    });
  }

  function onLabelChange(row: Row, value: string) {
    // colou um link de imagem no nome? vira a imagem da opção
    if (!row.image && looksLikeImageLink(value)) return patch(row.id, { value: "", image: value.trim(), showImage: true });
    patch(row.id, { value });
  }

  function removeRow(id: number) {
    setRows((cur) => (cur.length <= 2 ? cur : cur.filter((r) => r.id !== id)));
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
      <div className="card animate-rise space-y-5">
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
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input text-lg"
            placeholder="Onde vamos jantar sexta?"
          />
        </div>

        <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Tipo de votação">
          {(Object.keys(KIND_LABEL) as PollKind[]).map((k) => (
            <Choice
              key={k}
              group="kind"
              name="kind"
              value={k}
              checked={kind === k}
              onChange={() => setKind(k)}
              title={KIND_LABEL[k]}
              hint={KIND_HINT[k]}
            />
          ))}
        </div>

        <AnimatePresence mode="wait" initial={false}>
          {kind !== "approval" ? (
            <motion.div
              key="options"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="space-y-2"
            >
              <div className="flex items-baseline justify-between">
                <span className="label">Opções</span>
                <span className="text-xs text-muted">Toque em 🖼 pra pôr uma imagem</span>
              </div>

              <AnimatePresence initial={false}>
                {rows.map((r, i) => {
                  const imageOk = r.image.trim() === "" || isImageUrl(r.image.trim());
                  return (
                    <motion.div
                      key={r.id}
                      layout
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={spring}
                      className="overflow-hidden"
                    >
                      <div className="flex items-center gap-2 pb-0.5">
                        <button
                          type="button"
                          onClick={() => patch(r.id, { showImage: !r.showImage })}
                          aria-label={`Imagem da opção ${i + 1}`}
                          aria-expanded={r.showImage}
                          className={`grid size-12 shrink-0 place-items-center overflow-hidden rounded-xl border transition-colors ${
                            r.showImage || r.image ? "border-accent text-accent" : "border-line text-muted hover:border-accent/50 hover:text-accent"
                          }`}
                        >
                          {r.image && imageOk ? (
                            <OptionImage src={r.image.trim()} alt="" className="size-full" />
                          ) : (
                            <ImagePlus size={18} />
                          )}
                        </button>
                        <input
                          name="option"
                          value={r.value}
                          onChange={(e) => onLabelChange(r, e.target.value)}
                          maxLength={120}
                          className="input"
                          placeholder={r.image ? "Nome (opcional)" : (PLACEHOLDERS[i] ?? `Opção ${i + 1}`)}
                          aria-label={`Opção ${i + 1}`}
                        />
                        {rows.length > 2 && i < rows.length - 1 && (
                          <button
                            type="button"
                            onClick={() => removeRow(r.id)}
                            className="grid size-10 shrink-0 place-items-center rounded-xl text-muted transition-colors hover:bg-bad-soft hover:text-bad"
                            aria-label={`Remover opção ${i + 1}`}
                          >
                            <X size={18} />
                          </button>
                        )}
                      </div>

                      {/* sempre no DOM, alinhado com "option", pra ir no envio */}
                      <input type="hidden" name="optionImage" value={r.image.trim()} />

                      <AnimatePresence initial={false}>
                        {r.showImage && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={spring}
                            className="overflow-hidden"
                          >
                            <div className="space-y-1 pt-1.5 pb-2 pl-14">
                              <input
                                type="url"
                                inputMode="url"
                                value={r.image}
                                onChange={(e) => patch(r.id, { image: e.target.value })}
                                className={`input py-2 text-sm ${imageOk ? "" : "border-bad"}`}
                                placeholder="https://…/foto.jpg"
                                aria-label={`Link da imagem da opção ${i + 1}`}
                              />
                              <p className={`text-xs ${imageOk ? "text-muted" : "text-bad"}`}>
                                {imageOk
                                  ? "Cole o link direto da imagem (no navegador: botão direito na imagem → Copiar endereço da imagem). Só o link é salvo."
                                  : "O link precisa começar com https://"}
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

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
            </motion.div>
          ) : (
            <motion.div
              key="approval"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-2 gap-2 text-center text-sm"
            >
              <span className="rounded-xl bg-good-soft px-3 py-4 font-bold text-good">👍 Sim</span>
              <span className="rounded-xl bg-bad-soft px-3 py-4 font-bold text-bad">👎 Não</span>
              <p className="col-span-2 text-muted">Aprovado se tiver mais Sim do que Não.</p>
            </motion.div>
          )}
        </AnimatePresence>

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

      <div className="card animate-rise space-y-4" style={{ "--i": 1 } as CSSProperties}>
        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          className="flex w-full items-center justify-between text-left text-sm font-semibold"
          aria-expanded={showAdvanced}
        >
          Regras da votação
          <motion.span animate={{ rotate: showAdvanced ? 180 : 0 }} transition={spring} className="text-muted">
            <ChevronDown size={18} />
          </motion.span>
        </button>

        <AnimatePresence initial={false}>
          {!showAdvanced && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="-mt-2 overflow-hidden text-sm text-muted"
            >
              {identity === "named" ? "Com nome" : "Anônima"} ·{" "}
              {visibility === "live" ? "resultado ao vivo" : "resultado só no fim"} ·{" "}
              {closesIn === "none" ? "sem prazo" : "com prazo"}
            </motion.p>
          )}
        </AnimatePresence>

        {/* inputs ficam sempre no DOM pra irem no envio, mesmo com o painel fechado */}
        <motion.div
          initial={false}
          animate={{ height: showAdvanced ? "auto" : 0, opacity: showAdvanced ? 1 : 0 }}
          transition={spring}
          className="overflow-hidden"
          inert={!showAdvanced}
        >
          <div className="space-y-4 pt-1">
            <fieldset>
              <legend className="label">Quem votou aparece?</legend>
              <div className="grid grid-cols-2 gap-2">
                <Choice group="identity" name="identityMode" value="anonymous" checked={identity === "anonymous"} onChange={() => setIdentity("anonymous")} title="Anônima" hint="Ninguém sabe quem votou" />
                <Choice group="identity" name="identityMode" value="named" checked={identity === "named"} onChange={() => setIdentity("named")} title="Com nome" hint="Cada um digita o nome" />
              </div>
            </fieldset>

            <fieldset>
              <legend className="label">Resultado</legend>
              <div className="grid grid-cols-2 gap-2">
                <Choice group="visibility" name="resultsVisibility" value="live" checked={visibility === "live"} onChange={() => setVisibility("live")} title="Ao vivo" hint="Todo mundo acompanha" />
                <Choice group="visibility" name="resultsVisibility" value="after_close" checked={visibility === "after_close"} onChange={() => setVisibility("after_close")} title="Só no fim" hint="Evita efeito manada" />
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
        </motion.div>
      </div>

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

      <button type="submit" className="btn-primary w-full py-4 text-base" disabled={pending}>
        {pending ? (
          <>
            <Loader2 size={18} className="animate-spin" /> Criando…
          </>
        ) : (
          "Criar e pegar o link"
        )}
      </button>
    </form>
  );
}
