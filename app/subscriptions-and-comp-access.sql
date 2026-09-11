-- ─────────────────────────────────────────────────────────────────────────────
-- LMR Capitals — Subscriptions + comp (free) access foundation
--
-- Layer 1 of the paywall. SAFE / ADDITIVE: creates tables + helper functions but
-- does NOT yet gate any data. The actual lockdown (RLS on data tables) is a
-- separate later migration, flipped only once Stripe is live.
--
-- Entitlement = admin  OR  active/trialing Stripe subscription  OR  comp access.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1) SUBSCRIPTIONS (Stripe-driven; written ONLY by the webhook via service role) ─
create table if not exists public.subscriptions (
  user_id                uuid primary key references auth.users(id) on delete cascade,
  stripe_customer_id     text,
  stripe_subscription_id text,
  status                 text,          -- active | trialing | past_due | canceled | incomplete | unpaid
  price_id               text,
  current_period_end     timestamptz,
  cancel_at_period_end   boolean default false,
  updated_at             timestamptz not null default now()
);
alter table public.subscriptions enable row level security;

-- A user may read their OWN subscription. No write policy => only the service
-- role (the Stripe webhook function) can insert/update it. Users can never fake
-- a subscription by writing this table.
drop policy if exists "own_subscription_read" on public.subscriptions;
create policy "own_subscription_read" on public.subscriptions
  for select using (auth.uid() = user_id);

-- 2) COMP ACCESS (admin-granted free passes) ──────────────────────────────────
create table if not exists public.comp_access (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  granted_by  uuid references auth.users(id),
  note        text,
  granted_at  timestamptz not null default now()
);
alter table public.comp_access enable row level security;

-- A user may read their own comp status. Writes go only through the admin
-- functions below (no direct write policy).
drop policy if exists "own_comp_read" on public.comp_access;
create policy "own_comp_read" on public.comp_access
  for select using (auth.uid() = user_id);

-- 3) ENTITLEMENT CHECK ────────────────────────────────────────────────────────
-- SECURITY INVOKER (default): it only reads rows the calling user is already
-- allowed to see (their own subscription/comp, plus the readable admins table),
-- so it needs no elevated privilege and raises no advisor warning.
create or replace function public.is_entitled(uid uuid)
returns boolean
language sql
stable
as $$
  select
    exists (select 1 from public.admins       a where a.user_id = uid)
    or exists (select 1 from public.comp_access c where c.user_id = uid)
    or exists (select 1 from public.subscriptions s
               where s.user_id = uid and s.status in ('active','trialing'));
$$;

-- 4) ADMIN FUNCTIONS (SECURITY DEFINER; each verifies the caller is an admin) ──
-- These intentionally run with elevated rights (to read auth.users / write
-- comp_access) and gate on admin membership internally. The Supabase advisor
-- will list them as "SECURITY DEFINER callable by authenticated" — that is
-- expected and safe here: a non-admin caller gets "not authorized".

-- Search users by email + see their access status (for the admin Users panel).
create or replace function public.admin_list_users(search text default '')
returns table (user_id uuid, email text, entitled boolean, comp boolean, sub_status text, joined timestamptz)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.admins where user_id = auth.uid()) then
    raise exception 'not authorized';
  end if;
  return query
    select u.id,
           u.email::text,
           public.is_entitled(u.id),
           exists (select 1 from public.comp_access c where c.user_id = u.id),
           (select s.status from public.subscriptions s where s.user_id = u.id),
           u.created_at
    from auth.users u
    where search = '' or u.email ilike '%' || search || '%'
    order by u.created_at desc
    limit 50;
end;
$$;
revoke execute on function public.admin_list_users(text) from public, anon;
grant  execute on function public.admin_list_users(text) to authenticated;

-- Grant free access to a user (one click in the admin panel). Idempotent.
create or replace function public.admin_grant_comp(target uuid, note text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.admins where user_id = auth.uid()) then
    raise exception 'not authorized';
  end if;
  insert into public.comp_access (user_id, granted_by, note)
  values (target, auth.uid(), note)
  on conflict (user_id) do update
    set granted_by = excluded.granted_by, note = excluded.note, granted_at = now();
end;
$$;
revoke execute on function public.admin_grant_comp(uuid, text) from public, anon;
grant  execute on function public.admin_grant_comp(uuid, text) to authenticated;

-- Revoke a user's free access.
create or replace function public.admin_revoke_comp(target uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.admins where user_id = auth.uid()) then
    raise exception 'not authorized';
  end if;
  delete from public.comp_access where user_id = target;
end;
$$;
revoke execute on function public.admin_revoke_comp(uuid) from public, anon;
grant  execute on function public.admin_revoke_comp(uuid) to authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- NOT included here (deliberately): the data-table lockdown. That comes in a
-- later migration that changes each data table's policy to require
-- is_entitled(auth.uid()), applied only after Stripe is verified working.
-- ─────────────────────────────────────────────────────────────────────────────
