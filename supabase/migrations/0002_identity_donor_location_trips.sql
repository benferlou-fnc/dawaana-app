-- Dawaana — identité vérifiée, emplacement du donateur, carnet de voyages
--
-- Choix structurant : on ne stocke JAMAIS de pièce d'identité, de selfie ni de
-- numéro de téléphone. La vérification d'identité est déléguée à un prestataire
-- externe qui ne renvoie qu'un booléen. Motif : loi 25-11 du 24 juillet 2025 —
-- ces données relèvent du traitement à haut risque, et une plateforme santé
-- tenue par des bénévoles n'a pas à en devenir le dépositaire.

-- Prénom affiché publiquement. Jamais le nom complet d'un demandeur :
-- une annonce de recherche révèle un besoin de santé.
alter table public.listings add column if not exists first_name text;

alter table public.listings add column if not exists identity_verified boolean not null default false;

-- Emplacement du donateur quand il se trouve à l'étranger.
alter table public.listings add column if not exists donor_country text;
alter table public.listings add column if not exists donor_city text;

-- Horodatage du consentement explicite.
alter table public.listings add column if not exists consent_at timestamptz;

-- Le pseudonyme appartient aux premières annonces ; il n'est plus obligatoire.
alter table public.listings alter column pseudonym drop not null;

-- Carnet de voyages : un voyageur annonce son trajet, on le croise ensuite
-- avec les demandes de la wilaya d'arrivée. Remplace l'idée d'afficher les
-- horaires de vols : savoir qu'une compagnie dessert la ligne n'apprend rien,
-- savoir qu'une personne réelle arrive le 12 octobre, oui.
create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  from_country text not null,
  from_city text,
  to_wilaya text not null,
  travel_date date not null,
  capacity_note text,
  context text,
  identity_verified boolean not null default false,
  consent_at timestamptz,
  status text not null default 'active' check (status in ('active', 'passe', 'retire')),
  created_at timestamptz not null default now()
);

create index if not exists trips_status_travel_date_idx on public.trips (status, travel_date);
create index if not exists trips_to_wilaya_idx on public.trips (to_wilaya);

alter table public.trips enable row level security;

create policy "Trajets actifs visibles par tous"
  on public.trips for select
  using (status = 'active');

create policy "Tout le monde peut publier un trajet"
  on public.trips for insert
  with check (status = 'active');

-- Pas de policy update/delete, comme pour les annonces : rien ne peut être
-- modifié ni effacé depuis le client.
