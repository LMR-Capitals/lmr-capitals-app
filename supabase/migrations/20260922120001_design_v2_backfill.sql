-- ============================================================
-- LMR Capitals — backfill for the new (v2) design
-- Runs AFTER 20260922120000_design_v2_schema. Idempotent / re-runnable.
-- (The design handoff's backfill.sql also carried manual verification SELECTs
--  — counts, P&L parity, per-account balances, and the four missing_* / bad_
--  price_shape zero-checks. Those are for eyeballing against the live app, not
--  schema state, so they are kept out of this migration; run them by hand from
--  the handoff's backfill.sql when validating a data-bearing environment.)
-- ============================================================

-- 1. Asian range: jsonb array -> single string (first element)
update public.daily set asian_single = asian_range->>0
where asian_single is null and asian_range is not null
  and jsonb_typeof(asian_range) = 'array' and jsonb_array_length(asian_range) > 0;
-- bare-string case
update public.daily set asian_single = asian_range #>> '{}'
where asian_single is null and jsonb_typeof(asian_range) = 'string';

-- 2. London Killzone: merge old `london` into the new field
update public.daily set london_killzone = london
where london_killzone is null and london is not null and london <> '';

-- 3. Premarket: seed from htf_poi
update public.daily set premarket = htf_poi
where premarket is null and htf_poi is not null and htf_poi <> '';

-- 4. PD array: seed from rth when it reads like a PD-array label
update public.daily set pd_array = rth
where pd_array is null and rth is not null
  and (rth ilike '%discount%' or rth ilike '%premium%');

-- 5. Price references must be a jsonb ARRAY — order is meaningful
update public.daily set price = '[]'::jsonb where price is null;
update public.daily
set price = (select coalesce(jsonb_agg(k), '[]'::jsonb) from jsonb_object_keys(price) k)
where jsonb_typeof(price) = 'object';

-- 6. Trades: default new jsonb column + seed pd_array / plan_followed
update public.trades set refs = '[]'::jsonb where refs is null;
update public.trades set pd_array = rth
where pd_array is null and rth is not null
  and (rth ilike '%discount%' or rth ilike '%premium%');
update public.trades set plan_followed = true
where plan_followed is null and feedback ilike '%followed the plan%';

-- 7. Transactions: normalise currency, migrate image -> receipt_key
update public.transactions set currency = 'USD' where currency is null;
update public.transactions set receipt_key = image
where receipt_key is null and image is not null and image <> '';

-- 8. Reports: tag existing rows so the new UI can filter them
update public.weekly_reports set kind = 'weekly' where kind is null;

-- 9. Profiles: defaults for the new settings
update public.profiles set pd_hard_block = true where pd_hard_block is null;
update public.profiles set density = 'comfortable' where density is null;

-- 10. Weekly / Monthly: create empty rows for every period that already has
--     daily data, so the context cards resolve; link weekly back to its month.
insert into public.weekly (user_id, week_key, data)
select distinct user_id, weekly_key, '{}'::jsonb
from public.daily where weekly_key is not null and weekly_key <> ''
on conflict do nothing;

insert into public.monthly (user_id, key, data)
select distinct user_id, to_char(date, 'YYYY-MM'), '{}'::jsonb
from public.daily
on conflict do nothing;

update public.weekly set monthly_key = to_char(week_key::date, 'YYYY-MM')
where monthly_key is null and week_key ~ '^\d{4}-\d{2}-\d{2}$';
