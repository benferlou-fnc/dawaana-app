-- Dawaana — système de notifications
--
-- Trois événements manquaient totalement de retour pour l'utilisateur
-- concerné : quelqu'un se propose d'aider sur une annonce (le bouton « Je
-- peux aider » n'affichait qu'un message local, personne n'était vraiment
-- prévenu), un badge est posé (identité vérifiée / médicament contrôlé), ou
-- un administrateur modère une annonce (retrait / remise en ligne). Cette
-- migration ajoute une table de notifications et branche ces trois
-- événements dessus — affichage in-app uniquement (cloche), pas d'e-mail.

-- ============================================================
-- Table
-- ============================================================

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (
    type in ('interest', 'identity_verified', 'medication_verified', 'listing_moderated')
  ),
  listing_id uuid references public.listings(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_id_created_at_idx
  on public.notifications (user_id, created_at desc);
create index if not exists notifications_user_id_unread_idx
  on public.notifications (user_id) where read_at is null;

alter table public.notifications enable row level security;

drop policy if exists "Chacun voit ses propres notifications" on public.notifications;
create policy "Chacun voit ses propres notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

drop policy if exists "Chacun marque ses notifications comme lues" on public.notifications;
create policy "Chacun marque ses notifications comme lues"
  on public.notifications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Toute création passe par une fonction ou un déclencheur SECURITY DEFINER
-- (ci-dessous) : aucune policy insert n'est posée, et update/insert/delete
-- sont explicitement coupés pour le client — seule la colonne read_at reste
-- modifiable, pour marquer une notification comme lue.
revoke insert, update, delete on public.notifications from anon, authenticated;
grant update (read_at) on public.notifications to authenticated;

-- ============================================================
-- 1. Quelqu'un se propose d'aider sur une annonce
-- ============================================================
-- Le client ne peut pas insérer une notification pour un autre utilisateur
-- (pas de policy insert) : cette fonction est l'unique chemin, et elle
-- retrouve elle-même le propriétaire de l'annonce — impossible de notifier
-- n'importe qui pour n'importe quoi.

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

  -- Pas de notification pour soi-même (ne devrait pas arriver côté UI).
  if v_owner = auth.uid() then
    return;
  end if;

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
end;
$$;

revoke execute on function public.express_interest(uuid) from anon, public;
grant execute on function public.express_interest(uuid) to authenticated;

-- ============================================================
-- 2. Un badge est posé — identité vérifiée / médicament contrôlé
-- ============================================================
-- On remplace les deux fonctions existantes (0004 et 0006) pour y ajouter la
-- notification, sans toucher à leur garde-fou de rôle.

create or replace function public.admin_set_verified(target_id uuid, verified boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Action réservée aux administrateurs';
  end if;
  update public.profiles set identity_verified = verified where id = target_id;

  if verified then
    insert into public.notifications (user_id, type, data)
    values (target_id, 'identity_verified', '{}'::jsonb);
  end if;
end;
$$;

create or replace function public.pharmacist_set_medication_verified(target_id uuid, verified boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner uuid;
  v_name text;
begin
  if not public.is_pharmacist() then
    raise exception 'Action réservée aux pharmaciens';
  end if;
  update public.listings set medication_verified = verified where id = target_id;

  if verified then
    select l.user_id, l.medication_name into v_owner, v_name
      from public.listings l where l.id = target_id;
    if v_owner is not null then
      insert into public.notifications (user_id, type, listing_id, data)
      values (v_owner, 'medication_verified', target_id, jsonb_build_object('medication_name', v_name));
    end if;
  end if;
end;
$$;

-- ============================================================
-- 3. Un administrateur modère une annonce (retrait / remise en ligne)
-- ============================================================
-- Déclencheur plutôt que fonction dédiée : ModerateActions fait un simple
-- .update({status}) depuis le client, comme StatusActions côté auteur — les
-- deux passent par le même chemin. Le déclencheur ne notifie que quand
-- l'auteur du changement n'est pas l'auteur de l'annonce (donc un
-- administrateur, seul autre rôle autorisé par les policies RLS à modifier
-- l'annonce d'un tiers) ; l'auteur qui change lui-même son statut n'a pas à
-- être notifié de sa propre action.

create or replace function public.notify_listing_moderated()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if OLD.user_id is not null and auth.uid() is distinct from OLD.user_id then
    insert into public.notifications (user_id, type, listing_id, data)
    values (
      OLD.user_id,
      'listing_moderated',
      OLD.id,
      jsonb_build_object('medication_name', OLD.medication_name, 'new_status', NEW.status)
    );
  end if;
  return NEW;
end;
$$;

drop trigger if exists listings_notify_moderation on public.listings;
create trigger listings_notify_moderation
  after update on public.listings
  for each row
  when (OLD.status is distinct from NEW.status)
  execute function public.notify_listing_moderated();
