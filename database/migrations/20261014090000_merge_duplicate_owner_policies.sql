-- Each journal table carried two identical permissive owner policies
-- ("own <t>" and "own rows <t>"), so Postgres evaluated the same check twice
-- per row (Supabase advisor: multiple_permissive_policies). Keep one policy per
-- table with the same rule, wrapping auth.uid() in a sub-select so it runs once
-- per query instead of once per row (advisor: auth_rls_initplan).
-- Access is unchanged: a user can still read and write only rows they own.
begin;

drop policy if exists "own accounts" on public.accounts;
drop policy if exists "own rows accounts" on public.accounts;
create policy "own rows accounts" on public.accounts for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "own daily" on public.daily;
drop policy if exists "own rows daily" on public.daily;
create policy "own rows daily" on public.daily for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "own monthly" on public.monthly;
drop policy if exists "own rows monthly" on public.monthly;
create policy "own rows monthly" on public.monthly for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "own notes" on public.notes;
drop policy if exists "own rows notes" on public.notes;
create policy "own rows notes" on public.notes for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "own trades" on public.trades;
drop policy if exists "own rows trades" on public.trades;
create policy "own rows trades" on public.trades for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "own transactions" on public.transactions;
drop policy if exists "own rows transactions" on public.transactions;
create policy "own rows transactions" on public.transactions for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "own weekly" on public.weekly;
drop policy if exists "own rows weekly" on public.weekly;
create policy "own rows weekly" on public.weekly for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

commit;
