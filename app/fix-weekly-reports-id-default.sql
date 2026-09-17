-- LMR Capitals — fix: weekly_reports.id has no default, so every report insert
-- that doesn't explicitly pass an id fails with:
--   "null value in column "id" of relation "weekly_reports" violates not-null constraint"
-- This is why the Reports panel has always been empty — every save silently failed.
--
-- Run in Supabase → SQL Editor → New query → Run

alter table public.weekly_reports
  alter column id set default gen_random_uuid()::text;
