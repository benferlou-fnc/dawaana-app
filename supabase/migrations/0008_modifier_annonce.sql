-- Dawaana — modification d'une annonce par son auteur
--
-- Depuis la migration 0006, seule la colonne « status » était modifiable
-- (pour retirer / republier / marquer résolue). L'auteur ne pouvait corriger
-- ni une erreur de saisie, ni ajouter une photo après coup. On élargit la
-- liste des colonnes modifiables aux champs de contenu d'une annonce.
--
-- Restent interdites en écriture directe : id, user_id, first_name,
-- pseudonym, consent_at, created_at (figés à la publication), et
-- medication_verified (uniquement via pharmacist_set_medication_verified,
-- migration 0006). La ligne elle-même reste protégée par les policies RLS
-- existantes : seul l'auteur (ou un administrateur) peut modifier une
-- annonce donnée.

revoke update on public.listings from anon, authenticated;
grant update (
  category, medication_name, dosage, quantity, wilaya, urgency, context,
  donor_country, donor_city, expiration_date, arrival_date, status,
  photo_urls, expiration_photo_url
) to authenticated;
