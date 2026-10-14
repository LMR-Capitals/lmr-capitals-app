alter table public.trades add column if not exists trade_models jsonb default '[]'::jsonb;
