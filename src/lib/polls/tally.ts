import type { Poll, TallyMethod } from "./types";

export interface TallyRow {
  optionId: string;
  label: string;
  votes: number;
  /** % sobre os votos válidos (abstenção fora da base) */
  share: number;
  isAbstention: boolean;
}

export interface TallyResult {
  rows: TallyRow[];
  ballots: number;
  validVotes: number;
  outcome:
    | { type: "no_votes" }
    | { type: "winner"; optionIds: string[] }
    | { type: "tie"; optionIds: string[] };
}

type Counter = (poll: Poll, counts: Map<string, number>, ballots: number) => TallyResult;

/**
 * Maioria simples / mais votado. Abstenção conta como participação, mas não concorre.
 * Na aprovação (Sim × Não) isso equivale a "aprovado se Sim > Não".
 */
const plurality: Counter = (poll, counts, ballots) => {
  const contenders = poll.options.filter((o) => !o.isAbstention);
  const validVotes = contenders.reduce((s, o) => s + (counts.get(o.id) ?? 0), 0);

  const rows: TallyRow[] = poll.options
    .map((o) => {
      const votes = counts.get(o.id) ?? 0;
      return {
        optionId: o.id,
        label: o.label,
        votes,
        share: o.isAbstention || validVotes === 0 ? 0 : votes / validVotes,
        isAbstention: o.isAbstention,
      };
    })
    .sort((a, b) => Number(a.isAbstention) - Number(b.isAbstention) || b.votes - a.votes);

  if (validVotes === 0) return { rows, ballots, validVotes, outcome: { type: "no_votes" } };

  const top = Math.max(...contenders.map((o) => counts.get(o.id) ?? 0));
  const leaders = contenders.filter((o) => (counts.get(o.id) ?? 0) === top).map((o) => o.id);

  return {
    rows,
    ballots,
    validVotes,
    outcome: leaders.length === 1 ? { type: "winner", optionIds: leaders } : { type: "tie", optionIds: leaders },
  };
};

const METHODS: Record<TallyMethod, Counter> = { plurality };

export function tally(poll: Poll, counts: Map<string, number>, ballots: number): TallyResult {
  return METHODS[poll.tallyMethod](poll, counts, ballots);
}
