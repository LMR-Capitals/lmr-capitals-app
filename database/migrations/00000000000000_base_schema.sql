-- ============================================================================
-- BASE SCHEMA (baseline migration)
--
-- Why this file exists: the original 19 tables were created directly in the
-- Supabase dashboard, never as repo migrations. So when Supabase branching
-- rebuilt a fresh branch from supabase/migrations/, it only had the later
-- change-migrations — which reference tables like `public.monthly` that didn't
-- exist yet — and failed (MIGRATIONS_FAILED). This baseline creates everything
-- that pre-dates the change-migrations so branches build cleanly:
--     00000000000000_base_schema  (this file)
--  -> 20260922090540_create_lmr_terminology_psychology_tables
--  -> 20260922091303_create_copier_config_table
--  -> 20260922110518_harden_dump_all_data_and_is_entitled
--
-- It is fully IDEMPOTENT (create ... if not exists / drop policy if exists +
-- create / create or replace / guarded event trigger), so it is a no-op if it
-- ever runs against main (which already has this schema). Functions are written
-- in their CURRENT (hardened) form so re-running this never regresses main's
-- security posture. The three tables added by the change-migrations
-- (lmr_terminology, lmr_psychology, copier_config) are intentionally NOT here.
--
-- auth.users lives in Supabase's managed `auth` schema and is not created here.
-- ============================================================================

-- ─────────────────────────────────────────────────────────────────────────
-- TABLES (+ enable RLS)
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.accounts (
  id text primary key, user_id uuid not null default auth.uid(), notion_id text,
  name text, type text, status text, date date, deposit numeric, plan text,
  firm text, firm_id text, account_no text, size numeric, start_date date,
  blown_at date, dd_limit numeric, eval_target numeric, dd_type text,
  split numeric, is_live boolean default false, payout_rule text, copier jsonb,
  rules jsonb, funded_spawned boolean default false, updated_at timestamptz default now()
);
alter table public.accounts enable row level security;

create table if not exists public.admins (
  user_id uuid primary key, added_at timestamptz not null default now()
);
alter table public.admins enable row level security;

create table if not exists public.ai_chats (
  id text primary key, user_id uuid not null default auth.uid(), title text,
  messages jsonb default '[]'::jsonb, session_date date default current_date,
  created_at timestamptz default now(), updated_at timestamptz default now()
);
alter table public.ai_chats enable row level security;

create table if not exists public.comp_access (
  user_id uuid primary key, granted_by uuid, note text,
  granted_at timestamptz not null default now()
);
alter table public.comp_access enable row level security;

create table if not exists public.daily (
  date date not null, user_id uuid not null default auth.uid(), notion_id text,
  day_count integer, name text, bias text, weekly text, htf_poi text,
  week_draws text, london text, ny text, asian_range jsonb default '[]'::jsonb,
  session text, rth text, plan text, pred text, monthly_bias text,
  price jsonb default '[]'::jsonb, saved_at timestamptz default now(),
  weekly_key text, day_status text,
  primary key (date, user_id)
);
alter table public.daily enable row level security;

create table if not exists public.journal (
  id text primary key, user_id uuid not null default auth.uid(), date date,
  title text, content text, mood text, created_at timestamptz default now(),
  type text, text text, img_key text, updated_at timestamptz default now()
);
alter table public.journal enable row level security;

create table if not exists public.lmr_ach_suppressions (
  id text not null, user_id uuid not null, created_at timestamptz default now(),
  primary key (id, user_id)
);
alter table public.lmr_ach_suppressions enable row level security;

create table if not exists public.lmr_achievements (
  id text primary key, user_id uuid not null, title text, category text,
  firm text, amount numeric, achieved_on date, caption text, image text,
  is_public boolean default false, created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.lmr_achievements enable row level security;

create table if not exists public.lmr_observations (
  id text primary key default (gen_random_uuid())::text, user_id uuid,
  title text, content text, created_at timestamptz default now(),
  updated_at timestamptz default now(), session_tag text
);
alter table public.lmr_observations enable row level security;

create table if not exists public.monthly (
  key text not null, user_id uuid not null default auth.uid(), notion_id text,
  data jsonb default '{}'::jsonb,
  primary key (key, user_id)
);
alter table public.monthly enable row level security;

create table if not exists public.notes (
  id text primary key, user_id uuid not null default auth.uid(), notion_id text,
  title text, text text, date date, created_at timestamptz default now()
);
alter table public.notes enable row level security;

create table if not exists public.profiles (
  user_id uuid primary key, name text, email text, role text, business text,
  website text, photo_b64 text, daily_goal numeric default 0,
  monthly_goal numeric default 0, max_loss numeric default 0,
  max_dd numeric default 0, risk_default numeric default 0,
  account_size numeric default 0, remind_chain text, remind_weekly text,
  theme text default 'navy-gold'::text, day_count_start integer default 1,
  day_count_start_date text, balance_format text default 'total'::text,
  current_acc text, cal_month text, settings jsonb default '{}'::jsonb,
  updated_at timestamptz default now()
);
alter table public.profiles enable row level security;

create table if not exists public.subscriptions (
  user_id uuid primary key, stripe_customer_id text, stripe_subscription_id text,
  status text, price_id text, current_period_end timestamptz,
  cancel_at_period_end boolean default false,
  updated_at timestamptz not null default now()
);
alter table public.subscriptions enable row level security;

create table if not exists public.target_events (
  id uuid primary key default gen_random_uuid(), target_id text,
  event_type text not null, value numeric, note text,
  created_at timestamptz default now()
);
alter table public.target_events enable row level security;

create table if not exists public.targets (
  id text primary key, user_id uuid not null, kind text not null default 'goal'::text,
  category text, title text not null, subtitle text, unit text,
  target_value numeric, current_value numeric not null default 0,
  target_date date, date_achieved date, details text,
  source text default 'manual'::text, created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.targets enable row level security;

create table if not exists public.trades (
  id text primary key, user_id uuid not null default auth.uid(), notion_id text,
  account_id text, date date, day_count integer, market text, position text,
  day text, month text, session text, time_period text,
  models jsonb default '[]'::jsonb, confirmations jsonb default '[]'::jsonb,
  emotions jsonb default '[]'::jsonb, phases jsonb default '[]'::jsonb,
  mmm jsonb default '[]'::jsonb, movement jsonb default '[]'::jsonb,
  tframes jsonb default '[]'::jsonb, rth text, htf text, pnl numeric,
  risk numeric, lots numeric, draws text, feedback text, rr numeric,
  win boolean, locked boolean default false, updated_at timestamptz default now(),
  open_time text, close_time text
);
alter table public.trades enable row level security;

create table if not exists public.transactions (
  id text primary key, user_id uuid not null default auth.uid(), notion_id text,
  account_id text, date date, type text, amount numeric, note text, status text,
  tx_id text, updated_at timestamptz default now(), image text
);
alter table public.transactions enable row level security;

create table if not exists public.weekly (
  week_key text not null, user_id uuid not null default auth.uid(),
  notion_id text, data jsonb default '{}'::jsonb, monthly_key text,
  primary key (week_key, user_id)
);
alter table public.weekly enable row level security;

create table if not exists public.weekly_reports (
  id text primary key default (gen_random_uuid())::text,
  user_id uuid not null default auth.uid(), week_start date, week_end date,
  title text, content text, metrics jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);
alter table public.weekly_reports enable row level security;

-- ─────────────────────────────────────────────────────────────────────────
-- POLICIES (drop-if-exists + create → idempotent; faithful to live main,
-- including the legacy duplicate "own …" pairs)
-- ─────────────────────────────────────────────────────────────────────────
drop policy if exists "own accounts" on public.accounts;
create policy "own accounts" on public.accounts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "own rows accounts" on public.accounts;
create policy "own rows accounts" on public.accounts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "admins_read" on public.admins;
create policy "admins_read" on public.admins for select using (true);

drop policy if exists "own ai_chats" on public.ai_chats;
create policy "own ai_chats" on public.ai_chats for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own_comp_read" on public.comp_access;
create policy "own_comp_read" on public.comp_access for select using (auth.uid() = user_id);

drop policy if exists "own daily" on public.daily;
create policy "own daily" on public.daily for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "own rows daily" on public.daily;
create policy "own rows daily" on public.daily for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own journal" on public.journal;
create policy "own journal" on public.journal for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own_ach_suppressions_all" on public.lmr_ach_suppressions;
create policy "own_ach_suppressions_all" on public.lmr_ach_suppressions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own_achievements_all" on public.lmr_achievements;
create policy "own_achievements_all" on public.lmr_achievements for all
  using (auth.uid() = user_id)
  with check ((auth.uid() = user_id) and ((is_public = false) or (auth.uid() in (select admins.user_id from admins))));
drop policy if exists "public_achievements_read" on public.lmr_achievements;
create policy "public_achievements_read" on public.lmr_achievements for select
  using ((is_public = true) and (user_id in (select admins.user_id from admins)));

drop policy if exists "own lmr_observations" on public.lmr_observations;
create policy "own lmr_observations" on public.lmr_observations for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own monthly" on public.monthly;
create policy "own monthly" on public.monthly for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "own rows monthly" on public.monthly;
create policy "own rows monthly" on public.monthly for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own notes" on public.notes;
create policy "own notes" on public.notes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "own rows notes" on public.notes;
create policy "own rows notes" on public.notes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own_subscription_read" on public.subscriptions;
create policy "own_subscription_read" on public.subscriptions for select using (auth.uid() = user_id);

drop policy if exists "own target events" on public.target_events;
create policy "own target events" on public.target_events for all
  using (auth.uid() = (select targets.user_id from targets where targets.id = target_events.target_id));

drop policy if exists "own targets" on public.targets;
create policy "own targets" on public.targets for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own trades" on public.trades;
create policy "own trades" on public.trades for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "own rows trades" on public.trades;
create policy "own rows trades" on public.trades for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own transactions" on public.transactions;
create policy "own transactions" on public.transactions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "own rows transactions" on public.transactions;
create policy "own rows transactions" on public.transactions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own weekly" on public.weekly;
create policy "own weekly" on public.weekly for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "own rows weekly" on public.weekly;
create policy "own rows weekly" on public.weekly for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own weekly_reports" on public.weekly_reports;
create policy "own weekly_reports" on public.weekly_reports for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────
-- FUNCTIONS (current/hardened form — create or replace = idempotent)
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path to 'public'
as $$ select exists (select 1 from public.admins where user_id = auth.uid()); $$;

create or replace function public.is_entitled(uid uuid)
returns boolean language sql stable set search_path to 'public'
as $$
  select exists (select 1 from public.admins       a where a.user_id = uid)
      or exists (select 1 from public.comp_access   c where c.user_id = uid)
      or exists (select 1 from public.subscriptions s where s.user_id = uid and s.status in ('active','trialing'));
$$;

create or replace function public.admin_add_admin(target_email text)
returns text language plpgsql security definer set search_path to 'public'
as $$
declare tid uuid;
begin
  if not exists (select 1 from public.admins where user_id = auth.uid()) then raise exception 'not authorized'; end if;
  select id into tid from auth.users where lower(email) = lower(trim(target_email)) limit 1;
  if tid is null then raise exception 'No account exists for that email yet — they must sign up first.'; end if;
  insert into public.admins(user_id) values (tid) on conflict (user_id) do nothing;
  return tid::text;
end; $$;

create or replace function public.admin_remove_admin(target uuid)
returns void language plpgsql security definer set search_path to 'public'
as $$
begin
  if not exists (select 1 from public.admins where user_id = auth.uid()) then raise exception 'not authorized'; end if;
  if target = auth.uid() then raise exception 'You cannot remove your own admin access.'; end if;
  if (select count(*) from public.admins) <= 1 then raise exception 'Cannot remove the last remaining admin.'; end if;
  delete from public.admins where user_id = target;
end; $$;

create or replace function public.admin_list_admins()
returns table(user_id uuid, email text, added_at timestamptz)
language plpgsql security definer set search_path to 'public'
as $$
begin
  if not exists (select 1 from public.admins a where a.user_id = auth.uid()) then raise exception 'not authorized'; end if;
  return query select a.user_id, u.email::text, a.added_at
    from public.admins a join auth.users u on u.id = a.user_id order by a.added_at;
end; $$;

create or replace function public.admin_list_users(search text default ''::text)
returns table(user_id uuid, email text, entitled boolean, comp boolean, sub_status text, joined timestamptz)
language plpgsql security definer set search_path to 'public'
as $$
begin
  if not exists (select 1 from public.admins a where a.user_id = auth.uid()) then raise exception 'not authorized'; end if;
  return query
    select u.id, u.email::text, public.is_entitled(u.id),
           exists (select 1 from public.comp_access c where c.user_id = u.id),
           (select s.status from public.subscriptions s where s.user_id = u.id),
           u.created_at
    from auth.users u
    where search = '' or u.email ilike '%' || search || '%'
    order by u.created_at desc limit 50;
end; $$;

create or replace function public.admin_list_subscriptions(search text default ''::text)
returns table(user_id uuid, email text, status text, price_id text, plan text,
              current_period_end timestamptz, cancel_at_period_end boolean,
              stripe_subscription_id text, updated_at timestamptz)
language plpgsql security definer set search_path to 'public'
as $$
begin
  if not exists (select 1 from public.admins a where a.user_id = auth.uid()) then raise exception 'not authorized'; end if;
  return query
    select s.user_id, u.email::text, s.status, s.price_id,
      case when s.price_id = 'price_1UEPLOBgi40jMsdm6LlsT3Hr' then 'Yearly'
           when s.price_id = 'price_1UEPM2Bgi40jMsdmzaWUy7Vg' then 'Monthly'
           else coalesce(s.price_id, '—') end as plan,
      s.current_period_end, s.cancel_at_period_end, s.stripe_subscription_id, s.updated_at
    from public.subscriptions s join auth.users u on u.id = s.user_id
    where search = '' or u.email ilike '%' || search || '%'
    order by s.updated_at desc limit 200;
end; $$;

create or replace function public.admin_metrics()
returns table(total_users bigint, active bigint, trialing bigint, comp bigint,
              past_due bigint, canceled bigint, mrr_cents bigint)
language plpgsql security definer set search_path to 'public'
as $$
begin
  if not exists (select 1 from public.admins where user_id = auth.uid()) then raise exception 'not authorized'; end if;
  return query select
    (select count(*) from auth.users),
    (select count(*) from public.subscriptions where status = 'active'),
    (select count(*) from public.subscriptions where status = 'trialing'),
    (select count(*) from public.comp_access),
    (select count(*) from public.subscriptions where status = 'past_due'),
    (select count(*) from public.subscriptions where status = 'canceled'),
    (select coalesce(sum(case when price_id = 'price_1UEPM2Bgi40jMsdmzaWUy7Vg' then 2500
                              when price_id = 'price_1UEPLOBgi40jMsdm6LlsT3Hr' then 2250
                              else 0 end), 0)
     from public.subscriptions where status in ('active', 'trialing'));
end; $$;

create or replace function public.admin_grant_comp(target uuid, note text default null::text)
returns void language plpgsql security definer set search_path to 'public'
as $$
begin
  if not exists (select 1 from public.admins where user_id = auth.uid()) then raise exception 'not authorized'; end if;
  insert into public.comp_access (user_id, granted_by, note)
  values (target, auth.uid(), note)
  on conflict (user_id) do update set granted_by = excluded.granted_by, note = excluded.note, granted_at = now();
end; $$;

create or replace function public.admin_revoke_comp(target uuid)
returns void language plpgsql security definer set search_path to 'public'
as $$
begin
  if not exists (select 1 from public.admins where user_id = auth.uid()) then raise exception 'not authorized'; end if;
  delete from public.comp_access where user_id = target;
end; $$;

-- Hardened (guard + fixed search_path + not anon/public-executable).
create or replace function public.dump_all_data()
returns jsonb language plpgsql security definer set search_path to 'public'
as $$
declare t record; result jsonb := '{}'::jsonb; rows jsonb;
begin
  if not exists (select 1 from public.admins where user_id = auth.uid()) then raise exception 'not authorized'; end if;
  for t in select tablename from pg_tables where schemaname = 'public' order by tablename loop
    execute format('select coalesce(jsonb_agg(row_to_json(x)), ''[]''::jsonb) from public.%I x', t.tablename) into rows;
    result := result || jsonb_build_object(t.tablename, rows);
  end loop;
  return result;
end $$;
revoke execute on function public.dump_all_data() from public;
revoke execute on function public.dump_all_data() from anon;
grant  execute on function public.dump_all_data() to authenticated;

-- Event-trigger function: auto-enable RLS on any new public table.
create or replace function public.rls_auto_enable()
returns event_trigger language plpgsql security definer set search_path to 'pg_catalog'
as $$
declare cmd record;
begin
  for cmd in
    select * from pg_event_trigger_ddl_commands()
    where command_tag in ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      and object_type in ('table','partitioned table')
  loop
    if cmd.schema_name is not null and cmd.schema_name in ('public')
       and cmd.schema_name not in ('pg_catalog','information_schema')
       and cmd.schema_name not like 'pg_toast%' and cmd.schema_name not like 'pg_temp%' then
      begin
        execute format('alter table if exists %s enable row level security', cmd.object_identity);
        raise log 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      exception when others then
        raise log 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      end;
    else
      raise log 'rls_auto_enable: skip % (system schema or not enforced: %.)', cmd.object_identity, cmd.schema_name;
    end if;
  end loop;
end; $$;

-- ─────────────────────────────────────────────────────────────────────────
-- EVENT TRIGGER (guarded — create only if absent)
-- ─────────────────────────────────────────────────────────────────────────
do $$ begin
  if not exists (select 1 from pg_event_trigger where evtname = 'rls_auto_enable') then
    create event trigger rls_auto_enable
      on ddl_command_end
      when tag in ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      execute function public.rls_auto_enable();
  end if;
end $$;
