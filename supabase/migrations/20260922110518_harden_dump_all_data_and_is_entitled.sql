-- Security hardening from Supabase advisor findings.
--
-- Scope note: the admin_* functions and is_admin() already self-guard
-- (`if not exists (select 1 from public.admins where user_id = auth.uid())
-- then raise exception 'not authorized'`) and already SET search_path, so they
-- are intentionally left unchanged. The advisor's "authenticated can execute
-- SECURITY DEFINER" note for them is expected: the admin panel calls them as an
-- authenticated user and the internal guard restricts them to admins.
--
-- This migration fixes the two real issues:
--   1. dump_all_data() was SECURITY DEFINER (bypasses RLS), had NO auth guard,
--      no search_path, and was callable by the anon role via /rest/v1/rpc — an
--      unauthenticated caller could dump every user's data. The app never calls
--      it. Add an admin guard, pin search_path, and remove anon/public execute.
--   2. is_entitled(uid) had a mutable search_path. Pin it (behavior unchanged;
--      still SECURITY INVOKER).

create or replace function public.dump_all_data()
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  t record;
  result jsonb := '{}'::jsonb;
  rows jsonb;
begin
  if not exists (select 1 from public.admins where user_id = auth.uid()) then
    raise exception 'not authorized';
  end if;
  for t in
    select tablename from pg_tables where schemaname = 'public' order by tablename
  loop
    execute format('select coalesce(jsonb_agg(row_to_json(x)), ''[]''::jsonb) from public.%I x', t.tablename)
      into rows;
    result := result || jsonb_build_object(t.tablename, rows);
  end loop;
  return result;
end $function$;

revoke execute on function public.dump_all_data() from public;
revoke execute on function public.dump_all_data() from anon;
grant execute on function public.dump_all_data() to authenticated;

create or replace function public.is_entitled(uid uuid)
returns boolean
language sql
stable
set search_path to 'public'
as $function$
  select
    exists (select 1 from public.admins       a where a.user_id = uid)
    or exists (select 1 from public.comp_access c where c.user_id = uid)
    or exists (select 1 from public.subscriptions s where s.user_id = uid and s.status in ('active','trialing'));
$function$;
