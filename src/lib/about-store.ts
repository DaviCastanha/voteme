"use client";

import { useSyncExternalStore } from "react";
import { APP_VERSION, compareVersions, releasesSince, type Release } from "@/content/releases";

const SEEN_KEY = "voteme:lastSeenVersion";

interface AboutState {
  view: "about" | "news" | null;
  /** Versões destacadas como novas em "Novidades" (vazio = só navegando). */
  fresh: Release[];
}

let state: AboutState = { view: null, fresh: [] };
const listeners = new Set<() => void>();
const set = (next: AboutState) => {
  state = next;
  listeners.forEach((l) => l());
};
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const get = () => state;

export const about = {
  showAbout: () => set({ view: "about", fresh: [] }),
  showNews: (fresh: Release[] = []) => {
    markReleasesSeen();
    set({ view: "news", fresh });
  },
  close: () => set({ view: null, fresh: [] }),
};

export function useAbout(): AboutState {
  return useSyncExternalStore(subscribe, get, get);
}

function lastSeenVersion(): string | null {
  try {
    return localStorage.getItem(SEEN_KEY);
  } catch {
    return null;
  }
}

export function markReleasesSeen() {
  try {
    localStorage.setItem(SEEN_KEY, APP_VERSION);
  } catch {
    // modo privado: o popup pode aparecer de novo, sem problema
  }
}

/**
 * Versões pra anunciar neste aparelho. Quem nunca viu o popup mas já criou votações aqui
 * estava usando a 1.0.0; quem é novo não vê nada (pra essa pessoa tudo é novidade).
 */
export function unseenReleases(usedBefore: boolean): Release[] {
  let seen = lastSeenVersion();
  if (!seen) {
    if (!usedBefore) {
      markReleasesSeen();
      return [];
    }
    seen = "1.0.0";
  }
  if (compareVersions(APP_VERSION, seen) <= 0) return [];
  return releasesSince(seen);
}
