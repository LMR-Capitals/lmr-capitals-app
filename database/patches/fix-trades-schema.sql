-- LMR Capitals — schema fix
-- The app sends `open_time` / `close_time` on every trade push (see _mapTrade in
-- index.html), but the original supabase-setup.sql never created these columns.
-- That mismatch makes Supabase reject the whole `trades` upsert — which is why
-- Force Push errors and trades never reach the cloud.
--
-- Run this ONCE in Supabase → SQL Editor → New query.

alter table public.trades add column if not exists open_time  text;
alter table public.trades add column if not exists close_time text;
