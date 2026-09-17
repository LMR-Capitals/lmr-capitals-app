-- LMR Capitals — create the missing `weekly_reports` table
--
-- The AI Reports panel (Reports → ✦ Full Review / Weekly / Trade / Psych)
-- reads from and writes to public.weekly_reports (see index.html lines
-- 4231, 8779, 8839, 8918), but this table was never created by
-- supabase-setup.sql. That's why generated reports never save and the
-- Reports panel always shows "No reports yet".
--
-- Run this ONCE in Supabase → SQL Editor → New query.

create table if not exists public.weekly_reports (
  id          text primary key default gen_random_uuid()::text,
  user_id     uuid references auth.users not null default auth.uid(),
  title       text,
  content     text,
  metrics     jsonb default '{}',
  week_start  date,
  week_end    date,
  created_at  timestamptz default now()
);

alter table public.weekly_reports enable row level security;

create policy "own weekly_reports" on public.weekly_reports
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
