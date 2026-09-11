-- ─────────────────────────────────────────────────────────────────────────────
-- LMR Capitals — Payout module (Tradeify Select Flex)
--
-- Creates the payouts table for the Request Payout flow + history. Run in
-- Supabase → SQL Editor when ready to sync. Until then payouts are stored
-- locally in the browser (the app falls back gracefully).
--
-- Transactions already support a 'Payout' type + status, so no change needed there.
-- Account tier (size) + payout rules come from accounts-payout-migration.sql.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.payouts (
  id               text primary key,
  user_id          uuid not null references auth.users(id) on delete cascade,
  account_id       text,
  amount_requested numeric,
  split_applied    numeric,          -- e.g. 90 (trader keeps 90%)
  status           text default 'Processing',  -- Processing | Paid | Pending
  method           text,             -- Rise | Bank transfer
  requested_at     timestamptz default now(),
  paid_at          timestamptz
);

create index if not exists payouts_user_idx on public.payouts(user_id);
create index if not exists payouts_account_idx on public.payouts(account_id);

alter table public.payouts enable row level security;

drop policy if exists "own_payouts_all" on public.payouts;
create policy "own_payouts_all" on public.payouts
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
