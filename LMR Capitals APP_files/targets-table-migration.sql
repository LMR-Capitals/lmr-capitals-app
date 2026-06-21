-- ─────────────────────────────────────────────────────────────────────────────
-- LMR Capitals — Achievement Timeline (Milestones)
--
-- `targets` stores user-created GOALS (kind='goal'). Certificates are derived
-- live in the app from your real funded accounts + payout transactions, so they
-- are NOT stored here. Run in Supabase → SQL Editor when ready to sync goals
-- across devices; until then goals are stored locally in the browser.
--
-- ids are text (app-generated, e.g. 'g1718...') to match the rest of the app.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.targets (
  id            text primary key,
  user_id       uuid not null references auth.users(id) on delete cascade,
  kind          text not null default 'goal',            -- 'goal' | 'certificate'
  category      text,                                     -- 'account' | 'performance'
  title         text not null,
  subtitle      text,
  unit          text,
  target_value  numeric,
  current_value numeric not null default 0,
  target_date   date,
  date_achieved date,
  details       text,
  source        text default 'manual',                    -- 'manual' | 'system'
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create index if not exists targets_user_idx on public.targets(user_id);

alter table public.targets enable row level security;
drop policy if exists "own targets" on public.targets;
create policy "own targets" on public.targets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Audit trail of progress / adjustments for the timeline
create table if not exists public.target_events (
  id         uuid primary key default gen_random_uuid(),
  target_id  text references public.targets(id) on delete cascade,
  event_type text check (event_type in ('created','progress_update','achieved','adjusted')) not null,
  value      numeric,
  note       text,
  created_at timestamptz default now()
);

alter table public.target_events enable row level security;
drop policy if exists "own target events" on public.target_events;
create policy "own target events" on public.target_events
  for all using (auth.uid() = (select user_id from public.targets where targets.id = target_id));
