"use client";

import { useSyncExternalStore } from "react";

const noop = () => () => {};

/** Data no fuso de quem está vendo (o servidor não sabe o fuso do usuário). */
export function LocalTime({ iso, className }: { iso: string; className?: string }) {
  const isClient = useSyncExternalStore(noop, () => true, () => false);
  const date = new Date(iso);
  return (
    <time dateTime={iso} className={className}>
      {isClient
        ? date.toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
        : "…"}
    </time>
  );
}
