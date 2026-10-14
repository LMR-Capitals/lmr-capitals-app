-- Launch security patch: apply ONLY after authenticated-image frontend is live.
-- No objects, Journal rows or publication records are moved or deleted.
begin;
drop policy if exists "app-images: public read" on storage.objects;
-- Ownership is independent of subscription status, preserving personal file access.
create policy launch_app_images_read on storage.objects for select to authenticated using (
 bucket_id='app-images' and (
  (storage.foldername(name))[1]=auth.uid()::text
  or (public.circle_can_access() and exists(select 1 from public.circle_posts p
   where p.source_kind='trade' and p.status='published' and p.published_at<=now()
   and (name=p.source_owner_id::text||'/trade-'||p.source_id||'-entry'
     or name=p.source_owner_id::text||'/trade-'||p.source_id||'-result')))
 ));
-- Read only an ownership boolean; bypass the Journal's paid-use gate for owners
-- recovering their own imported files. No content or other owner's paths returned.
create or replace function circle_private.owns_imported_journal_image(object_name text)
returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists (
  select 1 from public.journal j cross join lateral unnest(j.image_keys) k
  where j.user_id=auth.uid() and
   case when k ~ '/journal-import/[^/]+/chart-[0-9]{1,6}[.]png$' then
    object_name='note_'||split_part(k,'/',3)||'_'||(substring(split_part(k,'/',4) from '[0-9]+')::int-1)::text||'.png'
   else false end
 );
$$;
revoke all on function circle_private.owns_imported_journal_image(text) from public,anon;
grant execute on function circle_private.owns_imported_journal_image(text) to authenticated;
create policy launch_imported_journal_read on storage.objects for select to authenticated using (
 bucket_id='journal-images' and circle_private.owns_imported_journal_image(name)
);
update storage.buckets set public=false where id in ('app-images','journal-images');
commit;
