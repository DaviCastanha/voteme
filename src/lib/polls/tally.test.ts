import { describe, expect, it } from "vitest";
import { tally } from "./tally";
import type { Poll, PollKind } from "./types";

function poll(kind: PollKind, labels: string[], abstention = false): Poll {
  const options = labels.map((label, i) => ({ id: `o${i}`, label, position: i, isAbstention: false }));
  if (abstention) options.push({ id: "abs", label: "Abstenção", position: labels.length, isAbstention: true });
  return {
    id: "p",
    slug: "test1234",
    title: "t",
    description: null,
    kind,
    maxChoices: null,
    tallyMethod: "plurality",
    identityMode: "anonymous",
    resultsVisibility: "live",
    allowVoteChange: false,
    closesAt: null,
    closedAt: null,
    parentSlug: null,
    createdAt: "2026-11-17T00:00:00Z",
    options,
  };
}

const counts = (o: Record<string, number>) => new Map(Object.entries(o));

describe("tally (plurality)", () => {
  it("sem votos", () => {
    const r = tally(poll("single", ["A", "B"]), counts({}), 0);
    expect(r.outcome).toEqual({ type: "no_votes" });
  });

  it("vencedor único e porcentagens", () => {
    const r = tally(poll("single", ["A", "B", "C"]), counts({ o0: 1, o1: 3 }), 4);
    expect(r.outcome).toEqual({ type: "winner", optionIds: ["o1"] });
    expect(r.rows[0]).toMatchObject({ optionId: "o1", votes: 3, share: 0.75 });
    expect(r.validVotes).toBe(4);
  });

  it("empate", () => {
    const r = tally(poll("single", ["A", "B", "C"]), counts({ o0: 2, o1: 2, o2: 1 }), 5);
    expect(r.outcome).toEqual({ type: "tie", optionIds: ["o0", "o1"] });
  });

  it("abstenção conta participação mas não concorre nem entra na porcentagem", () => {
    const r = tally(poll("single", ["A", "B"], true), counts({ o0: 1, abs: 5 }), 6);
    expect(r.outcome).toEqual({ type: "winner", optionIds: ["o0"] });
    expect(r.validVotes).toBe(1);
    expect(r.rows.at(-1)).toMatchObject({ isAbstention: true, votes: 5, share: 0 });
  });

  it("só abstenções = ninguém votou de fato", () => {
    const r = tally(poll("single", ["A", "B"], true), counts({ abs: 3 }), 3);
    expect(r.outcome).toEqual({ type: "no_votes" });
  });

  it("aprovação: Sim > Não aprova", () => {
    const r = tally(poll("approval", ["Sim", "Não"], true), counts({ o0: 3, o1: 2, abs: 4 }), 9);
    expect(r.outcome).toEqual({ type: "winner", optionIds: ["o0"] });
  });
});
