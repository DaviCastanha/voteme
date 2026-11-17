-- VoteMe 1.2.0: opções com imagem.
-- Guardamos só o LINK da imagem (texto). Quem baixa e mostra a imagem é o aparelho de cada pessoa,
-- então o banco não armazena arquivo nenhum.

alter table public.poll_options
  add column if not exists image_url text
  check (image_url is null or (char_length(image_url) <= 2048 and image_url ~ '^https://'));

-- Troca a assinatura de create_poll (novo parâmetro p_option_images).
-- Apaga a antiga primeiro: duas versões com os mesmos nomes de parâmetro confundiriam a API.
drop function if exists public.create_poll(text, text, text, text, int, text, text, boolean, timestamptz, text, text[], text, uuid);

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
  p_parent_poll_id     uuid default null,
  p_option_images      text[] default null
) returns uuid
language plpgsql
set search_path = public
as $$
declare
  v_poll_id uuid;
  v_n       int := coalesce(array_length(p_options, 1), 0);
begin
  if v_n < 2 then
    raise exception 'need_two_options';
  end if;

  insert into polls (
    slug, title, description, kind, max_choices, identity_mode,
    results_visibility, allow_vote_change, closes_at, admin_token_hash, parent_poll_id
  ) values (
    p_slug, p_title, nullif(p_description, ''), p_kind, p_max_choices, p_identity_mode,
    p_results_visibility, p_allow_vote_change, p_closes_at, p_admin_token_hash, p_parent_poll_id
  ) returning id into v_poll_id;

  for i in 1..v_n loop
    insert into poll_options (poll_id, label, position, image_url)
    values (v_poll_id, p_options[i], i - 1, nullif(p_option_images[i], ''));
  end loop;

  if p_abstention_label is not null then
    insert into poll_options (poll_id, label, position, is_abstention)
    values (v_poll_id, p_abstention_label, v_n, true);
  end if;

  return v_poll_id;
end;
$$;

revoke execute on function public.create_poll(text, text, text, text, int, text, text, boolean, timestamptz, text, text[], text, uuid, text[])
  from public, anon, authenticated;
grant execute on function public.create_poll(text, text, text, text, int, text, text, boolean, timestamptz, text, text[], text, uuid, text[])
  to service_role;

-- avisa a API (PostgREST) que as funções mudaram
notify pgrst, 'reload schema';
