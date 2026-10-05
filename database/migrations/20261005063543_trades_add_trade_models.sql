-- Capture the `trades.trade_models` column into version control.
-- The column was added directly to the live database (applied migration
-- 20261005063543 "trades_add_trade_models") but never committed here, leaving
-- database/migrations drifted from the deployed schema. This file mirrors the
-- live column exactly so the repo is the source of truth again.
--
-- No app code reads or writes trade_models yet; it is additive, nullable, and
-- defaults to an empty jsonb array, so this is safe and a no-op where the
-- column already exists.
alter table public.trades
  add column if not exists trade_models jsonb default '[]'::jsonb;
