-- LMR Capitals — idempotent fix for weekly_reports
-- Safe to run no matter what state the table is currently in:
--  • creates it if missing
--  • adds any columns the app needs that aren't there yet
--  • replaces the RLS policy with the correct "only your own rows" rule
--    (drops the old one first, so "already exists" can't happen)
--
-- Run in Supabase → SQL Editor → New query → Run

create table if not exists public.weekly_reports (
  id text primary key default gen_random_uuid()::text
);

alter table public.weekly_reports add column if not exists user_id    uuid;
alter table public.weekly_reports add column if not exists title      text;
alter table public.weekly_reports add column if not exists content    text;
alter table public.weekly_reports add column if not exists metrics    jsonb default '{}';
alter table public.weekly_reports add column if not exists week_start date;
alter table public.weekly_reports add column if not exists week_end   date;
alter table public.weekly_reports add column if not exists created_at timestamptz default now();

alter table public.weekly_reports enable row level security;

drop policy if exists "own weekly_reports" on public.weekly_reports;
create policy "own weekly_reports" on public.weekly_reports
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
