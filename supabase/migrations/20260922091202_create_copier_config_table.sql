-- Dedicated table for the Copier Cockpit nav section.
-- The cockpit config (state.copier = {leaderId, instrument, masterSize,
-- autoMirror, followers}) was previously browser-only (localStorage). It is a
-- single per-user object, so one row per user (user_id primary key). RLS mirrors
-- every other table.
create table if not exists public.copier_config (
  user_id    uuid primary key default auth.uid(),
  config     jsonb,
  updated_at timestamptz default now()
);
alter table public.copier_config enable row level security;
create policy "own copier_config" on public.copier_config
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
