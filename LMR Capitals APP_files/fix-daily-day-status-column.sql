-- ─────────────────────────────────────────────────────────────────────────────
-- Fix: "Status" (Passed / In Process / Blown) field on the Daily Chain /
-- Daily day-modal was being silently dropped on every cloud sync, because the
-- public.daily table had no column to store it. The app's _mapDaily() never
-- sent it (no column = upsert error), and _sbDoPull() never read it back —
-- so after any reload/pull, the Status chip reset to blank even though it had
-- been saved locally and "Saved HH:MM:SS" was shown.
--
-- HOW TO RUN
-- Open the Supabase dashboard for this project → SQL Editor → paste this
-- entire file → Run. Safe to run multiple times (IF NOT EXISTS).
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.daily add column if not exists day_status text;
