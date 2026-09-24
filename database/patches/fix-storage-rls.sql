-- LMR Capitals — fix storage RLS for the app-images bucket
--
-- Error seen: "new row violates row-level security policy" (403) on every
-- image upload/read to storage.objects for bucket 'app-images'.
-- The app stores each user's images under a folder named after their
-- user_id, e.g. app-images/<uid>/trade-12345-15m
--
-- This grants:
--  - any authenticated user can upload/update/delete files inside their
--    OWN folder (folder name == their auth.uid())
--  - anyone can read files in app-images (bucket is meant to be public)
--
-- Run in Supabase → SQL Editor → New query → Run
-- Safe to re-run (drops existing policies of the same name first).

drop policy if exists "app-images: users upload to own folder" on storage.objects;
create policy "app-images: users upload to own folder"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'app-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "app-images: users update own files" on storage.objects;
create policy "app-images: users update own files"
on storage.objects for update
to authenticated
using (
  bucket_id = 'app-images'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'app-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "app-images: users delete own files" on storage.objects;
create policy "app-images: users delete own files"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'app-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "app-images: public read" on storage.objects;
create policy "app-images: public read"
on storage.objects for select
to public
using (bucket_id = 'app-images');
