import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { db, dbError } from "@/lib/supabase/server";
import { safeEqualHex, sha256 } from "@/lib/crypto";
import { tally, type TallyResult } from "./tally";
import type { Participant, Poll } from "./types";

export const VOTER_COOKIE = "vm_vid";

interface PollRow {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  kind: Poll["kind"];
  max_choices: number | null;
  tally_method: Poll["tallyMethod"];
  identity_mode: Poll["identityMode"];
  results_visibility: Poll["resultsVisibility"];
  allow_vote_change: boolean;
  closes_at: string | null;
  closed_at: string | null;
  created_at: string;
  admin_token_hash: string;
  parent: { slug: string } | null;
  poll_options: { id: string; label: string; position: number; is_abstention: boolean }[];
}

const POLL_SELECT =
  "id, slug, title, description, kind, max_choices, tally_method, identity_mode, results_visibility," +
  " allow_vote_change, closes_at, closed_at, created_at, admin_token_hash," +
  " parent:parent_poll_id(slug), poll_options(id, label, position, is_abstention)";

/** Carrega a votação. Memoizado por request (metadata + página fazem uma consulta só). */
const loadPoll = cache(async (slug: string): Promise<{ poll: Poll; adminHash: string } | null> => {
  if (!/^[a-z0-9]{4,32}$/.test(slug)) return null;

  const { data, error } = await db().from("polls").select(POLL_SELECT).eq("slug", slug).maybeSingle<PollRow>();
  if (error) throw dbError(error);
  if (!data) return null;

  const poll: Poll = {
    id: data.id,
    slug: data.slug,
    title: data.title,
    description: data.description,
    kind: data.kind,
    maxChoices: data.max_choices,
    tallyMethod: data.tally_method,
    identityMode: data.identity_mode,
    resultsVisibility: data.results_visibility,
    allowVoteChange: data.allow_vote_change,
    closesAt: data.closes_at,
    closedAt: data.closed_at,
    parentSlug: data.parent?.slug ?? null,
    createdAt: data.created_at,
    options: data.poll_options
      .map((o) => ({ id: o.id, label: o.label, position: o.position, isAbstention: o.is_abstention }))
      .sort((a, b) => a.position - b.position),
  };
  return { poll, adminHash: data.admin_token_hash };
});

export async function getPoll(slug: string): Promise<Poll | null> {
  return (await loadPoll(slug))?.poll ?? null;
}

/** Retorna a votação somente se `key` for o token de admin correto. */
export async function getPollAsAdmin(slug: string, key: string | undefined): Promise<Poll | null> {
  if (!key) return null;
  const loaded = await loadPoll(slug);
  if (!loaded || !safeEqualHex(sha256(key), loaded.adminHash)) return null;
  return loaded.poll;
}

export async function getTally(poll: Poll): Promise<TallyResult> {
  const [tallies, ballots] = await Promise.all([
    db().from("poll_option_tallies").select("option_id, votes").eq("poll_id", poll.id),
    db().from("ballots").select("id", { count: "exact", head: true }).eq("poll_id", poll.id),
  ]);
  if (tallies.error) throw dbError(tallies.error);
  if (ballots.error) throw dbError(ballots.error);

  const counts = new Map<string, number>(tallies.data.map((r) => [r.option_id as string, Number(r.votes)]));
  return tally(poll, counts, ballots.count ?? 0);
}

export async function getParticipants(poll: Poll): Promise<Participant[]> {
  const { data, error } = await db()
    .from("ballots")
    .select("voter_name, created_at")
    .eq("poll_id", poll.id)
    .order("created_at", { ascending: true });
  if (error) throw dbError(error);
  return data.map((b) => ({ name: b.voter_name, votedAt: b.created_at }));
}

export function voterHash(pollId: string, voterId: string): string {
  return sha256(`${pollId}:${voterId}`);
}

/** O voto deste navegador nesta votação, se houver. */
export async function getMyBallot(poll: Poll): Promise<{ optionIds: string[]; name: string | null } | null> {
  const vid = (await cookies()).get(VOTER_COOKIE)?.value;
  if (!vid) return null;

  const { data, error } = await db()
    .from("ballots")
    .select("voter_name, ballot_choices(option_id)")
    .eq("poll_id", poll.id)
    .eq("voter_hash", voterHash(poll.id, vid))
    .maybeSingle<{ voter_name: string | null; ballot_choices: { option_id: string }[] }>();
  if (error) throw dbError(error);
  if (!data) return null;
  return { optionIds: data.ballot_choices.map((c) => c.option_id), name: data.voter_name };
}
