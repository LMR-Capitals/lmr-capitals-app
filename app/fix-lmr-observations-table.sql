-- LMR Capitals — LMR Observation journal table
-- Stores individual observation entries (market notes, setups, confluences).
-- Idempotent — safe to run no matter what state the table is currently in.
--
-- Run in Supabase → SQL Editor → New query → Run

create table if not exists public.lmr_observations (
  id text primary key default gen_random_uuid()::text
);

alter table public.lmr_observations add column if not exists user_id    uuid;
alter table public.lmr_observations add column if not exists title      text;
alter table public.lmr_observations add column if not exists content    text;
alter table public.lmr_observations add column if not exists created_at timestamptz default now();
alter table public.lmr_observations add column if not exists updated_at timestamptz default now();

alter table public.lmr_observations enable row level security;

drop policy if exists "own lmr_observations" on public.lmr_observations;
create policy "own lmr_observations" on public.lmr_observations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
