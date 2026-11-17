-- VoteMe: schema inicial (MVP)
--
-- Modelo de segurança: o browser NUNCA fala direto com estas tabelas.
-- Todo acesso passa pelo servidor Next.js usando a secret key (service_role).
-- RLS fica ligado e sem policies => anon/authenticated não leem nem escrevem nada.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Tabelas
-- ---------------------------------------------------------------------------

create table public.polls (
  id                  uuid primary key default gen_random_uuid(),
  slug                text not null unique,
  title               text not null check (char_length(title) between 1 and 200),
  description         text check (char_length(description) <= 1000),

  -- formato da cédula
  kind                text not null check (kind in ('single', 'multiple', 'approval')),
  max_choices         int  check (max_choices is null or max_choices >= 1),

  -- método de apuração (plugável; por enquanto só 'plurality')
  tally_method        text not null default 'plurality' check (tally_method in ('plurality')),

  -- regras de participação
  identity_mode       text not null default 'anonymous' check (identity_mode in ('anonymous', 'named')),
  results_visibility  text not null default 'live' check (results_visibility in ('live', 'after_close')),
  allow_vote_change   boolean not null default false,

  closes_at           timestamptz,
  closed_at           timestamptz,

  -- o criador não tem conta: ele gerencia via "link de admin" secreto.
  -- guardamos só o hash do token.
  admin_token_hash    text not null,

  -- rodada de desempate aponta pra votação original
  parent_poll_id      uuid references public.polls (id) on delete set null,

  created_at          timestamptz not null default now()
);

create table public.poll_options (
  id             uuid primary key default gen_random_uuid(),
  poll_id        uuid not null references public.polls (id) on delete cascade,
  label          text not null check (char_length(label) between 1 and 120),
  position       int  not null,
  -- "Abstenção" conta como participação mas não concorre ao resultado
  is_abstention  boolean not null default false,
  unique (poll_id, position)
);

create table public.ballots (
  id          uuid primary key default gen_random_uuid(),
  poll_id     uuid not null references public.polls (id) on delete cascade,
  -- sha256(poll_id || ':' || cookie do votante). Impede voto duplicado sem login.
  voter_hash  text not null,
  voter_name  text check (char_length(voter_name) <= 80),
  -- já preparado pra voto ponderado (condomínio / fração ideal)
  weight      numeric not null default 1 check (weight > 0),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (poll_id, voter_hash)
);

create table public.ballot_choices (
  ballot_id  uuid not null references public.ballots (id) on delete cascade,
  option_id  uuid not null references public.poll_options (id) on delete cascade,
  primary key (ballot_id, option_id)
);

create index poll_options_poll_id_idx  on public.poll_options (poll_id);
create index ballots_poll_id_idx       on public.ballots (poll_id);
create index ballot_choices_option_idx on public.ballot_choices (option_id);
create index polls_parent_idx          on public.polls (parent_poll_id);

alter table public.polls          enable row level security;
alter table public.poll_options   enable row level security;
alter table public.ballots        enable row level security;
alter table public.ballot_choices enable row level security;

revoke all on public.polls, public.poll_options, public.ballots, public.ballot_choices
  from anon, authenticated;
-- explícito: projetos novos podem vir sem "expor tabelas automaticamente"
grant select, insert, update, delete on public.polls, public.poll_options, public.ballots, public.ballot_choices
  to service_role;

-- ---------------------------------------------------------------------------
-- Apuração
-- ---------------------------------------------------------------------------

create view public.poll_option_tallies
with (security_invoker = true) as
select
  o.poll_id,
  o.id                          as option_id,
  coalesce(sum(b.weight), 0)    as votes
from public.poll_options o
left join public.ballot_choices c on c.option_id = o.id
left join public.ballots b        on b.id = c.ballot_id
group by o.poll_id, o.id;

revoke all on public.poll_option_tallies from anon, authenticated;
grant select on public.poll_option_tallies to service_role;

-- ---------------------------------------------------------------------------
-- Funções (transacionais) — só o service_role executa
-- ---------------------------------------------------------------------------

-- Cria a votação e suas opções numa transação só.
create or replace function public.create_poll(
  p_slug               text,
  p_title              text,
  p_description        text,
  p_kind               text,
  p_max_choices        int,
  p_identity_mode      text,
  p_results_visibility text,
  p_allow_vote_change  boolean,
  p_closes_at          timestamptz,
  p_admin_token_hash   text,
  p_options            text[],
  p_abstention_label   text default null,
  p_parent_poll_id     uuid default null
) returns uuid
language plpgsql
set search_path = public
as $$
declare
  v_poll_id uuid;
  v_label   text;
  v_pos     int := 0;
begin
  if coalesce(array_length(p_options, 1), 0) < 2 then
    raise exception 'need_two_options';
  end if;

  insert into polls (
    slug, title, description, kind, max_choices, identity_mode,
    results_visibility, allow_vote_change, closes_at, admin_token_hash, parent_poll_id
  ) values (
    p_slug, p_title, nullif(p_description, ''), p_kind, p_max_choices, p_identity_mode,
    p_results_visibility, p_allow_vote_change, p_closes_at, p_admin_token_hash, p_parent_poll_id
  ) returning id into v_poll_id;

  foreach v_label in array p_options loop
    insert into poll_options (poll_id, label, position) values (v_poll_id, v_label, v_pos);
    v_pos := v_pos + 1;
  end loop;

  if p_abstention_label is not null then
    insert into poll_options (poll_id, label, position, is_abstention)
    values (v_poll_id, p_abstention_label, v_pos, true);
  end if;

  return v_poll_id;
end;
$$;

-- Registra (ou altera, se permitido) o voto. Valida tudo do lado do banco.
create or replace function public.cast_vote(
  p_poll_id     uuid,
  p_voter_hash  text,
  p_voter_name  text,
  p_option_ids  uuid[]
) returns uuid
language plpgsql
set search_path = public
as $$
declare
  v_poll      polls%rowtype;
  v_ballot_id uuid;
  v_n         int := coalesce(array_length(p_option_ids, 1), 0);
  v_valid     int;
  v_has_abst  boolean;
begin
  select * into v_poll from polls where id = p_poll_id for update;
  if not found then
    raise exception 'poll_not_found';
  end if;

  if v_poll.closed_at is not null or (v_poll.closes_at is not null and v_poll.closes_at <= now()) then
    raise exception 'poll_closed';
  end if;

  if v_n = 0 then
    raise exception 'no_choice';
  end if;

  select count(*), bool_or(is_abstention)
    into v_valid, v_has_abst
    from poll_options
   where poll_id = p_poll_id and id = any (p_option_ids);

  if v_valid <> v_n then
    raise exception 'invalid_option';
  end if;

  if v_poll.kind in ('single', 'approval') and v_n <> 1 then
    raise exception 'too_many_choices';
  end if;

  if v_poll.kind = 'multiple' then
    if v_poll.max_choices is not null and v_n > v_poll.max_choices then
      raise exception 'too_many_choices';
    end if;
    if v_has_abst and v_n > 1 then
      raise exception 'abstention_is_exclusive';
    end if;
  end if;

  if v_poll.identity_mode = 'named' and coalesce(btrim(p_voter_name), '') = '' then
    raise exception 'name_required';
  end if;

  select id into v_ballot_id from ballots where poll_id = p_poll_id and voter_hash = p_voter_hash;

  if v_ballot_id is not null then
    if not v_poll.allow_vote_change then
      raise exception 'already_voted';
    end if;
    update ballots set voter_name = nullif(btrim(p_voter_name), ''), updated_at = now()
     where id = v_ballot_id;
    delete from ballot_choices where ballot_id = v_ballot_id;
  else
    insert into ballots (poll_id, voter_hash, voter_name)
    values (p_poll_id, p_voter_hash, nullif(btrim(p_voter_name), ''))
    returning id into v_ballot_id;
  end if;

  insert into ballot_choices (ballot_id, option_id)
  select v_ballot_id, unnest(p_option_ids);

  return v_ballot_id;
end;
$$;

revoke execute on function public.create_poll(text, text, text, text, int, text, text, boolean, timestamptz, text, text[], text, uuid)
  from public, anon, authenticated;
revoke execute on function public.cast_vote(uuid, text, text, uuid[])
  from public, anon, authenticated;
grant execute on function public.create_poll(text, text, text, text, int, text, text, boolean, timestamptz, text, text[], text, uuid)
  to service_role;
grant execute on function public.cast_vote(uuid, text, text, uuid[])
  to service_role;
