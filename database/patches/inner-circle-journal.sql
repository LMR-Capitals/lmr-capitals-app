-- Apply after inner-circle.sql and the existing observation / achievement tables.
-- No automatic backfill: an MFA administrator selects a source record to publish.
begin;
do $$ begin
 if to_regclass('public.lmr_observations') is null or to_regclass('public.lmr_achievements') is null then
  raise exception 'Create the existing Journal observation and achievement tables before this patch';
 end if;
end $$;
alter table public.circle_posts add column if not exists source_kind text check(source_kind in ('observation','achievement'));
alter table public.circle_posts add column if not exists source_id text;
alter table public.circle_posts add column if not exists source_owner_id uuid references auth.users;
alter table public.circle_posts add column if not exists source_content text;
alter table public.circle_posts add column if not exists source_image text;
create unique index if not exists circle_journal_source on public.circle_posts(source_kind,source_owner_id,source_id) where source_id is not null;

-- Source records are read only by their registered, MFA-verified administrator.
-- The client cannot nominate another owner or supply substituted source content.
create or replace function public.circle_journal_sources() returns jsonb
language plpgsql security definer set search_path='' as $$
declare result jsonb;
begin
 if not public.circle_is_admin() then raise exception 'Verified administrator required'; end if;
 select coalesce(jsonb_agg(entry order by changed desc),'[]'::jsonb) into result from (
  select jsonb_build_object('id',o.id,'kind','observation','title',coalesce(nullif(o.title,''),'Untitled observation'),'content',o.content,'updated_at',o.updated_at) as entry,coalesce(o.updated_at,o.created_at) as changed
  from public.lmr_observations o where o.user_id=auth.uid()
  union all
  select jsonb_build_object('id',a.id,'kind','achievement','title',coalesce(nullif(a.title,''),'Untitled achievement'),'caption',a.caption,'image',a.image,'category',a.category,'firm',a.firm,'achieved_on',a.achieved_on,'updated_at',a.updated_at),coalesce(a.updated_at,a.created_at)
  from public.lmr_achievements a where a.user_id=auth.uid()
 ) sources;
 return result;
end $$;

create or replace function public.circle_publish_journal(p_source_kind text,p_source_id text)
returns public.circle_posts language plpgsql security definer set search_path='' as $$
declare item public.circle_posts; source_record jsonb; item_title text; item_body text; item_content text; item_image text;
begin
 if not public.circle_is_admin() then raise exception 'Verified administrator required'; end if;
 if p_source_kind='observation' then
  select to_jsonb(o) into source_record from public.lmr_observations o where o.id=p_source_id and o.user_id=auth.uid() for update;
 elsif p_source_kind='achievement' then
  select to_jsonb(a) into source_record from public.lmr_achievements a where a.id=p_source_id and a.user_id=auth.uid() for update;
 else raise exception 'Choose an observation or achievement'; end if;
 if source_record is null then raise exception 'Journal record not found in your account'; end if;
 item_title := left(coalesce(nullif(source_record->>'title',''),'Untitled '||p_source_kind),200);
 item_body := case when p_source_kind='achievement' then left(coalesce(source_record->>'caption',''),30000) else '' end;
 item_content := case when p_source_kind='observation' then source_record->>'content' else null end;
 item_image := case when p_source_kind='achievement' then nullif(source_record->>'image','') else null end;
 if p_source_kind='achievement' and item_image is null then raise exception 'Add a certificate or achievement image in your Journal Application first'; end if;
 -- Unique source linkage prevents duplicate feed posts on retries or republishing.
 insert into public.circle_posts(author_id,kind,title,body,status,published_at,source_kind,source_id,source_owner_id,source_content,source_image,image_caption)
 values(auth.uid(),p_source_kind,item_title,item_body,'published',now(),p_source_kind,p_source_id,auth.uid(),item_content,item_image,item_title)
 on conflict (source_kind,source_owner_id,source_id) where source_id is not null do update
 set title=excluded.title,body=excluded.body,status='published',published_at=coalesce(public.circle_posts.published_at,now()),source_content=excluded.source_content,source_image=excluded.source_image,image_caption=excluded.image_caption
 returning * into item;
 return item;
end $$;

-- Edits to a chosen source replicate in the same transaction. Private, unselected
-- rows do not create posts; withdrawn copies stay withdrawn on subsequent edits.
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
revoke all on function public.circle_journal_sources(),public.circle_publish_journal(text,text),public.circle_sync_journal() from public,anon,authenticated;
grant execute on function public.circle_journal_sources(),public.circle_publish_journal(text,text) to authenticated;
drop trigger if exists circle_observation_sync on public.lmr_observations;
create trigger circle_observation_sync after update or delete on public.lmr_observations for each row execute function public.circle_sync_journal();
drop trigger if exists circle_achievement_sync on public.lmr_achievements;
create trigger circle_achievement_sync after update or delete on public.lmr_achievements for each row execute function public.circle_sync_journal();
commit;
