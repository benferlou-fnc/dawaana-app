-- Dawaana — les règles réservées aux membres ne doivent pas viser les visiteurs
--
-- Symptôme : un visiteur non connecté ne voyait plus aucune annonce, et
-- chaque fiche répondait 404.
--
-- Cause : les policies écrites depuis la migration 0004 ne précisaient
-- aucun rôle, donc Postgres les applique au rôle « public » — visiteurs
-- anonymes compris. Les policies de lecture d'une même table s'additionnent
-- en OU, et rien ne garantit l'ordre d'évaluation : Postgres finissait par
-- évaluer is_admin() pour un visiteur anonyme. Or la migration 0004 lui
-- retire justement le droit d'exécuter cette fonction. Toute la requête
-- échouait alors sur « permission denied for function is_admin », le code
-- journalisait l'erreur et renvoyait une liste vide — ou un 404 sur une fiche.
--
-- Le défaut dormait depuis 0004 : tant qu'il n'y avait qu'une policy de
-- lecture « intéressante », le planificateur s'arrêtait sur status='active'
-- sans jamais toucher à is_admin(). Les deux policies ajoutées en 0014 ont
-- changé le plan, et le défaut est devenu visible.
--
-- Correctif : chaque policy réservée aux membres est rattachée au rôle
-- « authenticated ». Un visiteur ne se voit plus appliquer que la policy
-- publique, la seule qui le concerne — et il n'évalue plus is_admin().
-- Effet de bord bienvenu : une requête anonyme cesse d'évaluer des
-- conditions qui la concernent pas.
--
-- Les droits eux-mêmes ne changent pas d'un pouce : ce qui était visible
-- l'est encore, ce qui était caché le reste. Vérifié après coup — une
-- annonce retirée reste invisible au public, son auteur la voit toujours.

-- ---------- listings ----------
drop policy if exists "Les administrateurs voient toutes les annonces" on public.listings;
create policy "Les administrateurs voient toutes les annonces"
  on public.listings for select to authenticated using (public.is_admin());

drop policy if exists "Les administrateurs modèrent les annonces" on public.listings;
create policy "Les administrateurs modèrent les annonces"
  on public.listings for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Les administrateurs suppriment une annonce" on public.listings;
create policy "Les administrateurs suppriment une annonce"
  on public.listings for delete to authenticated using (public.is_admin());

drop policy if exists "Chacun voit ses propres annonces" on public.listings;
create policy "Chacun voit ses propres annonces"
  on public.listings for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Un pharmacien voit les annonces qu il a controlees" on public.listings;
create policy "Un pharmacien voit les annonces qu il a controlees"
  on public.listings for select to authenticated
  using (medication_verified_by is not null and medication_verified_by = (select auth.uid()));

drop policy if exists "Publier sous son propre compte" on public.listings;
create policy "Publier sous son propre compte"
  on public.listings for insert to authenticated
  with check ((select auth.uid()) = user_id and status = 'active');

drop policy if exists "Modifier ses propres annonces" on public.listings;
create policy "Modifier ses propres annonces"
  on public.listings for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "Supprimer ses propres annonces" on public.listings;
create policy "Supprimer ses propres annonces"
  on public.listings for delete to authenticated using ((select auth.uid()) = user_id);

-- ---------- trips ----------
drop policy if exists "Les administrateurs voient tous les trajets" on public.trips;
create policy "Les administrateurs voient tous les trajets"
  on public.trips for select to authenticated using (public.is_admin());

drop policy if exists "Les administrateurs modèrent les trajets" on public.trips;
create policy "Les administrateurs modèrent les trajets"
  on public.trips for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Les administrateurs suppriment un trajet" on public.trips;
create policy "Les administrateurs suppriment un trajet"
  on public.trips for delete to authenticated using (public.is_admin());

drop policy if exists "Chacun voit ses propres trajets" on public.trips;
create policy "Chacun voit ses propres trajets"
  on public.trips for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Publier son propre trajet" on public.trips;
create policy "Publier son propre trajet"
  on public.trips for insert to authenticated
  with check ((select auth.uid()) = user_id and status = 'active');

drop policy if exists "Modifier ses propres trajets" on public.trips;
create policy "Modifier ses propres trajets"
  on public.trips for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "Supprimer ses propres trajets" on public.trips;
create policy "Supprimer ses propres trajets"
  on public.trips for delete to authenticated using ((select auth.uid()) = user_id);

-- ---------- photos ----------
drop policy if exists "Les administrateurs suppriment les photos" on storage.objects;
create policy "Les administrateurs suppriment les photos"
  on storage.objects for delete to authenticated
  using (bucket_id = 'listing-photos' and public.is_admin());
