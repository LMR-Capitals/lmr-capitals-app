-- ============================================================
-- LMR Capitals — migration for the new design
-- Reconciled against the ACTUAL live schema (22 tables).
-- Additive + idempotent. Nothing dropped, renamed, or truncated.
-- ============================================================
--
-- Your existing tables already cover almost everything:
--   accounts, trades, daily, weekly, monthly, transactions,
--   journal, notes, lmr_observations, lmr_achievements,
--   lmr_ach_suppressions, lmr_psychology, lmr_terminology,
--   ai_chats, weekly_reports, profiles, targets, target_events,
--   copier_config, subscriptions, admins, comp_access
--
-- This migration only adds what the new design needs on top.
-- ============================================================

create extension if not exists "pgcrypto";

-- ============================================================
-- 1. DAILY — new Chain fields
--    Existing: bias, weekly, htf_poi, week_draws, london, ny,
--              asian_range(jsonb), session, rth, plan, pred,
--              monthly_bias, price(jsonb), day_status
-- ============================================================
alter table public.daily add column if not exists premarket text;
alter table public.daily add column if not exists london_killzone text;
alter table public.daily add column if not exists asian_single text;
alter table public.daily add column if not exists pd_array text;
alter table public.daily add column if not exists review_notes text;
alter table public.daily add column if not exists img_daily text;
alter table public.daily add column if not exists img_4h1h text;
alter table public.daily add column if not exists img_15m text;
alter table public.daily add column if not exists img_im text;
alter table public.daily add column if not exists img_summary text;
alter table public.daily add column if not exists updated_at timestamptz default now();

create index if not exists daily_user_date_idx on public.daily(user_id, date desc);
create index if not exists daily_weekly_key_idx on public.daily(user_id, weekly_key);

-- ============================================================
-- 2. TRADES — new design fields
--    Existing: position, session, time_period, models, confirmations,
--              emotions, phases, mmm, movement, tframes, rth, htf,
--              pnl, risk, lots, draws, feedback, rr, win, locked,
--              open_time, close_time
-- ============================================================
alter table public.trades add column if not exists pd_array text;
alter table public.trades add column if not exists refs jsonb default '[]'::jsonb;
alter table public.trades add column if not exists plan_followed boolean;
alter table public.trades add column if not exists grade text;
alter table public.trades add column if not exists img_entry text;
alter table public.trades add column if not exists img_exit text;
alter table public.trades add column if not exists created_at timestamptz default now();

create index if not exists trades_user_date_idx on public.trades(user_id, date desc);
create index if not exists trades_account_idx on public.trades(account_id);

-- ============================================================
-- 3. WEEKLY / MONTHLY — timestamps
--    Both already store everything else in `data` jsonb,
--    so key levels / model / phase need NO schema change.
-- ============================================================
alter table public.weekly  add column if not exists saved_at timestamptz default now();
alter table public.monthly add column if not exists saved_at timestamptz default now();

create index if not exists weekly_user_idx  on public.weekly(user_id, week_key);
create index if not exists monthly_user_idx on public.monthly(user_id, key);

-- ============================================================
-- 4. TRANSACTIONS — receipt + currency
--    Existing: type, amount, note, status, tx_id, image
-- ============================================================
alter table public.transactions add column if not exists currency text default 'USD';
alter table public.transactions add column if not exists method text;
alter table public.transactions add column if not exists receipt_key text;
alter table public.transactions add column if not exists created_at timestamptz default now();

create index if not exists tx_user_date_idx on public.transactions(user_id, date desc);
create index if not exists tx_account_idx   on public.transactions(account_id);
create index if not exists tx_type_idx      on public.transactions(user_id, type);

-- ============================================================
-- 5. PD ARRAY COMMITMENT LOG  — NEW
--    Hard-block enforcement audit trail.
-- ============================================================
create table if not exists public.pd_switches (
  id          text primary key default gen_random_uuid()::text,
  user_id     uuid not null references auth.users(id) on delete cascade,
  date        date not null,
  from_array  text,
  to_array    text not null,
  reason      text,
  switched_at timestamptz default now()
);
create index if not exists pd_switches_user_date_idx on public.pd_switches(user_id, date desc);

-- ============================================================
-- 6. CHART IMAGES  — NEW
--    Storage paths only. Never base64 in a column.
-- ============================================================
create table if not exists public.chart_images (
  id          text primary key default gen_random_uuid()::text,
  user_id     uuid not null references auth.users(id) on delete cascade,
  slot_id     text not null,          -- e.g. today-2026-08-24-15m
  scope       text,                   -- daily | trade | journal | monthly | weekly
  ref_id      text,                   -- owning row's id or date
  storage_key text not null,
  width       integer,
  height      integer,
  created_at  timestamptz default now(),
  unique (user_id, slot_id)
);
create index if not exists chart_images_scope_idx on public.chart_images(user_id, scope, ref_id);

-- ============================================================
-- 7. REPORTS
--    You already have `weekly_reports`. The new design's
--    Performance review is period-agnostic, so widen it
--    rather than create a second table.
-- ============================================================
alter table public.weekly_reports add column if not exists kind text default 'weekly';
alter table public.weekly_reports add column if not exists subtitle text;
alter table public.weekly_reports add column if not exists updated_at timestamptz default now();

create index if not exists weekly_reports_user_idx on public.weekly_reports(user_id, created_at desc);

-- ============================================================
-- 8. PSYCHOLOGY
--    `lmr_psychology` is already (user_id, data jsonb).
--    The new rule-based scoring fits inside `data`. No change.
-- ============================================================

-- ============================================================
-- 9. SETTINGS
--    `profiles` already holds everything (settings jsonb,
--    current_acc, day_count_start, theme, balance_format...).
--    Add only what the new design introduced.
-- ============================================================
alter table public.profiles add column if not exists discord_webhook text;
alter table public.profiles add column if not exists pd_hard_block boolean default true;
alter table public.profiles add column if not exists density text default 'comfortable';

-- ============================================================
-- 10. NOTES — new design allows tagging
-- ============================================================
alter table public.notes add column if not exists tags jsonb default '[]'::jsonb;
alter table public.notes add column if not exists updated_at timestamptz default now();

-- ============================================================
-- 11. OBSERVATIONS — Discord post state
-- ============================================================
alter table public.lmr_observations add column if not exists img_key text;
alter table public.lmr_observations add column if not exists posted_to_discord boolean default false;

-- ============================================================
-- RLS on the two NEW tables (matching your existing pattern)
-- ============================================================
alter table public.pd_switches  enable row level security;
alter table public.chart_images enable row level security;

drop policy if exists pd_switches_owner on public.pd_switches;
create policy pd_switches_owner on public.pd_switches
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists chart_images_owner on public.chart_images;
create policy chart_images_owner on public.chart_images
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- updated_at triggers for tables that gained the column
-- ============================================================
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

do $$
declare t text;
begin
  foreach t in array array['daily','notes','weekly_reports'] loop
    if exists (
      select 1 from information_schema.columns
      where table_schema='public' and table_name=t and column_name='updated_at'
    ) then
      execute format('drop trigger if exists %I on public.%I', t||'_touch', t);
      execute format(
        'create trigger %I before update on public.%I
         for each row execute function public.touch_updated_at()', t||'_touch', t);
    end if;
  end loop;
end $$;

-- ============================================================
-- Storage bucket for chart images / receipts
-- ============================================================
insert into storage.buckets (id, name, public)
values ('lmr-images', 'lmr-images', false)
on conflict (id) do nothing;

drop policy if exists "lmr_images_owner" on storage.objects;
create policy "lmr_images_owner" on storage.objects
  for all using (
    bucket_id = 'lmr-images' and (storage.foldername(name))[1] = auth.uid()::text
  ) with check (
    bucket_id = 'lmr-images' and (storage.foldername(name))[1] = auth.uid()::text
  );
