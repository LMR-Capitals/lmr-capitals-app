-- LMR Capitals — Broker Fills migration
-- Run this ONCE in your Supabase project → SQL Editor → New query (select all, Run).
--
-- What it does: extends the EXISTING public.trades table so automated broker
-- fills (Tradovate relay / NinjaTrader 8 AddOn → broker-webhook Edge Function)
-- can drop in as *draft* journal entries the user then completes with ICT fields.
--
-- This is an ALTER, never a CREATE — public.trades already exists (see
-- supabase-setup.sql) with the ICT journal shape. We only ADD columns, so it is
-- safe to run on the live table and safe to re-run (every statement is idempotent).

-- ── New columns for broker-sourced fills ──────────────────────────────────────
alter table public.trades add column if not exists broker      text;         -- 'tradovate' | 'ninjatrader'
alter table public.trades add column if not exists symbol      text;         -- e.g. 'NQ', 'ES', 'MNQ'
alter table public.trades add column if not exists direction   text;         -- 'long' | 'short' (from fill side)
alter table public.trades add column if not exists quantity    numeric;      -- contracts filled
alter table public.trades add column if not exists entry_price numeric;      -- fill price
alter table public.trades add column if not exists exit_price  numeric;      -- nullable — set on the closing fill / by the user
alter table public.trades add column if not exists filled_at   timestamptz;  -- broker fill time (ISO 8601)
alter table public.trades add column if not exists order_id    text;         -- broker order id
alter table public.trades add column if not exists fill_id     text;         -- broker fill id (idempotency key)

-- status: DEFAULT is 'confirmed' (NOT 'unconfirmed').
-- Reason: the app upserts normal journal trades WITHOUT a status field, so the
-- column default is what every app-created row gets. Defaulting to 'confirmed'
-- keeps those out of the Pending queue automatically. Only the broker-webhook
-- Edge Function writes status = 'unconfirmed' explicitly, so ONLY real broker
-- drafts show up as pending. (Existing rows also get 'confirmed' when the column
-- is added, which is correct — they are already completed journal entries.)
alter table public.trades add column if not exists status      text default 'confirmed';

-- ── Idempotency: one row per broker fill ──────────────────────────────────────
-- Lets the Edge Function upsert with ON CONFLICT (fill_id) DO NOTHING so a
-- retried/duplicated webhook never creates a second draft. Partial so the many
-- existing manual rows with NULL fill_id are unaffected.
create unique index if not exists trades_fill_id_uidx
  on public.trades (fill_id)
  where fill_id is not null;

-- ── Fast lookup for the Pending Trades panel ─────────────────────────────────
create index if not exists trades_user_status_idx
  on public.trades (user_id, status);

-- ── RLS note ─────────────────────────────────────────────────────────────────
-- No policy changes needed. The existing "own trades" policy
--   (auth.uid() = user_id) already lets each signed-in user read/complete their
-- own unconfirmed drafts. The Edge Function inserts with the SERVICE ROLE key,
-- which bypasses RLS, and sets user_id explicitly from the validated payload.
