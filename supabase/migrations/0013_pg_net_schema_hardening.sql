-- L'audit de sécurité Supabase (advisor "Extension in Public") signale
-- pg_net installée dans le schéma public. On la réinstalle dans le schéma
-- `extensions`, prévu à cet effet.
--
-- Note : pg_net ne supporte pas `ALTER EXTENSION ... SET SCHEMA` (erreur
-- Postgres 0A000), il faut la supprimer puis la recréer. Ceci est sans
-- risque ici : pg_net crée de toute façon son propre schéma `net` pour ses
-- fonctions (net.http_post, net.http_get...), indépendamment du schéma
-- auquel l'extension elle-même est rattachée — le trigger
-- notify_pharmacists_new_don() continue de fonctionner à l'identique.
drop extension if exists pg_net;
create extension if not exists pg_net schema extensions;
