-- Sort by the Journal record's own date, never its last edit or publication time.
create or replace function public.circle_journal_details(kind text,r jsonb) returns jsonb
language sql immutable security invoker set search_path='' as $$
 select case when kind='observation' then jsonb_build_object('title',r->'title','session_tag',r->'session_tag','created_at',r->'created_at','updated_at',r->'updated_at','recorded_at',coalesce(r->>'created_at',r->>'updated_at'))
 when kind='achievement' then jsonb_build_object('title',r->'title','caption',r->'caption','category',r->'category','firm',r->'firm','amount',r->'amount','achieved_on',r->'achieved_on','created_at',r->'created_at','updated_at',r->'updated_at','recorded_at',coalesce(nullif(r->>'achieved_on','')||'T00:00:00Z',r->>'created_at',r->>'updated_at'))
 when kind='trade' then jsonb_build_object('entry_slot','result','entry_label','ENTRY · exit / outcome','date',r->'date','created_at',r->'created_at','recorded_at',coalesce(nullif(r->>'date','')||'T00:00:00Z',r->>'created_at',r->>'updated_at'))
 else '{}'::jsonb end;
$$;
revoke all on function public.circle_journal_details(text,jsonb) from public,anon;
grant execute on function public.circle_journal_details(text,jsonb) to authenticated;

create or replace function public.circle_journal_sources() returns jsonb
language plpgsql security invoker set search_path='' as $$
declare result jsonb;
begin
 if not public.circle_is_admin() then raise exception 'Verified administrator required'; end if;
 select coalesce(jsonb_agg(entry order by recorded desc nulls last,entry->>'kind',entry->>'id'),'[]'::jsonb) into result from (
  select jsonb_build_object('id',o.id,'kind','observation','title',coalesce(nullif(o.title,''),'Untitled observation'),'content',o.content) || public.circle_journal_details('observation',to_jsonb(o)) || jsonb_build_object('title',coalesce(nullif(o.title,''),'Untitled observation')) as entry,coalesce(o.created_at,o.updated_at) as recorded
  from public.lmr_observations o where o.user_id=auth.uid()
  union all
  select jsonb_build_object('id',a.id,'kind','achievement','image',a.image,'is_public',a.is_public) || public.circle_journal_details('achievement',to_jsonb(a)) || jsonb_build_object('title',coalesce(nullif(a.title,''),'Untitled achievement')),coalesce(a.achieved_on::timestamp at time zone 'UTC',a.created_at,a.updated_at)
  from public.lmr_achievements a where a.user_id=auth.uid()
  union all
  select jsonb_build_object('id',t.id,'kind','trade','title',left(concat_ws(' · ',nullif(t.market,''),nullif(t.position,''),t.date::text),200),
   'body',public.circle_trade_details(to_jsonb(t)),'image_path',s.name,
   'image',null,'entry_slot','result','entry_label','ENTRY · exit / outcome',
   'entry_version',s.updated_at::text,'updated_at',t.updated_at) || public.circle_journal_details('trade',to_jsonb(t)),coalesce(t.date::timestamp at time zone 'UTC',t.created_at,t.updated_at)
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
 values(auth.uid(),'execution',item_title,public.circle_trade_details(to_jsonb(source)),'published',now(),'trade',source.id,auth.uid(),p_image_path,'ENTRY · exit / outcome · '||item_title,public.circle_journal_details('trade',to_jsonb(source)))
 on conflict (source_kind,source_owner_id,source_id) where source_id is not null do update
 set title=excluded.title,body=excluded.body,status='published',published_at=coalesce(public.circle_posts.published_at,now()),image_path=excluded.image_path,image_caption=excluded.image_caption,source_image=null,source_details=excluded.source_details
 returning * into item;
 return item;
end $$;

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
 update public.circle_posts set source_details=public.circle_journal_details('trade',to_jsonb(new)),title=coalesce(nullif(left(concat_ws(' · ',nullif(new.market,''),nullif(new.position,''),new.date::text),200),''),'Journal trade entry'), body=public.circle_trade_details(to_jsonb(new))
 where source_kind='trade' and source_id=new.id and source_owner_id=new.user_id;
 return new;
end $$;
revoke all on function public.circle_journal_sources(),public.circle_publish_trade(text,text,text) from public,anon;
grant execute on function public.circle_journal_sources(),public.circle_publish_trade(text,text,text) to authenticated;
revoke all on function public.circle_sync_trade() from public,anon,authenticated;
-- No role, policy, subscription, source record or publication status changes.
