-- ─────────────────────────────────────────────────────────────────────────────
-- LMR Capitals — Phase 2: Accounts prop-firm + payout-rules, Transactions firm
--
-- Adds the new fields used by the upgraded Account modal (prop firm, plan, size,
-- live balance, payout rules / trailing drawdown) and the prop-firm tag on
-- transactions. These are stored LOCALLY in the app already; run this (Supabase →
-- SQL Editor) when you're ready to also sync them to the cloud across devices.
--
-- Safe + additive: `add column if not exists` never touches existing data, and the
-- app's current cloud sync keeps working whether or not this has been run.
-- ─────────────────────────────────────────────────────────────────────────────

-- Accounts: prop-firm metadata + payout rules
alter table public.accounts add column if not exists firm    text;
alter table public.accounts add column if not exists plan    text;     -- Growth | Select | Lightning | Other
alter table public.accounts add column if not exists size    numeric;  -- 25000 / 50000 / 100000 / 150000
alter table public.accounts add column if not exists balance numeric;  -- current balance (live tracking)
alter table public.accounts add column if not exists rules   jsonb;    -- {target,dd,dll,minDays,consistency,split}
-- Rolling payout baseline: after each payout the next cycle starts from the post-payout balance
alter table public.accounts add column if not exists payout_baseline      numeric;
alter table public.accounts add column if not exists payout_baseline_date date;

-- Transactions: which prop firm this deposit/withdrawal/payout belongs to
alter table public.transactions add column if not exists firm text;
