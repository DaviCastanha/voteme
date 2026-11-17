"use client";

import { useState, useSyncExternalStore } from "react";
import { QRCodeSVG } from "qrcode.react";
import { AnimatePresence, motion } from "motion/react";
import { Check, Copy, MessageCircle, QrCode, Share2 } from "lucide-react";

const noop = () => () => {};
const getOrigin = () => window.location.origin;
const getServerOrigin = () => "";
const getCanShare = () => typeof navigator.share === "function";
const getServerCanShare = () => false;

function CopyButton({ text, label = "Copiar" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className={`btn-ghost w-28 shrink-0 overflow-hidden px-3 py-2 ${copied ? "border-good text-good" : ""}`}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          /* clipboard bloqueado: o usuário ainda pode selecionar o texto */
        }
      }}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={copied ? "ok" : "copy"}
          initial={{ y: 14, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -14, opacity: 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="flex items-center gap-1.5"
        >
          {copied ? <Check size={15} strokeWidth={3} /> : <Copy size={15} />}
          {copied ? "Copiado" : label}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}

export function SharePanel({ slug, title, adminKey }: { slug: string; title: string; adminKey: string }) {
  const origin = useSyncExternalStore(noop, getOrigin, getServerOrigin);
  const voteUrl = `${origin}/p/${slug}`;
  const adminUrl = `${voteUrl}/admin?k=${adminKey}`;
  const whatsapp = `https://wa.me/?text=${encodeURIComponent(`🗳️ ${title}\nVota aqui: ${voteUrl}`)}`;
  const canShare = useSyncExternalStore(noop, getCanShare, getServerCanShare);
  const [showQr, setShowQr] = useState(false);

  async function nativeShare() {
    try {
      await navigator.share({ title, text: `🗳️ ${title}`, url: voteUrl });
    } catch {
      /* cancelado */
    }
  }

  return (
    <section className="card space-y-5">
      <div>
        <h2 className="mb-2 text-sm font-semibold tracking-wide text-muted uppercase">Link pra votar</h2>
        <div className="flex items-center gap-2">
          <input readOnly value={voteUrl} className="input py-2 font-mono text-sm" onFocus={(e) => e.target.select()} />
          <CopyButton text={voteUrl} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="btn-primary">
          <MessageCircle size={17} /> WhatsApp
        </a>
        <button type="button" className="btn-ghost" onClick={() => setShowQr((v) => !v)} aria-expanded={showQr}>
          <QrCode size={17} /> {showQr ? "Esconder QR" : "QR Code"}
        </button>
        {canShare && (
          <button type="button" className="btn-ghost col-span-2 sm:col-span-1" onClick={nativeShare}>
            <Share2 size={17} /> Compartilhar…
          </button>
        )}
      </div>

      <AnimatePresence initial={false}>
        {showQr && origin && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 36 }}
            className="overflow-hidden"
          >
            <motion.div
              initial={{ scale: 0.9, rotate: -2 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 18 }}
              className="flex flex-col items-center gap-2 rounded-xl bg-white p-6"
            >
              <QRCodeSVG value={voteUrl} size={220} marginSize={1} />
              <p className="text-center text-sm text-neutral-600">Aponte a câmera do celular pra votar</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <details className="rounded-xl bg-warn-soft px-4 py-3 text-sm">
        <summary className="cursor-pointer font-semibold text-warn">Seu link de administrador (não compartilhe)</summary>
        <p className="mt-2 text-muted">
          É ele que dá controle desta votação. Ele fica salvo neste aparelho, mas guarde uma cópia se quiser
          gerenciar de outro lugar.
        </p>
        <div className="mt-2 flex items-center gap-2">
          <input readOnly value={adminUrl} className="input py-2 font-mono text-xs" onFocus={(e) => e.target.select()} />
          <CopyButton text={adminUrl} />
        </div>
      </details>
    </section>
  );
}
