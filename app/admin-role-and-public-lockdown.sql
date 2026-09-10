-- ─────────────────────────────────────────────────────────────────────────────
-- LMR Capitals — Admin role + public-landing lockdown
--
-- Run ONCE in Supabase → SQL Editor → New query (select all, Run). Idempotent:
-- safe to re-run.
--
-- WHY: previously ANY signed-in user could set is_public = true on their own
-- achievements and have them appear on the PUBLIC landing page (the
-- "public_achievements_read" policy exposed every is_public row, from any
-- owner). This migration:
--   1. Introduces a proper admin role (server-enforced, not a client check).
--   2. Restricts the public landing "Track Record" to admin-owned rows only.
--   3. Lets ONLY admins publish (set is_public = true).
--   4. Clears a Supabase security-advisor warning on rls_auto_enable().
-- ─────────────────────────────────────────────────────────────────────────────

-- 1) ADMIN REGISTRY ───────────────────────────────────────────────────────────
-- Holds the auth.users ids that are admins. Membership is checked inside RLS
-- policies below — never by a client-side email/password check (which is
-- cosmetic and trivially bypassed).
create table if not exists public.admins (
  user_id   uuid primary key references auth.users(id) on delete cascade,
  added_at  timestamptz not null default now()
);

alter table public.admins enable row level security;

-- Admin ids are not secret (they are just UUIDs), so allow read — this lets the
-- RLS policies below and the app check admin status. There is deliberately NO
-- insert/update/delete policy: only the Supabase service role (this SQL editor /
-- the service key) can add or remove admins, so a user can never promote itself.
drop policy if exists "admins_read" on public.admins;
create policy "admins_read" on public.admins
  for select
  using (true);

-- Seed the founder as the admin (admin@lmrcapitals.com).
insert into public.admins (user_id)
values ('05fac964-001e-49d3-bf50-bcf0f31eb96d')
on conflict (user_id) do nothing;

-- 2) PUBLIC LANDING DATA = ADMIN-OWNED ONLY ───────────────────────────────────
-- Replaces the old "any is_public row" policy. Anonymous landing visitors may
-- read a public achievement ONLY if its owner is an admin.
drop policy if exists "public_achievements_read" on public.lmr_achievements;
create policy "public_achievements_read" on public.lmr_achievements
  for select
  using (
    is_public = true
    and user_id in (select user_id from public.admins)
  );

-- 3) ADMIN-ONLY PUBLISH ───────────────────────────────────────────────────────
-- Every user still fully manages their OWN achievements, but only an admin may
-- set is_public = true. Non-admins can create/edit/delete their achievements as
-- long as the row stays private (is_public = false).
drop policy if exists "own_achievements_all" on public.lmr_achievements;
create policy "own_achievements_all" on public.lmr_achievements
  for all
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and (
      is_public = false
      or auth.uid() in (select user_id from public.admins)
    )
  );

-- 4) ADVISOR CLEANUP ──────────────────────────────────────────────────────────
-- rls_auto_enable() is an event-trigger helper (auto-enables RLS on new public
-- tables). It should never be called directly via the REST RPC endpoint, so
-- revoke EXECUTE from the anon/authenticated API roles. The event trigger itself
-- keeps working (event triggers run regardless of these grants).
revoke execute on function public.rls_auto_enable() from anon, authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- NOT SQL — do this in the dashboard too:
--   Authentication → Providers → Email → enable "Leaked password protection"
--   (checks new passwords against HaveIBeenPwned). Clears the last advisor WARN.
--
-- To add another admin later:
--   insert into public.admins (user_id) values ('<their-auth-uid>');
-- ─────────────────────────────────────────────────────────────────────────────
