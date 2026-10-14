-- Security hardening from database/SECURITY.md §6, part 2.
-- NOT YET APPLIED. Supabase asks for approval on statements containing
-- delete/drop, and that prompt timed out during the 2026-10-14 session.
-- Apply it from the Supabase SQL editor. It changes policies and functions only.
--
-- Same MFA guard for the two admin RPCs whose bodies delete rows, and drop
-- the duplicate "own rows …" policies. Each one is identical to the
-- "own …" policy that stays on the same table.

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

drop policy if exists "own rows accounts"     on public.accounts;
drop policy if exists "own rows daily"        on public.daily;
drop policy if exists "own rows monthly"      on public.monthly;
drop policy if exists "own rows notes"        on public.notes;
drop policy if exists "own rows trades"       on public.trades;
drop policy if exists "own rows transactions" on public.transactions;
drop policy if exists "own rows weekly"       on public.weekly;
