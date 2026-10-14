-- Trade modal overhaul: new "Trading Models" field (Turtle Soup, Unicorn, Venom, AMD, OTE),
-- separate from the existing entry-drill stored in `models`. jsonb to match models/confirmations/
-- phases/refs. Additive and nullable — existing trade rows are untouched.
alter table public.trades
  add column if not exists trade_models jsonb default '[]'::jsonb;
