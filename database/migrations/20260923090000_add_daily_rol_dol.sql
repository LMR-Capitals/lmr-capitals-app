-- HIGHER-TIMEFRAME CONTEXT grid (design v2) has four fields; the design keys are
-- premarket, weeklyDol, dailyRol, dailyDol. premarket and week_draws already have
-- homes; add columns for the two daily liquidity fields. Additive, nullable, safe.
alter table public.daily add column if not exists daily_rol text;  -- Daily run for liquidity
alter table public.daily add column if not exists daily_dol text;  -- Daily draw on liquidity
