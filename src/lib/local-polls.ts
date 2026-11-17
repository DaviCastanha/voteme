"use client";

/**
 * Votações criadas neste aparelho. Como o criador não tem conta,
 * o link de admin fica guardado aqui. (Quando entrar login, isso migra pra conta.)
 */
export interface LocalPoll {
  slug: string;
  title: string;
  adminKey: string;
  createdAt: string;
}

const KEY = "voteme:my-polls";
const EVENT = "voteme:my-polls-changed";

let cachedRaw: string | null = null;
let cachedList: LocalPoll[] = [];

export function readLocalPolls(): LocalPoll[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw !== cachedRaw) {
      cachedRaw = raw;
      cachedList = raw ? (JSON.parse(raw) as LocalPoll[]) : [];
    }
  } catch {
    cachedList = [];
  }
  return cachedList;
}

export function rememberLocalPoll(poll: Omit<LocalPoll, "createdAt">) {
  try {
    const list = readLocalPolls().filter((p) => p.slug !== poll.slug);
    const prev = readLocalPolls().find((p) => p.slug === poll.slug);
    list.unshift({ ...poll, createdAt: prev?.createdAt ?? new Date().toISOString() });
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, 50)));
    window.dispatchEvent(new Event(EVENT));
  } catch {
    /* modo privado / storage bloqueado: segue sem lembrar */
  }
}

export function subscribeLocalPolls(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

const EMPTY: LocalPoll[] = [];
export const serverLocalPolls = () => EMPTY;
