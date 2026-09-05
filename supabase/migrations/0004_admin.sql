-- Dawaana — rôle administrateur et modération
--
-- Jusqu'ici la modération passait par l'éditeur de tables Supabase, et le
-- badge « identité vérifiée » n'était posable par personne. Cette migration
-- ouvre les deux, sans affaiblir les garde-fous existants.

-- ============================================================
-- Rôle administrateur
-- ============================================================
-- is_admin n'apparaît pas dans « grant update (first_name) » de la migration
-- 0003 : un membre ne peut donc pas se nommer administrateur lui-même. Seul un
-- accès direct à la base (éditeur SQL, clé de service) peut attribuer ce rôle.
--
-- Pour désigner le premier administrateur :
--   update public.profiles set is_admin = true
--   where id = (select id from auth.users where email = 'adresse@exemple.com');

alter table public.profiles add column if not exists is_admin boolean not null default false;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select p.is_admin from public.profiles p where p.id = auth.uid()), false);
$$;

revoke execute on function public.is_admin() from anon, public;
grant execute on function public.is_admin() to authenticated;

-- ============================================================
-- Pouvoirs de modération
-- ============================================================
-- Les politiques s'additionnent : celles-ci s'ajoutent à « chacun gère ses
-- propres publications » sans l'affaiblir.

create policy "Les administrateurs voient toutes les annonces"
  on public.listings for select using (public.is_admin());

create policy "Les administrateurs modèrent les annonces"
  on public.listings for update using (public.is_admin()) with check (public.is_admin());

create policy "Les administrateurs suppriment une annonce"
  on public.listings for delete using (public.is_admin());

create policy "Les administrateurs voient tous les trajets"
  on public.trips for select using (public.is_admin());

create policy "Les administrateurs modèrent les trajets"
  on public.trips for update using (public.is_admin()) with check (public.is_admin());

create policy "Les administrateurs suppriment un trajet"
  on public.trips for delete using (public.is_admin());

-- ============================================================
-- Pose du badge « identité vérifiée »
-- ============================================================
-- La colonne reste interdite en écriture à tout le monde, administrateurs
-- compris. Elle ne peut changer que par cette fonction, qui vérifie d'abord
-- que l'appelant est administrateur : c'est l'unique chemin vers le badge.

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
end;
$$;

revoke execute on function public.admin_set_verified(uuid, boolean) from anon, public;
grant execute on function public.admin_set_verified(uuid, boolean) to authenticated;
