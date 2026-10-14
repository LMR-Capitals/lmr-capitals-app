create or replace function public.admin_list_users(search text default '')
returns table (user_id uuid, email text, entitled boolean, comp boolean, sub_status text, joined timestamptz)
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.admins a where a.user_id = auth.uid()) then
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

create or replace function public.admin_list_subscriptions(search text default '')
returns table (
  user_id uuid, email text, status text, price_id text, plan text,
  current_period_end timestamptz, cancel_at_period_end boolean,
  stripe_subscription_id text, updated_at timestamptz
)
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.admins a where a.user_id = auth.uid()) then
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

create or replace function public.admin_list_admins()
returns table (user_id uuid, email text, added_at timestamptz)
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.admins a where a.user_id = auth.uid()) then
    raise exception 'not authorized';
  end if;
  return query
    select a.user_id, u.email::text, a.added_at
    from public.admins a join auth.users u on u.id = a.user_id
    order by a.added_at;
end; $$;
