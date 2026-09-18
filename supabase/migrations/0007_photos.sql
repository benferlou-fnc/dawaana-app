-- Dawaana — photos du produit et de la date de péremption
--
-- Le contrôle par un pharmacien (migration 0006) reposait uniquement sur du
-- texte. De vraies photos (boîte, comprimés, date de péremption) permettent
-- un contrôle bien plus fiable avant la remise en main propre.

-- ============================================================
-- Colonnes sur les annonces
-- ============================================================
-- Jusqu'à 3 photos du produit, et une photo dédiée à la date de péremption.
-- Facultatives : on encourage sans jamais bloquer la publication.

alter table public.listings
  add column if not exists photo_urls text[] not null default '{}';
alter table public.listings
  add column if not exists expiration_photo_url text;

alter table public.listings
  drop constraint if exists listings_photo_urls_max3;
alter table public.listings
  add constraint listings_photo_urls_max3
  check (array_length(photo_urls, 1) is null or array_length(photo_urls, 1) <= 3);

-- ============================================================
-- Stockage des photos
-- ============================================================
-- Bucket public : les annonces sont déjà publiques, une URL publique évite
-- de gérer des URLs signées côté client. Chacun ne peut déposer (ni
-- supprimer) que dans son propre dossier, préfixé par son user id — jamais
-- dans celui d'un autre membre.

insert into storage.buckets (id, name, public)
values ('listing-photos', 'listing-photos', true)
on conflict (id) do nothing;

drop policy if exists "Photos d'annonces visibles par tous" on storage.objects;
create policy "Photos d'annonces visibles par tous"
  on storage.objects for select
  using (bucket_id = 'listing-photos');

drop policy if exists "Chacun dépose ses propres photos" on storage.objects;
create policy "Chacun dépose ses propres photos"
  on storage.objects for insert
  with check (
    bucket_id = 'listing-photos'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Chacun supprime ses propres photos" on storage.objects;
create policy "Chacun supprime ses propres photos"
  on storage.objects for delete
  using (
    bucket_id = 'listing-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
