-- Dawaana — correctifs issus de l'audit fonctionnel
--
-- Trois défauts confirmés directement sur la base de production.

-- ============================================================
-- 1. Modifier son annonce était refusé par la base
-- ============================================================
-- La migration 0008 voulait élargir les colonnes modifiables, mais son
-- « grant update (...) to authenticated » était écrit sans « on
-- public.listings » : la commande n'est jamais passée. Résultat, depuis
-- 0006 seule la colonne « status » restait accordée, et toute modification
-- de contenu échouait sur « permission denied for table listings ».
--
-- Restent volontairement hors de la liste : id, user_id, type, first_name,
-- pseudonym, consent_at, created_at (figés à la publication) et
-- medication_verified* (réservé à pharmacist_set_medication_verified).

revoke update on public.listings from anon, authenticated;
grant update (
  category, medication_name, dosage, quantity, wilaya, urgency, context,
  donor_country, donor_city, expiration_date, arrival_date, status,
  photo_urls, expiration_photo_url
) on public.listings to authenticated;

-- Même ménage côté trajets : l'ancien grant couvrait toutes les colonnes,
-- y compris id, user_id, first_name, consent_at et created_at — et il était
-- ouvert à anon.
revoke update on public.trips from anon, authenticated;
grant update (
  from_country, from_city, to_wilaya, travel_date, capacity_note, context, status
) on public.trips to authenticated;

-- ============================================================
-- 2. Une publication retirée devenait invisible à son propre auteur
-- ============================================================
-- Les seules policies de lecture étaient « status = 'active' » et
-- « is_admin() ». Dès qu'un membre marquait son annonce « résolue » ou
-- « retirée », elle disparaissait de « Mes annonces » : plus moyen de la
-- remettre en ligne, ni même de la relire. Idem pour les trajets passés.

drop policy if exists "Chacun voit ses propres annonces" on public.listings;
create policy "Chacun voit ses propres annonces"
  on public.listings for select
  using ((select auth.uid()) = user_id);

drop policy if exists "Chacun voit ses propres trajets" on public.trips;
create policy "Chacun voit ses propres trajets"
  on public.trips for select
  using ((select auth.uid()) = user_id);

-- ============================================================
-- 3. Un pharmacien ne retrouvait pas son propre historique de contrôles
-- ============================================================
-- Le tableau de bord liste les annonces qu'il a contrôlées ; celles qui ne
-- sont plus actives (don réalisé, donc « résolue ») lui étaient masquées.

drop policy if exists "Un pharmacien voit les annonces qu il a controlees" on public.listings;
create policy "Un pharmacien voit les annonces qu il a controlees"
  on public.listings for select
  using (medication_verified_by is not null and medication_verified_by = (select auth.uid()));

-- ============================================================
-- 4. Photos orphelines
-- ============================================================
-- Supprimer une annonce laissait ses photos dans un bucket public, toujours
-- accessibles par leur URL. Le ménage se fait côté application (storage.remove),
-- mais un modérateur ne pouvait effacer que ses propres fichiers.

drop policy if exists "Les administrateurs suppriment les photos" on storage.objects;
create policy "Les administrateurs suppriment les photos"
  on storage.objects for delete
  using (bucket_id = 'listing-photos' and public.is_admin());
