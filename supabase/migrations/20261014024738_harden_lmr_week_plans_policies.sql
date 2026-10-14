alter policy "week plans: owner read" on public.lmr_week_plans
 using(user_id=(select auth.uid()) and (select public.is_admin()) and (select auth.jwt()->>'aal')='aal2');
alter policy "week plans: owner insert" on public.lmr_week_plans
 with check(user_id=(select auth.uid()) and (select public.is_admin()) and (select auth.jwt()->>'aal')='aal2');
alter policy "week plans: owner update" on public.lmr_week_plans
 using(user_id=(select auth.uid()) and (select public.is_admin()) and (select auth.jwt()->>'aal')='aal2')
 with check(user_id=(select auth.uid()) and (select public.is_admin()) and (select auth.jwt()->>'aal')='aal2');
