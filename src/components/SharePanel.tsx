"use client";

import { useState, useSyncExternalStore } from "react";
import { QRCodeSVG } from "qrcode.react";

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
      className="btn-ghost shrink-0 px-3 py-2"
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
      {copied ? "Copiado ✓" : label}
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
          WhatsApp
        </a>
        <button type="button" className="btn-ghost" onClick={() => setShowQr((v) => !v)}>
          {showQr ? "Esconder QR" : "QR Code"}
        </button>
        {canShare && (
          <button type="button" className="btn-ghost col-span-2 sm:col-span-1" onClick={nativeShare}>
            Compartilhar…
          </button>
        )}
      </div>

      {showQr && origin && (
        <div className="flex flex-col items-center gap-2 rounded-xl bg-white p-6">
          <QRCodeSVG value={voteUrl} size={220} marginSize={1} />
          <p className="text-center text-sm text-neutral-600">Aponte a câmera do celular pra votar</p>
        </div>
      )}

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
