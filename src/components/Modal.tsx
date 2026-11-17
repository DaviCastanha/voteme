"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

/**
 * Janela modal sobre o <dialog> nativo: foco preso dentro, Esc fecha, clique fora fecha.
 */
export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md";
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      aria-labelledby="modal-title"
      className={`m-auto max-h-[85dvh] w-[calc(100%-2rem)] ${size === "sm" ? "max-w-sm" : "max-w-lg"}
        flex-col overflow-hidden rounded-2xl border border-line bg-card p-0 text-ink shadow-2xl
        backdrop:bg-black/50 backdrop:backdrop-blur-[2px] open:flex`}
    >
      <header className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
        <h2 id="modal-title" className="text-lg font-bold tracking-tight">
          {title}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="grid size-8 place-items-center rounded-lg text-muted hover:bg-bg hover:text-ink"
        >
          <X size={18} />
        </button>
      </header>
      <div className="overflow-y-auto px-5 py-5">{children}</div>
      {footer && <footer className="flex justify-end gap-2 border-t border-line px-5 py-3">{footer}</footer>}
    </dialog>
  );
}
