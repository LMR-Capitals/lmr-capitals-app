-- ─────────────────────────────────────────────────────────────────────────────
-- LMR Capitals — create/fix the `profiles` table + Row Level Security
--
-- WHY THIS EXISTS
-- syncProfileToCloud() / loadProfileFromCloud() in index.html have been
-- upserting/reading public.profiles for a while, but this table was never
-- part of supabase-setup.sql. If it doesn't exist yet, profile data (name,
-- business, goals, theme, Discord settings, etc.) silently fails to sync
-- (the app catches the error and just keeps the data local-only). If it DOES
-- exist but without Row Level Security, then ANY signed-in user could read
-- or write EVERY row in this table — i.e. a brand-new account could read the
-- admin's profile data. This script creates the table if missing and
-- guarantees RLS is on with an "own row only" policy, exactly like every
-- other table in supabase-setup.sql.
--
-- HOW TO RUN
-- Open the Supabase dashboard for this project → SQL Editor → paste this
-- entire file → Run. Safe to run multiple times.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.profiles (
  user_id    uuid references auth.users not null primary key default auth.uid()
);

alter table public.profiles add column if not exists name                 text;
alter table public.profiles add column if not exists email                text;
alter table public.profiles add column if not exists role                 text;
alter table public.profiles add column if not exists business             text;
alter table public.profiles add column if not exists website              text;
alter table public.profiles add column if not exists photo_b64            text;
alter table public.profiles add column if not exists daily_goal           numeric;
alter table public.profiles add column if not exists monthly_goal         numeric;
alter table public.profiles add column if not exists max_loss             numeric;
alter table public.profiles add column if not exists max_dd               numeric;
alter table public.profiles add column if not exists risk_default         numeric;
alter table public.profiles add column if not exists account_size         numeric;
alter table public.profiles add column if not exists remind_chain         text;
alter table public.profiles add column if not exists remind_weekly        text;
alter table public.profiles add column if not exists theme                text;
alter table public.profiles add column if not exists day_count_start      int;
alter table public.profiles add column if not exists day_count_start_date date;
alter table public.profiles add column if not exists balance_format       text;
alter table public.profiles add column if not exists current_acc          text;
alter table public.profiles add column if not exists cal_month            text;
alter table public.profiles add column if not exists settings             jsonb default '{}';
alter table public.profiles add column if not exists updated_at           timestamptz default now();

-- ── ROW LEVEL SECURITY ───────────────────────────────────────────────────────────
-- Each user can only read/write their OWN profile row — a new account can
-- never see or modify the admin's (or any other user's) profile data.

alter table public.profiles enable row level security;

drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
