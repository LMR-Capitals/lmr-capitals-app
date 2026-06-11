-- LMR Capitals — Supabase Schema
-- Run this ONCE in your Supabase project → SQL Editor → New query
-- ⚠️  Execute all at once (select all, Run)

-- ── TABLES ──────────────────────────────────────────────────────────────────────

create table if not exists public.trades (
  id          text primary key,
  user_id     uuid references auth.users not null default auth.uid(),
  notion_id   text,
  account_id  text,
  date        date,
  day_count   int,
  market      text,
  position    text,
  day         text,
  month       text,
  session     text,
  time_period text,
  models          jsonb default '[]',
  confirmations   jsonb default '[]',
  emotions        jsonb default '[]',
  phases          jsonb default '[]',
  mmm             jsonb default '[]',
  movement        jsonb default '[]',
  tframes         jsonb default '[]',
  rth         text,
  htf         text,
  pnl         numeric,
  risk        numeric,
  lots        numeric,
  draws       text,
  feedback    text,
  rr          numeric,
  win         boolean,
  locked      boolean default false,
  updated_at  timestamptz default now()
);

create table if not exists public.daily (
  date          date not null,
  user_id       uuid references auth.users not null default auth.uid(),
  notion_id     text,
  day_count     int,
  name          text,
  bias          text,
  weekly        text,
  htf_poi       text,
  week_draws    text,
  london        text,
  ny            text,
  asian_range   jsonb default '[]',
  session       text,
  rth           text,
  plan          text,
  pred          text,
  monthly_bias  text,
  day_status    text,
  price         jsonb default '[]',
  saved_at      timestamptz default now(),
  primary key (date, user_id)
);

create table if not exists public.monthly (
  key       text not null,
  user_id   uuid references auth.users not null default auth.uid(),
  notion_id text,
  data      jsonb default '{}',
  primary key (key, user_id)
);

create table if not exists public.weekly (
  week_key  text not null,
  user_id   uuid references auth.users not null default auth.uid(),
  notion_id text,
  data      jsonb default '{}',
  primary key (week_key, user_id)
);

create table if not exists public.accounts (
  id          text primary key,
  user_id     uuid references auth.users not null default auth.uid(),
  notion_id   text,
  name        text,
  type        text,
  status      text,
  date        date,
  deposit     numeric
);

create table if not exists public.transactions (
  id          text primary key,
  user_id     uuid references auth.users not null default auth.uid(),
  notion_id   text,
  account_id  text,
  date        date,
  type        text,
  amount      numeric,
  note        text,
  status      text,
  tx_id       text,
  updated_at  timestamptz default now()
);

create table if not exists public.notes (
  id          text primary key,
  user_id     uuid references auth.users not null default auth.uid(),
  notion_id   text,
  title       text,
  text        text,
  date        date,
  created_at  timestamptz default now()
);

create table if not exists public.journal (
  id          text primary key,
  user_id     uuid references auth.users not null default auth.uid(),
  date        date,
  title       text,
  content     text,
  mood        text,
  created_at  timestamptz default now()
);

-- ── ROW LEVEL SECURITY ───────────────────────────────────────────────────────────
-- Each user can only read/write their own rows

alter table public.trades       enable row level security;
alter table public.daily        enable row level security;
alter table public.monthly      enable row level security;
alter table public.weekly       enable row level security;
alter table public.accounts     enable row level security;
alter table public.transactions enable row level security;
alter table public.notes        enable row level security;
alter table public.journal      enable row level security;

create policy "own trades"       on public.trades       for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own daily"        on public.daily        for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own monthly"      on public.monthly      for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own weekly"       on public.weekly       for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own accounts"     on public.accounts     for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own transactions" on public.transactions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own notes"        on public.notes        for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own journal"      on public.journal      for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
