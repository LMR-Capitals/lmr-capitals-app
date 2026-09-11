-- ─────────────────────────────────────────────────────────────────────────────
-- LMR Capitals — Admin web portal RPCs (/admin page)
-- Extends the existing admin functions with: subscribers list, business metrics,
-- and admin-account management. All SECURITY DEFINER + gated on admins membership.
-- ─────────────────────────────────────────────────────────────────────────────

-- Subscribers & billing: every subscription row joined with the user email.
create or replace function public.admin_list_subscriptions(search text default '')
returns table (
  user_id uuid, email text, status text, price_id text, plan text,
  current_period_end timestamptz, cancel_at_period_end boolean,
  stripe_subscription_id text, updated_at timestamptz
)
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.admins where user_id = auth.uid()) then
    raise exception 'not authorized';
  end if;
  return query
    select s.user_id, u.email::text, s.status, s.price_id,
      case
        when s.price_id = 'price_1UEPLOBgi40jMsdm6LlsT3Hr' then 'Yearly'
        when s.price_id = 'price_1UEPM2Bgi40jMsdmzaWUy7Vg' then 'Monthly'
        else coalesce(s.price_id, '—')
      end as plan,
      s.current_period_end, s.cancel_at_period_end, s.stripe_subscription_id, s.updated_at
    from public.subscriptions s
    join auth.users u on u.id = s.user_id
    where search = '' or u.email ilike '%' || search || '%'
    order by s.updated_at desc
    limit 200;
end; $$;
revoke execute on function public.admin_list_subscriptions(text) from public, anon;
grant  execute on function public.admin_list_subscriptions(text) to authenticated;

-- Business metrics for the dashboard tiles. MRR in AUD cents (monthly 2500,
-- yearly $270/yr => 2250/mo). Counts active + trialing toward MRR.
create or replace function public.admin_metrics()
returns table (
  total_users bigint, active bigint, trialing bigint, comp bigint,
  past_due bigint, canceled bigint, mrr_cents bigint
)
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.admins where user_id = auth.uid()) then
    raise exception 'not authorized';
  end if;
  return query
  select
    (select count(*) from auth.users),
    (select count(*) from public.subscriptions where status = 'active'),
    (select count(*) from public.subscriptions where status = 'trialing'),
    (select count(*) from public.comp_access),
    (select count(*) from public.subscriptions where status = 'past_due'),
    (select count(*) from public.subscriptions where status = 'canceled'),
    (select coalesce(sum(case
        when price_id = 'price_1UEPM2Bgi40jMsdmzaWUy7Vg' then 2500
        when price_id = 'price_1UEPLOBgi40jMsdm6LlsT3Hr' then 2250
        else 0 end), 0)
     from public.subscriptions where status in ('active', 'trialing'));
end; $$;
revoke execute on function public.admin_metrics() from public, anon;
grant  execute on function public.admin_metrics() to authenticated;

-- List admins (for the Manage admins section).
create or replace function public.admin_list_admins()
returns table (user_id uuid, email text, added_at timestamptz)
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.admins where user_id = auth.uid()) then
    raise exception 'not authorized';
  end if;
  return query
    select a.user_id, u.email::text, a.added_at
    from public.admins a join auth.users u on u.id = a.user_id
    order by a.added_at;
end; $$;
revoke execute on function public.admin_list_admins() from public, anon;
grant  execute on function public.admin_list_admins() to authenticated;

-- Promote a user (by email) to admin. They must already have an account.
create or replace function public.admin_add_admin(target_email text)
returns text
language plpgsql security definer set search_path = public as $$
declare tid uuid;
begin
  if not exists (select 1 from public.admins where user_id = auth.uid()) then
    raise exception 'not authorized';
  end if;
  select id into tid from auth.users where lower(email) = lower(trim(target_email)) limit 1;
  if tid is null then
    raise exception 'No account exists for that email yet — they must sign up first.';
  end if;
  insert into public.admins(user_id) values (tid) on conflict (user_id) do nothing;
  return tid::text;
end; $$;
revoke execute on function public.admin_add_admin(text) from public, anon;
grant  execute on function public.admin_add_admin(text) to authenticated;

-- Remove an admin. Protects against self-lockout and removing the last admin.
create or replace function public.admin_remove_admin(target uuid)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.admins where user_id = auth.uid()) then
    raise exception 'not authorized';
  end if;
  if target = auth.uid() then
    raise exception 'You cannot remove your own admin access.';
  end if;
  if (select count(*) from public.admins) <= 1 then
    raise exception 'Cannot remove the last remaining admin.';
  end if;
  delete from public.admins where user_id = target;
end; $$;
revoke execute on function public.admin_remove_admin(uuid) from public, anon;
grant  execute on function public.admin_remove_admin(uuid) to authenticated;

-- Am I an admin? (cheap check the /admin page calls right after login.)
create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;
revoke execute on function public.is_admin() from public, anon;
grant  execute on function public.is_admin() to authenticated;
