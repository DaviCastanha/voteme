"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Modal } from "@/components/Modal";
import { deletePoll } from "@/lib/polls/actions";
import { forgetLocalPoll } from "@/lib/local-polls";

/**
 * Exclui a votação (com confirmação). `variant="icon"` é a lixeira da lista da home;
 * `variant="full"` é o botão do painel.
 */
export function DeletePollButton({
  slug,
  adminKey,
  title,
  variant,
  onDeleted,
}: {
  slug: string;
  adminKey: string;
  title: string;
  variant: "icon" | "full";
  onDeleted?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const confirm = () =>
    start(async () => {
      setError(null);
      const res = await deletePoll(slug, adminKey);
      if (res?.error) return setError(res.error);
      forgetLocalPoll(slug);
      setOpen(false);
      onDeleted?.();
    });

  return (
    <>
      {variant === "icon" ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={`Excluir “${title}”`}
          title="Excluir votação"
          className="grid size-10 shrink-0 place-items-center rounded-xl text-muted hover:bg-bg hover:text-bad"
        >
          <Trash2 size={18} />
        </button>
      ) : (
        <button type="button" onClick={() => setOpen(true)} className="btn w-full text-bad hover:bg-bad/10">
          <Trash2 size={16} /> Excluir votação
        </button>
      )}

      <Modal
        open={open}
        onClose={() => !pending && setOpen(false)}
        title="Excluir votação?"
        size="sm"
        footer={
          <>
            <button type="button" className="btn-ghost py-2.5" onClick={() => setOpen(false)} disabled={pending}>
              Cancelar
            </button>
            <button
              type="button"
              className="btn bg-bad py-2.5 text-white hover:brightness-110"
              onClick={confirm}
              disabled={pending}
            >
              {pending ? "Excluindo…" : "Excluir"}
            </button>
          </>
        }
      >
        <div className="space-y-3 text-sm">
          <p className="font-semibold text-base">“{title}”</p>
          <p className="text-muted">
            Todos os votos serão apagados e o link vai parar de funcionar pra todo mundo.{" "}
            <strong className="text-ink">Não dá pra desfazer.</strong>
          </p>
          {error && <p className="font-medium text-bad">{error}</p>}
        </div>
      </Modal>
    </>
  );
}
