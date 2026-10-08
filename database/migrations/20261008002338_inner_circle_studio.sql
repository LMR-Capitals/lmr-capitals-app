-- LMR Studio: targeted additions. No role grants, subscription changes or backfill.
alter table public.circle_profiles add column if not exists avatar_mode text not null default 'provider';
alter table public.circle_profiles add column if not exists avatar_path text;
alter table public.circle_profiles add constraint circle_profile_avatar_mode check (avatar_mode in ('provider','custom','initials'));
alter table public.circle_profiles add constraint circle_profile_avatar_owner check (avatar_path is null or (split_part(avatar_path,'/',1)=user_id::text and avatar_path ~ '^[a-f0-9-]+/[a-f0-9-]+\.(png|jpeg|webp)$'));
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('circle-avatars','circle-avatars',false,5242880,array['image/png','image/jpeg','image/webp'])
on conflict (id) do nothing;
create policy circle_avatar_owner on storage.objects for all to authenticated
using (bucket_id='circle-avatars' and public.circle_has_account() and (storage.foldername(name))[1]=(select auth.uid())::text)
with check (bucket_id='circle-avatars' and public.circle_has_account() and (storage.foldername(name))[1]=(select auth.uid())::text);

-- Q&A is private to its submitting account and MFA administrators, for both tiers.
drop policy if exists circle_questions_ask on public.circle_questions;
create policy circle_questions_ask on public.circle_questions for insert to authenticated
with check (user_id=(select auth.uid()) and public.circle_has_account() and answer is null and status='open' and (session_id is null or public.circle_can_access()));
drop policy if exists circle_questions_read on public.circle_questions;
create policy circle_questions_read on public.circle_questions for select to authenticated
using (public.circle_is_admin() or (user_id=(select auth.uid()) and public.circle_has_account()));

-- Signed media may only be obtained for a publication that this account can read.
drop policy if exists circle_media_read on storage.objects;
create policy circle_media_read on storage.objects for select to authenticated
using (bucket_id='circle-media' and (public.circle_is_admin() or (public.circle_has_account() and exists (
 select 1 from public.circle_posts p where p.image_path=name and p.status='published' and p.published_at<=now()
 and (p.kind='terminology' or public.circle_can_access())
))));
alter table public.circle_posts drop constraint circle_posts_source_kind_check;
alter table public.circle_posts add constraint circle_posts_source_kind_check check(source_kind in ('observation','achievement','trade'));

-- The allowlist deliberately excludes account identifiers, P&L, lot size and exit charts.
create or replace function public.circle_trade_details(t jsonb) returns text
language sql immutable security invoker set search_path='' as $$
 select concat_ws(' · ',case when nullif(t->>'market','') is not null then 'Market: '||left(t->>'market',80) end,
 case when nullif(t->>'position','') is not null then 'Direction: '||left(t->>'position',40) end,
 case when nullif(t->>'session','') is not null then 'Session: '||left(t->>'session',80) end,
 case when nullif(t->>'date','') is not null then 'Date: '||left(t->>'date',10) end);
$$;
revoke all on function public.circle_trade_details(jsonb) from public,anon;
grant execute on function public.circle_trade_details(jsonb) to authenticated;

-- Existing Journal sources, plus exactly one entry slot from the requesting admin's trades.
create or replace function public.circle_journal_sources() returns jsonb
language plpgsql security invoker set search_path='' as $$
declare result jsonb;
begin
 if not public.circle_is_admin() then raise exception 'Verified administrator required'; end if;
 select coalesce(jsonb_agg(entry order by changed desc),'[]'::jsonb) into result from (
  select jsonb_build_object('id',o.id,'kind','observation','title',coalesce(nullif(o.title,''),'Untitled observation'),'content',o.content,'updated_at',o.updated_at) as entry,coalesce(o.updated_at,o.created_at) as changed
  from public.lmr_observations o where o.user_id=auth.uid()
  union all
  select jsonb_build_object('id',a.id,'kind','achievement','title',coalesce(nullif(a.title,''),'Untitled achievement'),'caption',a.caption,'image',a.image,'category',a.category,'firm',a.firm,'achieved_on',a.achieved_on,'updated_at',a.updated_at),coalesce(a.updated_at,a.created_at)
  from public.lmr_achievements a where a.user_id=auth.uid()
  union all
  select jsonb_build_object('id',t.id,'kind','trade','title',left(concat_ws(' · ',nullif(t.market,''),nullif(t.position,''),t.date::text),200),
   'body',public.circle_trade_details(to_jsonb(t)),'image_path',s.name,
   'image',case when s.name is null and t.img_entry ~ '^data:image/(png|jpeg|jpg|webp);base64,[A-Za-z0-9+/=\r\n]+$' and length(t.img_entry)<14000000 then t.img_entry else null end,
   'entry_version',coalesce(s.updated_at::text,md5(coalesce(t.img_entry,''))),'updated_at',t.updated_at),coalesce(t.updated_at,t.created_at)
  from public.trades t left join storage.objects s on s.bucket_id='app-images' and s.name=t.user_id::text||'/trade-'||t.id||'-entry'
  where t.user_id=auth.uid()
 ) sources;
 return result;
end $$;
revoke all on function public.circle_journal_sources() from public,anon;
grant execute on function public.circle_journal_sources() to authenticated;

-- A trade chart is copied once into private member storage before this transaction.
-- Source ownership and version are rechecked so a stale selection cannot be published.
create or replace function public.circle_publish_trade(p_source_id text,p_image_path text,p_entry_version text)
returns public.circle_posts language plpgsql security invoker set search_path='' as $$
declare source public.trades; entry_version text; item public.circle_posts; item_title text;
begin
 if not public.circle_is_admin() then raise exception 'Verified administrator required'; end if;
 select * into source from public.trades where id=p_source_id and user_id=auth.uid() for update;
 if source.id is null then raise exception 'Trade not found in your Journal'; end if;
 select s.updated_at::text into entry_version from storage.objects s where s.bucket_id='app-images' and s.name=auth.uid()::text||'/trade-'||source.id||'-entry';
 if entry_version is null then
  if source.img_entry !~ '^data:image/(png|jpeg|jpg|webp);base64,[A-Za-z0-9+/=\r\n]+$' or source.img_entry is null then raise exception 'Save an entry chart in your Journal first'; end if;
  entry_version:=md5(source.img_entry);
 end if;
 if p_entry_version is distinct from entry_version then raise exception 'This entry chart changed. Refresh your Journal selection and try again'; end if;
 if split_part(p_image_path,'/',1) is distinct from auth.uid()::text or not exists (
  select 1 from storage.objects s where s.bucket_id='circle-media' and s.name=p_image_path and s.metadata->>'mimetype' in ('image/png','image/jpeg','image/webp')
 ) then raise exception 'Upload the reviewed entry image to your private Studio storage first'; end if;
 item_title:=left(concat_ws(' · ',nullif(source.market,''),nullif(source.position,''),source.date::text),200);
 if item_title='' then item_title:='Journal trade entry'; end if;
 insert into public.circle_posts(author_id,kind,title,body,status,published_at,source_kind,source_id,source_owner_id,image_path,image_caption)
 values(auth.uid(),'execution',item_title,public.circle_trade_details(to_jsonb(source)),'published',now(),'trade',source.id,auth.uid(),p_image_path,'Journal entry chart · '||item_title)
 on conflict (source_kind,source_owner_id,source_id) where source_id is not null do update
 set title=excluded.title,body=excluded.body,status='published',published_at=coalesce(public.circle_posts.published_at,now()),image_path=excluded.image_path,image_caption=excluded.image_caption,source_image=null
 returning * into item;
 return item;
end $$;
revoke all on function public.circle_publish_trade(text,text,text) from public,anon;
grant execute on function public.circle_publish_trade(text,text,text) to authenticated;

-- Creating an observation saves the original and its linked draft/publication atomically.
create or replace function public.circle_create_observation(p_id text,p_title text,p_body text,p_session_tag text,p_image text,p_publish boolean)
returns public.circle_posts language plpgsql security invoker set search_path='' as $$
declare content text; item public.circle_posts; original public.lmr_observations;
begin
 if not public.circle_is_admin() then raise exception 'Verified administrator required'; end if;
 if p_id !~ '^circle-[a-f0-9-]{36}$' or p_id is null then raise exception 'Invalid observation reference'; end if;
 if length(trim(p_title)) not between 1 and 160 or p_title is null or length(trim(p_body)) not between 1 and 12000 or p_body is null then raise exception 'Add an observation title and its context'; end if;
 if p_image is not null and (length(p_image)>7100000 or p_image !~ '^data:image/(png|jpeg|webp);base64,[A-Za-z0-9+/=\r\n]+$') then raise exception 'Use a PNG, JPEG or WebP chart under 5 MB'; end if;
 if coalesce(p_session_tag,'') not in ('','Asia','London','NY AM','NY PM') then raise exception 'Choose a valid session'; end if;
 content:='<p>'||replace(replace(replace(replace(trim(p_body),'&','&amp;'),'<','&lt;'),'>','&gt;'),E'\n','<br>')||'</p>';
 if p_image is not null then content:=content||'<img src="'||p_image||'" alt="Observation chart">'; end if;
 insert into public.lmr_observations(id,user_id,title,content,session_tag,created_at,updated_at)
 values(p_id,auth.uid(),trim(p_title),content,nullif(p_session_tag,''),now(),now()) on conflict (id) do nothing;
 select * into original from public.lmr_observations where id=p_id and user_id=auth.uid() for update;
 if original.id is null or original.title is distinct from trim(p_title) or original.content is distinct from content then raise exception 'This observation reference is already in use'; end if;
 insert into public.circle_posts(author_id,kind,title,body,status,published_at,source_kind,source_id,source_owner_id,source_content,image_caption)
 values(auth.uid(),'observation',trim(p_title),'',case when p_publish then 'published' else 'draft' end,case when p_publish then now() else null end,'observation',p_id,auth.uid(),content,trim(p_title))
 on conflict (source_kind,source_owner_id,source_id) where source_id is not null do nothing returning * into item;
 if item.id is null then select * into item from public.circle_posts where source_kind='observation' and source_id=p_id and source_owner_id=auth.uid(); end if;
 return item;
end $$;
revoke all on function public.circle_create_observation(text,text,text,text,text,boolean) from public,anon;
grant execute on function public.circle_create_observation(text,text,text,text,text,boolean) to authenticated;

-- Only selected trades have a linked copy; edits never publish an unselected trade.
-- Removing/reassigning a Journal source withdraws its copy without deleting Studio history.
create or replace function public.circle_sync_trade() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if not exists(select 1 from public.circle_posts where source_kind='trade' and source_id=old.id and source_owner_id=old.user_id) then
  if TG_OP='DELETE' then return old; else return new; end if;
 end if;
 if auth.uid() is not null and not public.circle_is_admin() and exists(select 1 from public.circle_posts where source_kind='trade' and source_id=old.id and source_owner_id=old.user_id and status='published') then raise exception 'Verified administrator required to change a published trade'; end if;
 if TG_OP='DELETE' then update public.circle_posts set status='draft',published_at=null where source_kind='trade' and source_id=old.id and source_owner_id=old.user_id; return old; end if;
 if new.user_id is distinct from old.user_id or not exists(select 1 from public.admins where user_id=new.user_id) then
  update public.circle_posts set status='draft',published_at=null where source_kind='trade' and source_id=old.id and source_owner_id=old.user_id; return new;
 end if;
 update public.circle_posts set title=coalesce(nullif(left(concat_ws(' · ',nullif(new.market,''),nullif(new.position,''),new.date::text),200),''),'Journal trade entry'), body=public.circle_trade_details(to_jsonb(new))
 where source_kind='trade' and source_id=new.id and source_owner_id=new.user_id;
 return new;
end $$;
revoke all on function public.circle_sync_trade() from public,anon,authenticated;
create trigger circle_trade_sync after update or delete on public.trades for each row execute function public.circle_sync_trade();
