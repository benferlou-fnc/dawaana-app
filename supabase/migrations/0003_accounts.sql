-- Dawaana — comptes utilisateurs
--
-- Sans compte, l'auteur d'une annonce ne pouvait jamais la retirer : son
-- besoin de santé restait public indéfiniment. C'est ce que cette migration
-- corrige, et c'est aussi le socle du badge « identité vérifiée ».

-- ============================================================
-- Profils
-- ============================================================
-- Le profil ne contient QUE ce qui s'affiche publiquement.
-- L'e-mail reste dans auth.users, géré par Supabase, jamais exposé ici.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text not null,
  identity_verified boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profils visibles par tous"
  on public.profiles for select
  using (true);

create policy "Chacun crée son propre profil"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Chacun modifie son propre profil"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- CRITIQUE : sans ces deux lignes, n'importe qui pourrait se déclarer
-- « identité vérifiée » lui-même. Seul le prénom est modifiable par son
-- propriétaire ; le badge ne peut être posé que par le service.
revoke update on public.profiles from anon, authenticated;
grant update (first_name) on public.profiles to authenticated;

-- Chaque nouveau compte reçoit automatiquement un profil, que l'inscription
-- se fasse par e-mail (prénom saisi) ou par Google (prénom fourni par Google).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, first_name)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data->>'first_name'), ''),
      nullif(trim(new.raw_user_meta_data->>'given_name'), ''),
      nullif(split_part(trim(coalesce(new.raw_user_meta_data->>'full_name',
                                      new.raw_user_meta_data->>'name', '')), ' ', 1), ''),
      'Membre'
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Fonction de déclencheur : jamais appelable depuis l'API publique.
revoke execute on function public.handle_new_user() from anon, authenticated, public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- Rattachement des publications à leur auteur
-- ============================================================
-- on delete cascade : supprimer son compte supprime ses publications.
-- C'est ce que promet la page confidentialité.

alter table public.listings add column if not exists user_id uuid
  references public.profiles(id) on delete cascade;
alter table public.trips add column if not exists user_id uuid
  references public.profiles(id) on delete cascade;

create index if not exists listings_user_id_idx on public.listings (user_id);
create index if not exists trips_user_id_idx on public.trips (user_id);

-- Le badge n'a plus qu'une seule source de vérité : le profil. Le garder aussi
-- sur chaque publication aurait permis à deux valeurs de diverger.
alter table public.listings drop column if exists identity_verified;
alter table public.trips drop column if exists identity_verified;

-- ============================================================
-- Nouvelles règles d'accès
-- ============================================================
-- Publier exige désormais un compte, et chacun ne touche qu'à ses propres
-- publications.

drop policy if exists "Tout le monde peut publier une annonce" on public.listings;
drop policy if exists "Tout le monde peut publier un trajet" on public.trips;

create policy "Publier sous son propre compte"
  on public.listings for insert
  with check (auth.uid() = user_id and status = 'active');

create policy "Modifier ses propres annonces"
  on public.listings for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Supprimer ses propres annonces"
  on public.listings for delete
  using (auth.uid() = user_id);

create policy "Publier son propre trajet"
  on public.trips for insert
  with check (auth.uid() = user_id and status = 'active');

create policy "Modifier ses propres trajets"
  on public.trips for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Supprimer ses propres trajets"
  on public.trips for delete
  using (auth.uid() = user_id);
