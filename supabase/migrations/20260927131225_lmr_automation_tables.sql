
-- One row per checkpoint / review window per trading day
create table if not exists public.lmr_session_chain (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid(),
  trade_date date not null,
  symbol text not null default 'NQ',
  kind text not null default 'checkpoint',        -- 'checkpoint' | 'review'
  checkpoint text not null,                        -- '10:00' or '10:00–11:30'
  window_name text not null,
  win_start text, win_end text,
  o numeric, h numeric, l numeric, c numeric,
  h_time text, l_time text,
  range_pts numeric, close_loc numeric,
  vs_true_open text,
  took text[],
  phase text,
  smt text,
  created_at timestamptz not null default now(),
  unique (user_id, trade_date, symbol, kind, checkpoint)
);
-- Daily / weekly / monthly profile reports
create table if not exists public.lmr_profiles (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid(),
  scope text not null,                             -- 'daily' | 'weekly' | 'monthly'
  period_key text not null,                        -- '2026-09-25' | '2026-W39' | '2026-09'
  period_start date, period_end date,
  summary jsonb,
  report_md text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, scope, period_key)
);
-- The automation's script, so scheduled runs always use the current version
create table if not exists public.lmr_automation_scripts (
  name text primary key,
  user_id uuid not null default auth.uid(),
  version int not null default 1,
  code text not null,
  updated_at timestamptz not null default now()
);
alter table public.lmr_session_chain enable row level security;
alter table public.lmr_profiles enable row level security;
alter table public.lmr_automation_scripts enable row level security;
create policy "own lmr_session_chain" on public.lmr_session_chain for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own lmr_profiles" on public.lmr_profiles for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own lmr_automation_scripts" on public.lmr_automation_scripts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
