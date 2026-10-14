-- Launch security patch: apply ONLY after authenticated-image frontend is live.
-- No objects, Journal rows or publication records are moved or deleted.
begin;
drop policy if exists "app-images: public read" on storage.objects;
create policy launch_app_images_read on storage.objects for select to authenticated using (
 bucket_id='app-images' and public.circle_can_access() and (
  (storage.foldername(name))[1]=auth.uid()::text
  or exists(select 1 from public.circle_posts p where p.source_kind='trade'
   and p.status='published' and p.published_at<=now()
   and (name=p.source_owner_id::text||'/trade-'||p.source_id||'-entry'
     or name=p.source_owner_id::text||'/trade-'||p.source_id||'-result'))
 ));
create policy launch_imported_journal_read on storage.objects for select to authenticated using (
 bucket_id='journal-images' and public.circle_can_access() and exists (
  select 1 from public.journal j cross join lateral unnest(j.image_keys) k
  where j.user_id=auth.uid() and
   case when k ~ '/journal-import/[^/]+/chart-[0-9]+[.]png$' then
    name='note_'||split_part(k,'/',3)||'_'||(substring(split_part(k,'/',4) from '[0-9]+')::int-1)::text||'.png'
   else false end
 ));
-- Existing owner write policies still apply; membership is an additional gate.
create policy launch_journal_storage_membership on storage.objects as restrictive for all to authenticated
 using(bucket_id not in ('app-images','journal-images','lmr-images') or public.circle_can_access())
 with check(bucket_id not in ('app-images','journal-images','lmr-images') or public.circle_can_access());
update storage.buckets set public=false where id in ('app-images','journal-images');
commit;
