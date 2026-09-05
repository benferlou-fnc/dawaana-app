-- Dawaana — schéma initial
-- Table listings : demandes ("recherche") et dons ("don") de médicaments.
-- Publication anonyme par pseudonyme, aucune donnée personnelle identifiante.

create extension if not exists "pgcrypto";

create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('recherche', 'don')),
  medication_name text not null,
  dosage text,
  quantity text,
  wilaya text not null,
  urgency text not null default 'normal' check (urgency in ('urgent', 'normal')),
  context text,
  pseudonym text not null,
  expiration_date date,
  arrival_date date,
  status text not null default 'active' check (status in ('active', 'resolue', 'retiree')),
  created_at timestamptz not null default now()
);

create index if not exists listings_status_created_at_idx on public.listings (status, created_at desc);
create index if not exists listings_wilaya_idx on public.listings (wilaya);
create index if not exists listings_type_idx on public.listings (type);

alter table public.listings enable row level security;

-- Lecture publique des annonces actives uniquement.
create policy "Annonces actives visibles par tous"
  on public.listings for select
  using (status = 'active');

-- Publication anonyme ouverte à tous (pas d'authentification en MVP) —
-- mais on limite explicitement les colonnes acceptées côté application,
-- et la valeur par défaut du statut est toujours 'active'.
create policy "Tout le monde peut publier une annonce"
  on public.listings for insert
  with check (status = 'active');

-- Pas de policy update/delete : sans authentification, personne ne peut
-- modifier ou supprimer une annonce depuis le client. La modération se
-- fera via le tableau de bord Supabase (rôle service) en attendant un
-- comité de modération dédié.
