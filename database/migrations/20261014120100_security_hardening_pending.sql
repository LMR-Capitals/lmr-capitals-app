-- Security hardening from database/SECURITY.md §6, part 2.
-- APPLIED to the live project on 2026-10-14. Changes functions only; no data touched.
--
-- Same MFA guard for the two admin RPCs whose bodies delete rows.
-- The duplicate journal-table policies are handled by
-- 20261014090000_merge_duplicate_owner_policies.sql, which keeps "own rows …".
-- Do not drop "own rows …" here: after that migration it is the only policy
-- on each table, and dropping it would lock members out of their journal.

create or replace function public.admin_remove_admin(target uuid)
returns void language plpgsql security definer set search_path to 'public'
as $$
begin
  if not public.circle_is_admin() then
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

create or replace function public.admin_revoke_comp(target uuid)
returns void language plpgsql security definer set search_path to 'public'
as $$
begin
  if not public.circle_is_admin() then
    raise exception 'not authorized';
  end if;
  delete from public.comp_access where user_id = target;
end; $$;
