-- Add a restrictive entitlement gate; keep each table's existing owner policies.
-- Schema/access changes only: no member records are modified.
begin;
do $$ declare t text; begin
 foreach t in array array['trades','daily','monthly','weekly','accounts','transactions','notes','journal','weekly_reports','pd_switches','chart_images','payouts','target_events','copier_config','lmr_terminology','lmr_psychology','ai_chats','targets','lmr_observations','lmr_session_chain'] loop
  if to_regclass('public.'||t) is not null then
   execute format('drop policy if exists circle_membership_required on public.%I',t);
   execute format('create policy circle_membership_required on public.%I as restrictive for all to authenticated using(public.circle_can_access()) with check(public.circle_can_access())',t);
  end if;
 end loop;
end $$;
commit;
