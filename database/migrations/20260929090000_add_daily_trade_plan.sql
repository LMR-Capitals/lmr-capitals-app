-- The Today-chain "Trade Plan" (ch-tradeplan) is now shown and editable on the Daily
-- page's day view. Give it a home so it syncs across devices like the other chain fields.
-- Additive, nullable, safe.
alter table public.daily add column if not exists trade_plan text;  -- Today-chain trade plan / thesis
