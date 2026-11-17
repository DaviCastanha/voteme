"use client";

import { useState } from "react";
import { ImageOff } from "lucide-react";

/**
 * Imagem de uma opção, carregada direto do link pelo aparelho de quem está vendo
 * (o VoteMe não guarda a imagem, só o endereço). Aparece suavemente ao carregar;
 * se o link quebrar, mostra um aviso no lugar.
 */
export function OptionImage({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");

  return (
    <div className={`relative overflow-hidden bg-bg ${className}`}>
      {state === "loading" && <div className="skeleton absolute inset-0" aria-hidden />}
      {state === "error" ? (
        <div className="absolute inset-0 grid place-items-center text-muted" title="Não foi possível carregar a imagem">
          <ImageOff size={22} aria-label="Imagem indisponível" />
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- link externo arbitrário; não passa pelo otimizador
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          draggable={false}
          onLoad={() => setState("ok")}
          onError={() => setState("error")}
          className={`size-full object-cover transition-[opacity,transform] duration-500 ease-out-expo ${
            state === "ok" ? "scale-100 opacity-100" : "scale-[1.03] opacity-0"
          }`}
        />
      )}
    </div>
  );
}
