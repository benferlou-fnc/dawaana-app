-- Corrections trouvées lors d'un audit sécurité/perf (advisors Supabase) après
-- l'ajout de la messagerie (migration 0010) :
--
-- 1. notify_listing_moderated() est une fonction de déclencheur (trigger),
--    jamais censée être appelée directement en RPC — elle n'a pas besoin
--    d'un grant EXECUTE explicite (le mécanisme de trigger ne le requiert
--    pas), donc on le retire pour ne pas l'exposer inutilement via
--    /rest/v1/rpc/notify_listing_moderated.
revoke execute on function public.notify_listing_moderated() from anon, authenticated, public;

-- 2. Index manquants sur deux clés étrangères ajoutées par la messagerie.
create index if not exists messages_sender_id_idx on public.messages (sender_id);
create index if not exists notifications_listing_id_idx on public.notifications (listing_id);

-- 3. Policies conversations/messages : auth.uid() ré-évalué à chaque ligne.
--    On force son évaluation une seule fois par requête via (select ...).
drop policy if exists "Les participants voient leur conversation" on public.conversations;
create policy "Les participants voient leur conversation"
  on public.conversations for select
  using ((select auth.uid()) = owner_id or (select auth.uid()) = requester_id);

drop policy if exists "Les participants voient les messages de leur conversation" on public.messages;
create policy "Les participants voient les messages de leur conversation"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (c.owner_id = (select auth.uid()) or c.requester_id = (select auth.uid()))
    )
  );
