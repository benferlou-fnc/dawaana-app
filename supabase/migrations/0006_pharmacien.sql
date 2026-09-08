-- Dawaana — rôle pharmacien et contrôle du médicament
--
-- Le badge « identité vérifiée » atteste de la personne. Il ne dit rien sur
-- le médicament lui-même : est-ce bien le bon produit, le bon dosage, une
-- date de péremption encore valable ? C'est ce que cette migration ouvre :
-- un pharmacien bénévole peut contrôler une annonce de don et y apposer un
-- second badge, indépendant du premier.

-- ============================================================
-- Rôle pharmacien
-- ============================================================
-- Même principe que is_admin (migration 0004) : la colonne n'apparaît pas
-- dans « grant update » de la migration 0003, donc personne ne peut se
-- déclarer pharmacien lui-même. Seul un accès direct à la base peut
-- attribuer ce rôle.
--
-- Pour désigner un pharmacien :
--   update public.profiles set is_pharmacist = true
--   where id = (select id from auth.users where email = 'adresse@exemple.com');

alter table public.profiles add column if not exists is_pharmacist boolean not null default false;

create or replace function public.is_pharmacist()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select p.is_pharmacist from public.profiles p where p.id = auth.uid()), false);
$$;

revoke execute on function public.is_pharmacist() from anon, public;
grant execute on function public.is_pharmacist() to authenticated;

-- ============================================================
-- Contrôle du médicament (badge distinct du badge d'identité)
-- ============================================================

alter table public.listings add column if not exists medication_verified boolean not null default false;

-- Jusqu'ici, aucune politique ne limitait les colonnes qu'un auteur pouvait
-- modifier sur sa propre annonce (seul le statut est modifié depuis
-- l'interface). On verrouille maintenant explicitement : le statut reste
-- modifiable, medication_verified ne l'est plus — exactement comme
-- identity_verified sur les profils. Sans cela, un auteur pourrait
-- s'auto-déclarer « médicament contrôlé ».
revoke update on public.listings from anon, authenticated;
grant update (status) on public.listings to authenticated;

-- Seul un pharmacien peut poser ou retirer ce badge, et seulement via cette
-- fonction — la colonne reste interdite en écriture directe à tout le monde,
-- pharmaciens compris.
create or replace function public.pharmacist_set_medication_verified(target_id uuid, verified boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_pharmacist() then
    raise exception 'Action réservée aux pharmaciens';
  end if;
  update public.listings set medication_verified = verified where id = target_id;
end;
$$;

revoke execute on function public.pharmacist_set_medication_verified(uuid, boolean) from anon, public;
grant execute on function public.pharmacist_set_medication_verified(uuid, boolean) to authenticated;
