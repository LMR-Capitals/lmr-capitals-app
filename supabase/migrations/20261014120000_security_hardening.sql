-- Security hardening from database/SECURITY.md §6, part 1.
-- APPLIED to the live project on 2026-10-14. Changes functions and grants only; no data touched.
--
-- Legacy admin RPCs now require a verified administrator with MFA (aal2),
-- matching circle_is_admin(). The admin portal and the Journal admin panel
-- already force an aal2 session before calling them. is_admin() is left as
-- is, because the portal calls it before the MFA step.
-- is_entitled(uid) is no longer executable by anon.
-- admin_remove_admin and admin_revoke_comp are in part 2.

create or replace function public.admin_add_admin(target_email text)
returns text language plpgsql security definer set search_path to 'public'
as $$
declare tid uuid;
begin
  if not public.circle_is_admin() then
    raise exception 'not authorized';
  end if;
  select id into tid from auth.users where lower(email) = lower(trim(target_email)) limit 1;
  if tid is null then
    raise exception 'No account exists for that email yet — they must sign up first.';
  end if;
  insert into public.admins(user_id) values (tid) on conflict (user_id) do nothing;
  return tid::text;
end; $$;

create or replace function public.admin_list_admins()
returns table(user_id uuid, email text, added_at timestamptz)
language plpgsql security definer set search_path to 'public'
as $$
begin
  if not public.circle_is_admin() then
    raise exception 'not authorized';
  end if;
  return query
    select a.user_id, u.email::text, a.added_at
    from public.admins a join auth.users u on u.id = a.user_id
    order by a.added_at;
end; $$;

create or replace function public.admin_list_users(search text default ''::text)
returns table(user_id uuid, email text, entitled boolean, comp boolean, sub_status text, joined timestamptz)
language plpgsql security definer set search_path to 'public'
as $$
begin
  if not public.circle_is_admin() then
    raise exception 'not authorized';
  end if;
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
  if not public.circle_is_admin() then
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

create or replace function public.admin_metrics()
returns table(total_users bigint, active bigint, trialing bigint, comp bigint,
              past_due bigint, canceled bigint, mrr_cents bigint)
language plpgsql security definer set search_path to 'public'
as $$
begin
  if not public.circle_is_admin() then
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

create or replace function public.admin_grant_comp(target uuid, note text default null::text)
returns void language plpgsql security definer set search_path to 'public'
as $$
begin
  if not public.circle_is_admin() then
    raise exception 'not authorized';
  end if;
  insert into public.comp_access (user_id, granted_by, note)
  values (target, auth.uid(), note)
  on conflict (user_id) do update set granted_by = excluded.granted_by, note = excluded.note, granted_at = now();
end; $$;

create or replace function public.dump_all_data()
returns jsonb language plpgsql security definer set search_path to 'public'
as $$
declare t record; result jsonb := '{}'::jsonb; rows jsonb;
begin
  if not public.circle_is_admin() then
    raise exception 'not authorized';
  end if;
  for t in select tablename from pg_tables where schemaname = 'public' order by tablename loop
    execute format('select coalesce(jsonb_agg(row_to_json(x)), ''[]''::jsonb) from public.%I x', t.tablename) into rows;
    result := result || jsonb_build_object(t.tablename, rows);
  end loop;
  return result;
end $$;

revoke execute on function public.is_entitled(uuid) from public, anon;
grant  execute on function public.is_entitled(uuid) to authenticated;
