export type PollKind = "single" | "multiple" | "approval";
export type IdentityMode = "anonymous" | "named";
export type ResultsVisibility = "live" | "after_close";
export type TallyMethod = "plurality";

export interface PollOption {
  id: string;
  label: string;
  position: number;
  isAbstention: boolean;
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
