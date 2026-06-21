-- ─────────────────────────────────────────────────────────────────────────────
-- LMR Capitals — Achievements / Track Record table
--
-- Run this in Supabase → SQL Editor (once) to enable cloud sync for the
-- Achievements feature AND the public "Proven Track Record" section on the
-- landing page. Until you run it, achievements are saved locally in the browser
-- only (the app falls back gracefully).
--
-- Images are stored inline as compressed data URLs in the `image` column
-- (same approach as observations). Fine for dozens of certificates.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.lmr_achievements (
  id          text primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text,
  category    text,            -- Funded Pass | Payout | Milestone | Certificate
  firm        text,            -- e.g. Tradeify
  amount      numeric,         -- payout amount (optional)
  achieved_on date,
  caption     text,
  image       text,            -- baked certificate (name already covered) as data URL
  is_public   boolean default false,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create index if not exists lmr_achievements_user_idx on public.lmr_achievements(user_id);
create index if not exists lmr_achievements_public_idx on public.lmr_achievements(is_public) where is_public = true;

alter table public.lmr_achievements enable row level security;

-- Owner: full access to their own achievements
drop policy if exists "own_achievements_all" on public.lmr_achievements;
create policy "own_achievements_all" on public.lmr_achievements
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Public read: anyone (including anonymous visitors) may read rows marked public.
-- This is what powers the public Track Record section on the landing page.
drop policy if exists "public_achievements_read" on public.lmr_achievements;
create policy "public_achievements_read" on public.lmr_achievements
  for select
  using (is_public = true);
