-- Dawaana — catégories d'annonces
--
-- Jusqu'ici une annonce ne pouvait porter que sur un « médicament ». Or un
-- don ou une recherche peut aussi concerner du matériel d'incontinence
-- (poches, sondes…), un dispositif médical, des compléments, etc. Cette
-- migration ajoute une catégorie, sans rien retirer : les annonces déjà
-- publiées sont classées "medicament" par défaut, ce qui correspond à leur
-- contenu réel jusqu'ici.

alter table public.listings
  add column if not exists category text not null default 'medicament';

alter table public.listings
  add constraint listings_category_check
  check (category in (
    'medicament',
    'materiel_incontinence',
    'dispositif_medical',
    'complement',
    'materiel_soins',
    'autre'
  ));

-- Filtrer par catégorie sur /annonces doit rester rapide.
create index if not exists listings_category_idx on public.listings (category);
