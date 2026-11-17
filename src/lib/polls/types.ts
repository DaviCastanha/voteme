export type PollKind = "single" | "multiple" | "approval";
export type IdentityMode = "anonymous" | "named";
export type ResultsVisibility = "live" | "after_close";
export type TallyMethod = "plurality";

export interface PollOption {
  id: string;
  label: string;
  position: number;
  isAbstention: boolean;
  /** Link da imagem (só o texto fica no banco; cada aparelho baixa a imagem). */
  imageUrl: string | null;
}

/** Visão pública da votação — nunca inclui o hash do admin. */
export interface Poll {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  kind: PollKind;
  maxChoices: number | null;
  tallyMethod: TallyMethod;
  identityMode: IdentityMode;
  resultsVisibility: ResultsVisibility;
  allowVoteChange: boolean;
  closesAt: string | null;
  closedAt: string | null;
  parentSlug: string | null;
  createdAt: string;
  options: PollOption[];
}

export interface Participant {
  name: string | null;
  votedAt: string;
}

export const KIND_LABEL: Record<PollKind, string> = {
  single: "Escolha única",
  multiple: "Múltipla escolha",
  approval: "Aprovar ou rejeitar",
};

export const APPROVAL_OPTIONS = ["Sim", "Não"] as const;
export const ABSTENTION_LABEL = "Abstenção";

export function isOpen(poll: Pick<Poll, "closedAt" | "closesAt">, now = Date.now()): boolean {
  if (poll.closedAt) return false;
  if (poll.closesAt && new Date(poll.closesAt).getTime() <= now) return false;
  return true;
}

/** Link aceito como imagem de opção: https e no máximo 2048 caracteres. */
export function isImageUrl(value: string): boolean {
  if (value.length > 2048) return false;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

/** Parece um link direto de imagem? (usado pra mover um link colado no nome pro campo de imagem) */
export function looksLikeImageLink(value: string): boolean {
  return isImageUrl(value.trim()) && /\.(avif|webp|png|jpe?g|gif|svg)(\?|#|$)/i.test(value.trim());
}
