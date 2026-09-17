-- ─────────────────────────────────────────────────────────────────────────────
-- LMR Capitals — Per-transaction receipt image storage (no duplication)
--
-- Each transaction (Deposit / Withdrawal / Payout) gets its OWN receipt image,
-- stored as a base64 data URL on its own row. The app already loads every column
-- (`select *`), so once this column exists, images load from Supabase per-row.
--
-- Run in Supabase → SQL Editor. Safe to re-run.
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.transactions add column if not exists image text;
