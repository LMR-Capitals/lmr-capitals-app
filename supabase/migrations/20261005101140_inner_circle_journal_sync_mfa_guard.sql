create or replace function public.circle_sync_journal() returns trigger
language plpgsql security definer set search_path='' as $$
declare item_kind text := case when TG_TABLE_NAME='lmr_observations' then 'observation' else 'achievement' end; source_record jsonb;
begin
 -- A linked, published copy makes an edit/delete a member publication action.
 -- Authenticated source owners must retain admin MFA for that action. Trusted
 -- database/service maintenance has no auth.uid(); source RLS still guards clients.
 if auth.uid() is not null and not public.circle_is_admin() and exists (
  select 1 from public.circle_posts where source_kind=item_kind and source_id=old.id and source_owner_id=old.user_id and status='published'
 ) then raise exception 'Verified administrator required to change a published journal record'; end if;
 if TG_OP='DELETE' then
  delete from public.circle_posts where source_kind=item_kind and source_id=old.id and source_owner_id=old.user_id;
  return old;
 end if;
 if new.user_id is distinct from old.user_id or not exists(select 1 from public.admins where user_id=new.user_id) then
  delete from public.circle_posts where source_kind=item_kind and source_id=old.id and source_owner_id=old.user_id;
  return new;
 end if;
 source_record := to_jsonb(new);
 update public.circle_posts set
  title=left(coalesce(nullif(source_record->>'title',''),'Untitled '||item_kind),200),
  body=case when item_kind='achievement' then left(coalesce(source_record->>'caption',''),30000) else '' end,
  source_content=case when item_kind='observation' then source_record->>'content' else null end,
  source_image=case when item_kind='achievement' then nullif(source_record->>'image','') else null end,
  image_caption=left(coalesce(nullif(source_record->>'title',''),'Untitled '||item_kind),200)
 where source_kind=item_kind and source_id=new.id and source_owner_id=new.user_id;
 return new;
end $$;
revoke all on function public.circle_sync_journal() from public,anon,authenticated;
