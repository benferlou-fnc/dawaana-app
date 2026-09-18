-- Extension pour appels HTTP asynchrones depuis les triggers Postgres
-- (corrigée en 0013 : déplacée du schéma public vers extensions).
create extension if not exists pg_net;

-- Abonnements aux notifications push (Web Push / PWA)
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth_key text not null,
  created_at timestamptz not null default now()
);

create index if not exists push_subscriptions_user_id_idx on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

revoke all on public.push_subscriptions from anon, authenticated;
grant select, insert, update, delete on public.push_subscriptions to authenticated;

drop policy if exists "Chacun gere ses propres abonnements push" on public.push_subscriptions;
create policy "Chacun gere ses propres abonnements push"
  on public.push_subscriptions for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Suivi de qui a controle une annonce, et quand
alter table public.listings
  add column if not exists medication_verified_by uuid references public.profiles(id),
  add column if not exists medication_verified_at timestamptz;

create index if not exists listings_medication_verified_by_idx on public.listings (medication_verified_by);

-- Mise a jour de la fonction de controle pharmacien : trace l'auteur et la date du controle
create or replace function public.pharmacist_set_medication_verified(target_id uuid, verified boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner uuid;
  v_name text;
begin
  if not public.is_pharmacist() then
    raise exception 'Action réservée aux pharmaciens';
  end if;

  update public.listings
    set medication_verified = verified,
        medication_verified_by = case when verified then auth.uid() else null end,
        medication_verified_at = case when verified then now() else null end
    where id = target_id;

  if verified then
    select l.user_id, l.medication_name into v_owner, v_name
      from public.listings l where l.id = target_id;
    if v_owner is not null then
      insert into public.notifications (user_id, type, listing_id, data)
      values (v_owner, 'medication_verified', target_id, jsonb_build_object('medication_name', v_name));
    end if;
  end if;
end;
$$;

-- Notifie les pharmaciens benevoles (par push) a chaque nouveau don actif publie
create or replace function public.notify_pharmacists_new_don()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform net.http_post(
    url := 'https://hqjykmlngtifswjgkssy.supabase.co/functions/v1/notify-pharmacists',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhxanlrbWxuZ3RpZnN3amdrc3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg1NDYwMzIsImV4cCI6MjEwNDEyMjAzMn0.tuebGk0j7CJovOm2uc_iBOaOtkA9bO28pzvV1073OB8'
    ),
    body := jsonb_build_object('listing_id', NEW.id)
  );
  return NEW;
end;
$$;

revoke execute on function public.notify_pharmacists_new_don() from anon, authenticated, public;

drop trigger if exists on_new_don_notify_pharmacists on public.listings;
create trigger on_new_don_notify_pharmacists
  after insert on public.listings
  for each row
  when (NEW.type = 'don' and NEW.status = 'active')
  execute function public.notify_pharmacists_new_don();
