-- Give the Copier Cockpit nav section its own dedicated table.
--
-- The cockpit config (state.copier = {leaderId, instrument, masterSize,
-- autoMirror, followers}) was previously browser-only (localStorage). It is a
-- single per-user object, so one row per user (user_id is the primary key).
-- RLS mirrors every other table. No data backfill: the config was never in the
-- cloud, so each browser's local config uploads on its next sync.
create table if not exists public.copier_config (
  user_id    uuid primary key default auth.uid(),
  config     jsonb,
  updated_at timestamptz default now()
);
alter table public.copier_config enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='copier_config' and policyname='own copier_config') then
    create policy "own copier_config" on public.copier_config
      for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end $$;
