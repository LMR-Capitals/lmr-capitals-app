-- Pending explicit approval: membership checks on existing journal tables/storage.
begin;
-- Restrictive policies combine with existing application ownership rules.
-- Account profiles and the free learning tables are deliberately outside this list.
do $$ declare t text; begin
 foreach t in array array['trades','daily','monthly','weekly','accounts','transactions','notes','journal','weekly_reports','pd_switches','chart_images','payouts','target_events','copier_config','lmr_terminology','lmr_psychology'] loop
  if to_regclass('public.'||t) is not null then
   execute format('alter table public.%I enable row level security',t);
   execute format('drop policy if exists circle_membership_required on public.%I',t);
   execute format('create policy circle_membership_required on public.%I as restrictive for all to authenticated using(public.circle_can_access()) with check(public.circle_can_access())',t);
  end if;
 end loop;
end $$;
-- Existing journal chart files retain their ownership policy and also require membership.
drop policy if exists circle_app_media_membership on storage.objects;
create policy circle_app_media_membership on storage.objects as restrictive for all to authenticated
 using(bucket_id <> 'lmr-images' or public.circle_can_access())
 with check(bucket_id <> 'lmr-images' or public.circle_can_access());
commit;
