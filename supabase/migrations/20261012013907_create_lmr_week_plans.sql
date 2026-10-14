create table if not exists public.lmr_week_plans (
  user_id uuid not null references auth.users(id) on delete cascade,
  week_key text not null,
  week_start date not null,
  week_end date not null,
  title text not null,
  summary text,
  plan jsonb not null default '{}'::jsonb,
  content_md text,
  outcome jsonb,
  outcome_md text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, week_key)
);
create index if not exists lmr_week_plans_user_start on public.lmr_week_plans (user_id, week_start desc);
alter table public.lmr_week_plans enable row level security;
create policy "week plans: owner read" on public.lmr_week_plans for select to authenticated using ((select auth.uid()) = user_id);
create policy "week plans: owner insert" on public.lmr_week_plans for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "week plans: owner update" on public.lmr_week_plans for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
comment on table public.lmr_week_plans is 'LMR weekly trading plan, one row per week (history). The current week is the row whose week_start <= today <= week_end. outcome/outcome_md record what actually happened (filled by the Friday weekly review).';
