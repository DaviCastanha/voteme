"use server";

import { cookies } from "next/headers";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db, dbError } from "@/lib/supabase/server";
import { newSlug, newToken, sha256 } from "@/lib/crypto";
import { notifyPollChanged } from "@/lib/realtime";
import { getPoll, getPollAsAdmin, getTally, VOTER_COOKIE, voterHash } from "./queries";
import { ABSTENTION_LABEL, APPROVAL_OPTIONS, isOpen } from "./types";

export type ActionState = { error?: string; ok?: boolean } | undefined;

const MAX_OPTIONS = 20;
const HOUR = 3_600_000;
const DURATIONS: Record<string, number> = { "1h": HOUR, "1d": 24 * HOUR, "3d": 72 * HOUR, "7d": 168 * HOUR };

const createSchema = z
  .object({
    title: z.string().trim().min(1, "Escreva a pergunta.").max(200, "Pergunta muito longa."),
    description: z.string().trim().max(1000).optional().default(""),
    kind: z.enum(["single", "multiple", "approval"]),
    options: z.array(z.string().trim().max(120, "Opção muito longa.")),
    maxChoices: z.coerce.number().int().min(1).max(MAX_OPTIONS).optional(),
    identityMode: z.enum(["anonymous", "named"]),
    resultsVisibility: z.enum(["live", "after_close"]),
    allowVoteChange: z.boolean(),
    abstention: z.boolean(),
    closesIn: z.enum(["none", "1h", "1d", "3d", "7d", "custom"]),
    closesAtCustom: z.string().optional(),
  })
  .transform((v) => {
    const options =
      v.kind === "approval"
        ? [...APPROVAL_OPTIONS]
        : [...new Map(v.options.filter(Boolean).map((o) => [o.toLocaleLowerCase("pt-BR"), o])).values()];
    return { ...v, options };
  })
  .refine((v) => v.options.length >= 2, { message: "Coloque pelo menos duas opções diferentes." })
  .refine((v) => v.options.length <= MAX_OPTIONS, { message: `No máximo ${MAX_OPTIONS} opções.` });

function resolveClosesAt(closesIn: string, custom: string | undefined): string | null | "invalid" {
  if (closesIn === "none") return null;
  if (closesIn !== "custom") return new Date(Date.now() + DURATIONS[closesIn]).toISOString();
  const t = custom ? Date.parse(custom) : NaN;
  if (Number.isNaN(t) || t <= Date.now() + 60_000) return "invalid";
  return new Date(t).toISOString();
}

async function insertPoll(args: {
  title: string;
  description: string;
  kind: string;
  maxChoices: number | null;
  identityMode: string;
  resultsVisibility: string;
  allowVoteChange: boolean;
  closesAt: string | null;
  options: string[];
  abstention: boolean;
  parentPollId?: string;
}): Promise<{ slug: string; adminKey: string }> {
  const adminKey = newToken();
  // colisão de slug é improvável (31^8), mas tentamos de novo se acontecer
  for (let attempt = 0; attempt < 3; attempt++) {
    const slug = newSlug();
    const { error } = await db().rpc("create_poll", {
      p_slug: slug,
      p_title: args.title,
      p_description: args.description,
      p_kind: args.kind,
      p_max_choices: args.maxChoices,
      p_identity_mode: args.identityMode,
      p_results_visibility: args.resultsVisibility,
      p_allow_vote_change: args.allowVoteChange,
      p_closes_at: args.closesAt,
      p_admin_token_hash: sha256(adminKey),
      p_options: args.options,
      p_abstention_label: args.abstention ? ABSTENTION_LABEL : null,
      p_parent_poll_id: args.parentPollId ?? null,
    });
    if (!error) return { slug, adminKey };
    if (error.code !== "23505") throw dbError(error);
  }
  throw new Error("Não foi possível gerar um link único.");
}

export async function createPoll(_prev: ActionState, form: FormData): Promise<ActionState> {
  const parsed = createSchema.safeParse({
    title: form.get("title"),
    description: form.get("description") ?? "",
    kind: form.get("kind"),
    options: form.getAll("option"),
    maxChoices: form.get("maxChoices") || undefined,
    identityMode: form.get("identityMode"),
    resultsVisibility: form.get("resultsVisibility"),
    allowVoteChange: form.get("allowVoteChange") === "on",
    abstention: form.get("abstention") === "on",
    closesIn: form.get("closesIn"),
    closesAtCustom: form.get("closesAtCustom") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const v = parsed.data;
  const closesAt = resolveClosesAt(v.closesIn, v.closesAtCustom);
  if (closesAt === "invalid") return { error: "Escolha um prazo no futuro." };

  const { slug, adminKey } = await insertPoll({
    title: v.title,
    description: v.description,
    kind: v.kind,
    maxChoices: v.kind === "multiple" && v.maxChoices && v.maxChoices < v.options.length ? v.maxChoices : null,
    identityMode: v.identityMode,
    resultsVisibility: v.resultsVisibility,
    allowVoteChange: v.allowVoteChange,
    closesAt,
    options: v.options,
    abstention: v.abstention,
  });

  redirect(`/p/${slug}/admin?k=${adminKey}`);
}

const VOTE_ERRORS: Record<string, string> = {
  poll_not_found: "Essa votação não existe mais.",
  poll_closed: "A votação já foi encerrada.",
  no_choice: "Escolha uma opção.",
  invalid_option: "Opção inválida. Recarregue a página.",
  too_many_choices: "Você marcou opções demais.",
  abstention_is_exclusive: "Abstenção não pode ser combinada com outras opções.",
  name_required: "Essa votação pede seu nome.",
  already_voted: "Você já votou nessa votação.",
};

export async function castVote(slug: string, _prev: ActionState, form: FormData): Promise<ActionState> {
  const poll = await getPoll(slug);
  if (!poll) return { error: VOTE_ERRORS.poll_not_found };
  if (!isOpen(poll)) return { error: VOTE_ERRORS.poll_closed };

  const optionIds = z.array(z.uuid()).safeParse(form.getAll("option"));
  if (!optionIds.success || optionIds.data.length === 0) return { error: VOTE_ERRORS.no_choice };
  const name = String(form.get("name") ?? "").trim().slice(0, 80);

  const jar = await cookies();
  let vid = jar.get(VOTER_COOKIE)?.value;
  if (!vid) {
    vid = newToken();
    jar.set(VOTER_COOKIE, vid, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    });
  }

  const { error } = await db().rpc("cast_vote", {
    p_poll_id: poll.id,
    p_voter_hash: voterHash(poll.id, vid),
    p_voter_name: name,
    p_option_ids: [...new Set(optionIds.data)],
  });
  if (error) {
    const known = Object.keys(VOTE_ERRORS).find((k) => error.message.includes(k));
    if (!known) throw dbError(error);
    return { error: VOTE_ERRORS[known] };
  }

  await notifyPollChanged(poll.id);
  refresh();
  return { ok: true };
}

export async function closePoll(slug: string, key: string): Promise<ActionState> {
  const poll = await getPollAsAdmin(slug, key);
  if (!poll) return { error: "Link de administrador inválido." };

  const { error } = await db()
    .from("polls")
    .update({ closed_at: new Date().toISOString() })
    .eq("id", poll.id)
    .is("closed_at", null);
  if (error) throw dbError(error);

  await notifyPollChanged(poll.id);
  refresh();
  return { ok: true };
}

/** Nova rodada só com as opções empatadas. Leva o admin direto pro painel da nova votação. */
export async function createRunoff(slug: string, key: string): Promise<ActionState> {
  const poll = await getPollAsAdmin(slug, key);
  if (!poll) return { error: "Link de administrador inválido." };
  if (isOpen(poll)) return { error: "Encerre a votação antes de desempatar." };

  const result = await getTally(poll);
  if (result.outcome.type !== "tie") return { error: "Não há empate pra desfazer." };
  const tied = new Set(result.outcome.optionIds);

  const next = await insertPoll({
    title: poll.title,
    description: `Desempate entre ${tied.size} opções.`,
    kind: "single",
    maxChoices: null,
    identityMode: poll.identityMode,
    resultsVisibility: poll.resultsVisibility,
    allowVoteChange: poll.allowVoteChange,
    closesAt: null,
    options: poll.options.filter((o) => tied.has(o.id)).map((o) => o.label),
    abstention: false,
    parentPollId: poll.id,
  });

  redirect(`/p/${next.slug}/admin?k=${next.adminKey}`);
}
