-- Dawaana — mise en relation avec un voyageur
--
-- Le carnet de voyages affichait un voyageur, sa date et sa wilaya
-- d'arrivée… et aucun moyen de lui écrire. C'était le chaînon manquant :
-- on savait qui serait sur place sans pouvoir s'organiser avec lui.
--
-- Même mécanique que pour une annonce : le voyageur doit accepter la
-- demande avant que la conversation s'ouvre. Toujours aucune coordonnée
-- échangée automatiquement — les deux parties ne se voient que par leur
-- prénom.

-- ============================================================
-- Une conversation porte sur une annonce OU sur un trajet
-- ============================================================

alter table public.conversations
  add column if not exists trip_id uuid references public.trips(id) on delete cascade;
alter table public.conversations alter column listing_id drop not null;

alter table public.conversations drop constraint if exists conversations_cible_check;
alter table public.conversations add constraint conversations_cible_check
  check ((listing_id is not null) <> (trip_id is not null));

-- L'unicité (listing_id, requester_id) de la migration 0010 ne couvre pas
-- les trajets : listing_id y est nul, et Postgres considère deux NULL comme
-- distincts. D'où cet index partiel jumeau.
create unique index if not exists conversations_trip_requester_key
  on public.conversations (trip_id, requester_id) where trip_id is not null;
create index if not exists conversations_trip_id_idx on public.conversations (trip_id);

-- La cloche doit savoir où renvoyer : /annonces/... ou /voyages/...
alter table public.notifications
  add column if not exists trip_id uuid references public.trips(id) on delete cascade;
create index if not exists notifications_trip_id_idx on public.notifications (trip_id);

-- ============================================================
-- Les fonctions
-- ============================================================
-- express_interest_trip est le jumeau d'express_interest. respond_to_interest
-- et send_message sont réécrites pour traiter les deux cibles : elles
-- retrouvent elles-mêmes le libellé (nom du produit, ou pays de départ et
-- wilaya d'arrivée) et le figent dans la notification.

create or replace function public.express_interest_trip(target_trip_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner uuid; v_status text; v_to text; v_from text; v_helper_name text;
begin
  select t.user_id, t.status, t.to_wilaya, t.from_country
    into v_owner, v_status, v_to, v_from
    from public.trips t where t.id = target_trip_id;

  if v_owner is null or v_status is distinct from 'active' then
    raise exception 'Trajet introuvable ou inactif';
  end if;

  if v_owner = auth.uid() then
    return;
  end if;

  insert into public.conversations (trip_id, owner_id, requester_id)
  values (target_trip_id, v_owner, auth.uid())
  on conflict (trip_id, requester_id) where trip_id is not null do nothing;

  -- Notification au tout premier clic seulement : un second clic ne
  -- duplique rien et ne re-sonne pas chez le voyageur.
  if found then
    select p.first_name into v_helper_name from public.profiles p where p.id = auth.uid();
    insert into public.notifications (user_id, type, trip_id, data)
    values (v_owner, 'interest', target_trip_id,
      jsonb_build_object('trip_to', v_to, 'trip_from', v_from,
                         'helper_first_name', coalesce(v_helper_name, 'Un membre')));
  end if;
end;
$$;

revoke execute on function public.express_interest_trip(uuid) from anon, public;
grant execute on function public.express_interest_trip(uuid) to authenticated;

create or replace function public.respond_to_interest(target_conversation_id uuid, accept boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner uuid; v_requester uuid; v_status text;
  v_listing_id uuid; v_trip_id uuid;
  v_data jsonb;
begin
  select c.owner_id, c.requester_id, c.status, c.listing_id, c.trip_id
    into v_owner, v_requester, v_status, v_listing_id, v_trip_id
    from public.conversations c where c.id = target_conversation_id;

  if v_owner is null then raise exception 'Conversation introuvable'; end if;
  if v_owner <> auth.uid() then raise exception 'Action réservée à l''auteur de la publication'; end if;
  if v_status <> 'pending' then raise exception 'Cette proposition a déjà reçu une réponse'; end if;

  update public.conversations
     set status = case when accept then 'accepted' else 'declined' end,
         responded_at = now()
   where id = target_conversation_id;

  -- Le libellé est figé ici : si l'annonce change de nom ou le trajet de
  -- wilaya plus tard, la notification déjà reçue reste fidèle à l'événement.
  if v_listing_id is not null then
    select jsonb_build_object('medication_name', l.medication_name)
      into v_data from public.listings l where l.id = v_listing_id;
  else
    select jsonb_build_object('trip_to', t.to_wilaya, 'trip_from', t.from_country)
      into v_data from public.trips t where t.id = v_trip_id;
  end if;

  insert into public.notifications (user_id, type, listing_id, trip_id, data)
  values (v_requester,
          case when accept then 'interest_accepted' else 'interest_declined' end,
          v_listing_id, v_trip_id, coalesce(v_data, '{}'::jsonb));
end;
$$;

revoke execute on function public.respond_to_interest(uuid, boolean) from anon, public;
grant execute on function public.respond_to_interest(uuid, boolean) to authenticated;

create or replace function public.send_message(target_conversation_id uuid, body text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner uuid; v_requester uuid; v_status text;
  v_listing_id uuid; v_trip_id uuid;
  v_recipient uuid; v_sender_name text; v_data jsonb;
  v_clean_body text := btrim(coalesce(body, ''));
begin
  if char_length(v_clean_body) = 0 or char_length(v_clean_body) > 2000 then
    raise exception 'Message vide ou trop long';
  end if;

  select c.owner_id, c.requester_id, c.status, c.listing_id, c.trip_id
    into v_owner, v_requester, v_status, v_listing_id, v_trip_id
    from public.conversations c where c.id = target_conversation_id;

  if v_owner is null then raise exception 'Conversation introuvable'; end if;
  if auth.uid() not in (v_owner, v_requester) then
    raise exception 'Vous ne faites pas partie de cette conversation';
  end if;
  if v_status <> 'accepted' then raise exception 'Cette conversation n''est pas encore ouverte'; end if;

  insert into public.messages (conversation_id, sender_id, body)
  values (target_conversation_id, auth.uid(), v_clean_body);

  v_recipient := case when auth.uid() = v_owner then v_requester else v_owner end;
  select p.first_name into v_sender_name from public.profiles p where p.id = auth.uid();

  if v_listing_id is not null then
    select jsonb_build_object('medication_name', l.medication_name)
      into v_data from public.listings l where l.id = v_listing_id;
  else
    select jsonb_build_object('trip_to', t.to_wilaya, 'trip_from', t.from_country)
      into v_data from public.trips t where t.id = v_trip_id;
  end if;

  insert into public.notifications (user_id, type, listing_id, trip_id, data)
  values (v_recipient, 'message', v_listing_id, v_trip_id,
          coalesce(v_data, '{}'::jsonb) || jsonb_build_object('helper_first_name', coalesce(v_sender_name, 'Un membre')));
end;
$$;

revoke execute on function public.send_message(uuid, text) from anon, public;
grant execute on function public.send_message(uuid, text) to authenticated;
