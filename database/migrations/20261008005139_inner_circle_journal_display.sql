-- Replicate display data only; original ownership and delivery flags remain in Journal.
alter table public.circle_posts add column if not exists source_details jsonb not null default '{}'::jsonb check(jsonb_typeof(source_details)='object');
create or replace function public.circle_journal_details(kind text,r jsonb) returns jsonb
language sql immutable security invoker set search_path='' as $$
 select case when kind='observation' then jsonb_build_object('title',r->'title','session_tag',r->'session_tag','created_at',r->'created_at','updated_at',r->'updated_at')
 when kind='achievement' then jsonb_build_object('title',r->'title','caption',r->'caption','category',r->'category','firm',r->'firm','amount',r->'amount','achieved_on',r->'achieved_on','created_at',r->'created_at','updated_at',r->'updated_at') else '{}'::jsonb end;
$$;
revoke all on function public.circle_journal_details(text,jsonb) from public,anon;
grant execute on function public.circle_journal_details(text,jsonb) to authenticated;

-- The visible ENTRY zone is tm-img-result / trade-{id}-result. Never fall back to Intraday.
create or replace function public.circle_journal_sources() returns jsonb
language plpgsql security invoker set search_path='' as $$
declare result jsonb;
begin
 if not public.circle_is_admin() then raise exception 'Verified administrator required'; end if;
 select coalesce(jsonb_agg(entry order by changed desc),'[]'::jsonb) into result from (
  select jsonb_build_object('id',o.id,'kind','observation','title',coalesce(nullif(o.title,''),'Untitled observation'),'content',o.content) || public.circle_journal_details('observation',to_jsonb(o)) || jsonb_build_object('title',coalesce(nullif(o.title,''),'Untitled observation')) as entry,coalesce(o.updated_at,o.created_at) as changed
  from public.lmr_observations o where o.user_id=auth.uid()
  union all
  select jsonb_build_object('id',a.id,'kind','achievement','image',a.image,'is_public',a.is_public) || public.circle_journal_details('achievement',to_jsonb(a)) || jsonb_build_object('title',coalesce(nullif(a.title,''),'Untitled achievement')),coalesce(a.updated_at,a.created_at)
  from public.lmr_achievements a where a.user_id=auth.uid()
  union all
  select jsonb_build_object('id',t.id,'kind','trade','title',left(concat_ws(' · ',nullif(t.market,''),nullif(t.position,''),t.date::text),200),
   'body',public.circle_trade_details(to_jsonb(t)),'image_path',s.name,
   'image',null,'entry_slot','result','entry_label','ENTRY · exit / outcome',
   'entry_version',s.updated_at::text,'updated_at',t.updated_at),coalesce(t.updated_at,t.created_at)
  from public.trades t left join storage.objects s on s.bucket_id='app-images' and s.name=t.user_id::text||'/trade-'||t.id||'-result'
  where t.user_id=auth.uid()
 ) sources;
 return result;
end $$;

create or replace function public.circle_publish_trade(p_source_id text,p_image_path text,p_entry_version text)
returns public.circle_posts language plpgsql security invoker set search_path='' as $$
declare source public.trades; entry_version text; item public.circle_posts; item_title text;
begin
 if not public.circle_is_admin() then raise exception 'Verified administrator required'; end if;
 select * into source from public.trades where id=p_source_id and user_id=auth.uid() for update;
 if source.id is null then raise exception 'Trade not found in your Journal'; end if;
 select s.updated_at::text into entry_version from storage.objects s where s.bucket_id='app-images' and s.name=auth.uid()::text||'/trade-'||source.id||'-result';
 if entry_version is null then raise exception 'Save the ENTRY (exit / outcome) chart in your Journal first'; end if;
 if p_entry_version is distinct from entry_version then raise exception 'This entry chart changed. Refresh your Journal selection and try again'; end if;
 if split_part(p_image_path,'/',1) is distinct from auth.uid()::text or not exists (
  select 1 from storage.objects s where s.bucket_id='circle-media' and s.name=p_image_path and s.metadata->>'mimetype' in ('image/png','image/jpeg','image/webp')
 ) then raise exception 'Upload the reviewed entry image to your private Studio storage first'; end if;
 item_title:=left(concat_ws(' · ',nullif(source.market,''),nullif(source.position,''),source.date::text),200);
 if item_title='' then item_title:='Journal trade entry'; end if;
 insert into public.circle_posts(author_id,kind,title,body,status,published_at,source_kind,source_id,source_owner_id,image_path,image_caption,source_details)
 values(auth.uid(),'execution',item_title,public.circle_trade_details(to_jsonb(source)),'published',now(),'trade',source.id,auth.uid(),p_image_path,'ENTRY · exit / outcome · '||item_title,jsonb_build_object('entry_slot','result','entry_label','ENTRY · exit / outcome'))
 on conflict (source_kind,source_owner_id,source_id) where source_id is not null do update
 set title=excluded.title,body=excluded.body,status='published',published_at=coalesce(public.circle_posts.published_at,now()),image_path=excluded.image_path,image_caption=excluded.image_caption,source_image=null,source_details=excluded.source_details
 returning * into item;
 return item;
end $$;

create or replace function public.circle_publish_journal(p_source_kind text,p_source_id text)
returns public.circle_posts language plpgsql security invoker set search_path='' as $$
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
 insert into public.circle_posts(author_id,kind,title,body,status,published_at,source_kind,source_id,source_owner_id,source_content,source_image,image_caption,source_details)
 values(auth.uid(),p_source_kind,item_title,item_body,'published',now(),p_source_kind,p_source_id,auth.uid(),item_content,item_image,item_title,public.circle_journal_details(p_source_kind,source_record))
 on conflict (source_kind,source_owner_id,source_id) where source_id is not null do update
 set title=excluded.title,body=excluded.body,status='published',published_at=coalesce(public.circle_posts.published_at,now()),source_content=excluded.source_content,source_image=excluded.source_image,image_caption=excluded.image_caption,source_details=excluded.source_details
 returning * into item;
 return item;
end $$;

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
  update public.circle_posts set status='draft',published_at=null where source_kind=item_kind and source_id=old.id and source_owner_id=old.user_id;
  return old;
 end if;
 if new.user_id is distinct from old.user_id or not exists(select 1 from public.admins where user_id=new.user_id) then
  update public.circle_posts set status='draft',published_at=null where source_kind=item_kind and source_id=old.id and source_owner_id=old.user_id;
  return new;
 end if;
 source_record := to_jsonb(new);
 update public.circle_posts set
  source_details=public.circle_journal_details(item_kind,source_record),
  title=left(coalesce(nullif(source_record->>'title',''),'Untitled '||item_kind),200),
  body=case when item_kind='achievement' then left(coalesce(source_record->>'caption',''),30000) else '' end,
  source_content=case when item_kind='observation' then source_record->>'content' else null end,
  source_image=case when item_kind='achievement' then nullif(source_record->>'image','') else null end,
  image_caption=left(coalesce(nullif(source_record->>'title',''),'Untitled '||item_kind),200)
 where source_kind=item_kind and source_id=new.id and source_owner_id=new.user_id;
 return new;
end $$;

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
 insert into public.circle_posts(author_id,kind,title,body,status,published_at,source_kind,source_id,source_owner_id,source_content,image_caption,source_details)
 values(auth.uid(),'observation',trim(p_title),'',case when p_publish then 'published' else 'draft' end,case when p_publish then now() else null end,'observation',p_id,auth.uid(),content,trim(p_title),public.circle_journal_details('observation',to_jsonb(original)))
 on conflict (source_kind,source_owner_id,source_id) where source_id is not null do nothing returning * into item;
 if item.id is null then select * into item from public.circle_posts where source_kind='observation' and source_id=p_id and source_owner_id=auth.uid(); end if;
 return item;
end $$;
revoke all on function public.circle_journal_sources(),public.circle_publish_trade(text,text,text),public.circle_publish_journal(text,text),public.circle_create_observation(text,text,text,text,text,boolean) from public,anon;
grant execute on function public.circle_journal_sources(),public.circle_publish_trade(text,text,text),public.circle_publish_journal(text,text),public.circle_create_observation(text,text,text,text,text,boolean) to authenticated;
revoke all on function public.circle_sync_journal() from public,anon,authenticated;
-- No automatic publication/backfill, deletion, account role or subscription change.
