-- Dawaana — messagerie de mise en relation
--
-- Jusqu'ici, « Je suis intéressé(e) » ne faisait que notifier l'auteur d'une
-- annonce (migration 0009) — aucune conversation n'était possible. Cette
-- migration ajoute une vraie messagerie, directement sur la fiche annonce :
-- l'auteur doit d'abord accepter une proposition avant que la conversation
-- s'ouvre (filtre le spam), et seuls les deux participants peuvent la voir.
-- Toujours pas de coordonnées personnelles échangées automatiquement — les
-- deux parties ne se voient que par leur prénom, comme partout ailleurs sur
-- Dawaana.

-- ============================================================
-- Types de notification : on ajoute la réponse à une proposition et les
-- nouveaux messages.
-- ============================================================

alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check
  check (type in (
    'interest', 'identity_verified', 'medication_verified', 'listing_moderated',
    'interest_accepted', 'interest_declined', 'message'
  ));

-- ============================================================
-- Conversations
-- ============================================================
-- Une conversation par (annonce, personne intéressée). « pending » tant que
-- l'auteur n'a pas répondu, « accepted » une fois ouverte, « declined »
-- si refusée — dans ces deux derniers cas, plus de retour possible en
-- arrière depuis le client (aucune policy update n'est posée : tout passe
-- par des fonctions SECURITY DEFINER, voir plus bas).

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  requester_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  unique (listing_id, requester_id)
);

create index if not exists conversations_listing_id_idx on public.conversations (listing_id);
create index if not exists conversations_owner_id_idx on public.conversations (owner_id, status);
create index if not exists conversations_requester_id_idx on public.conversations (requester_id);

alter table public.conversations enable row level security;

drop policy if exists "Les participants voient leur conversation" on public.conversations;
create policy "Les participants voient leur conversation"
  on public.conversations for select
  using (auth.uid() = owner_id or auth.uid() = requester_id);

-- Aucune policy insert/update : tout passe par express_interest et
-- respond_to_interest, ci-dessous.
revoke insert, update, delete on public.conversations from anon, authenticated;

-- ============================================================
-- Messages
-- ============================================================

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(btrim(body)) > 0 and char_length(body) <= 2000),
  created_at timestamptz not null default now()
);

create index if not exists messages_conversation_id_idx on public.messages (conversation_id, created_at);

alter table public.messages enable row level security;

drop policy if exists "Les participants voient les messages de leur conversation" on public.messages;
create policy "Les participants voient les messages de leur conversation"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (c.owner_id = auth.uid() or c.requester_id = auth.uid())
    )
  );

-- Aucune policy insert : tout passe par send_message, ci-dessous (elle
-- vérifie que la conversation est bien acceptée avant d'écrire).
revoke insert, update, delete on public.messages from anon, authenticated;

-- ============================================================
-- 1. Exprimer son intérêt — ouvre (ou retrouve) une conversation « pending »
-- ============================================================
-- Remplace la fonction de la migration 0009 : en plus de la notification,
-- elle crée maintenant la conversation. Un deuxième clic ne duplique rien
-- (contrainte unique listing_id/requester_id) et ne renvoie pas d'erreur.

create or replace function public.express_interest(target_listing_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner uuid;
  v_status text;
  v_name text;
  v_type text;
  v_helper_name text;
begin
  select l.user_id, l.status, l.medication_name, l.type
    into v_owner, v_status, v_name, v_type
    from public.listings l
    where l.id = target_listing_id;

  if v_owner is null or v_status is distinct from 'active' then
    raise exception 'Annonce introuvable ou inactive';
  end if;

  if v_owner = auth.uid() then
    return;
  end if;

  insert into public.conversations (listing_id, owner_id, requester_id)
  values (target_listing_id, v_owner, auth.uid())
  on conflict (listing_id, requester_id) do nothing;

  -- Notification seulement au tout premier clic (pas de spam si on rappelle
  -- express_interest sur une conversation déjà existante).
  if found then
    select p.first_name into v_helper_name from public.profiles p where p.id = auth.uid();

    insert into public.notifications (user_id, type, listing_id, data)
    values (
      v_owner,
      'interest',
      target_listing_id,
      jsonb_build_object(
        'medication_name', v_name,
        'listing_type', v_type,
        'helper_first_name', coalesce(v_helper_name, 'Un membre')
      )
    );
  end if;
end;
$$;

revoke execute on function public.express_interest(uuid) from anon, public;
grant execute on function public.express_interest(uuid) to authenticated;

-- ============================================================
-- 2. L'auteur accepte ou refuse une proposition
-- ============================================================

create or replace function public.respond_to_interest(target_conversation_id uuid, accept boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner uuid;
  v_requester uuid;
  v_status text;
  v_listing_id uuid;
  v_name text;
begin
  select c.owner_id, c.requester_id, c.status, c.listing_id
    into v_owner, v_requester, v_status, v_listing_id
    from public.conversations c
    where c.id = target_conversation_id;

  if v_owner is null then
    raise exception 'Conversation introuvable';
  end if;
  if v_owner <> auth.uid() then
    raise exception 'Action réservée à l''auteur de l''annonce';
  end if;
  if v_status <> 'pending' then
    raise exception 'Cette proposition a déjà reçu une réponse';
  end if;

  update public.conversations
    set status = case when accept then 'accepted' else 'declined' end,
        responded_at = now()
    where id = target_conversation_id;

  select l.medication_name into v_name from public.listings l where l.id = v_listing_id;

  insert into public.notifications (user_id, type, listing_id, data)
  values (
    v_requester,
    case when accept then 'interest_accepted' else 'interest_declined' end,
    v_listing_id,
    jsonb_build_object('medication_name', v_name)
  );
end;
$$;

revoke execute on function public.respond_to_interest(uuid, boolean) from anon, public;
grant execute on function public.respond_to_interest(uuid, boolean) to authenticated;

-- ============================================================
-- 3. Envoyer un message — uniquement dans une conversation acceptée
-- ============================================================

create or replace function public.send_message(target_conversation_id uuid, body text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner uuid;
  v_requester uuid;
  v_status text;
  v_listing_id uuid;
  v_name text;
  v_recipient uuid;
  v_sender_name text;
  v_clean_body text := btrim(coalesce(body, ''));
begin
  if char_length(v_clean_body) = 0 or char_length(v_clean_body) > 2000 then
    raise exception 'Message vide ou trop long';
  end if;

  select c.owner_id, c.requester_id, c.status, c.listing_id
    into v_owner, v_requester, v_status, v_listing_id
    from public.conversations c
    where c.id = target_conversation_id;

  if v_owner is null then
    raise exception 'Conversation introuvable';
  end if;
  if auth.uid() not in (v_owner, v_requester) then
    raise exception 'Vous ne faites pas partie de cette conversation';
  end if;
  if v_status <> 'accepted' then
    raise exception 'Cette conversation n''est pas encore ouverte';
  end if;

  insert into public.messages (conversation_id, sender_id, body)
  values (target_conversation_id, auth.uid(), v_clean_body);

  v_recipient := case when auth.uid() = v_owner then v_requester else v_owner end;
  select p.first_name into v_sender_name from public.profiles p where p.id = auth.uid();
  select l.medication_name into v_name from public.listings l where l.id = v_listing_id;

  insert into public.notifications (user_id, type, listing_id, data)
  values (
    v_recipient,
    'message',
    v_listing_id,
    jsonb_build_object('medication_name', v_name, 'helper_first_name', coalesce(v_sender_name, 'Un membre'))
  );
end;
$$;

revoke execute on function public.send_message(uuid, text) from anon, public;
grant execute on function public.send_message(uuid, text) to authenticated;
