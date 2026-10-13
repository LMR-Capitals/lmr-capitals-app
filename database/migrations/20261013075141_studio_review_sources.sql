-- Admin-only review: small source lists and one original record at a time.
begin;
create or replace function public.circle_studio_sources(p_kind text,p_source_id text default null,p_offset integer default 0)
returns jsonb language plpgsql stable security invoker set search_path='' as $$
declare result jsonb;
begin
 if not public.circle_is_admin() then raise exception 'Verified administrator required' using errcode='42501'; end if;
 if p_kind is null or p_kind not in ('trade','observation') or p_offset is null or p_offset<0 then raise exception 'Invalid source selection'; end if;
 if p_kind='observation' then
  select coalesce(jsonb_agg(item order by recorded desc,source_id),'[]'::jsonb) into result from (
   select o.id as source_id,o.created_at as recorded,
    jsonb_build_object('id',o.id,'kind','observation','title',coalesce(nullif(o.title,''),'Untitled observation'),'created_at',o.created_at,'updated_at',o.updated_at)
    || case when p_source_id is not null then jsonb_build_object('content',o.content,'session_tag',o.session_tag) else '{}'::jsonb end as item
   from public.lmr_observations o where o.user_id=auth.uid() and (p_source_id is null or o.id=p_source_id)
   order by o.created_at desc nulls last,o.id limit 100 offset p_offset
  ) items;
 else
  select coalesce(jsonb_agg(item order by recorded desc,source_id),'[]'::jsonb) into result from (
   select t.id as source_id,t.date as recorded,
    jsonb_build_object('id',t.id,'kind','trade','title',coalesce(nullif(concat_ws(' · ',nullif(t.market,''),nullif(t.position,''),t.date::text),''),'Journal trade'),'date',t.date,'updated_at',t.updated_at,'created_at',t.created_at)
    || case when p_source_id is not null then jsonb_build_object('body',public.circle_trade_details(to_jsonb(t)),
     'image_path',outcome.name,'entry_version',outcome.updated_at::text,
     'source_details',(select coalesce(jsonb_object_agg(k,v),'{}'::jsonb) from jsonb_each(to_jsonb(t)) e(k,v)
       where k=any(array['date','market','position','session','open_time','close_time','models','trade_models','confirmations','emotions','phases','mmm','movement','tframes','rth','htf','pnl','risk','lots','draws','feedback','rr','pd_array','plan_followed','grade'])),
     'charts',jsonb_build_array(jsonb_build_object('label','Intraday / entry trigger','path',entry.name,'version',entry.updated_at),jsonb_build_object('label','Entry / exit outcome','path',outcome.name,'version',outcome.updated_at))) else '{}'::jsonb end as item
   from public.trades t
   left join storage.objects entry on entry.bucket_id='app-images' and entry.name=t.user_id::text||'/trade-'||t.id||'-entry'
   left join storage.objects outcome on outcome.bucket_id='app-images' and outcome.name=t.user_id::text||'/trade-'||t.id||'-result'
   where t.user_id=auth.uid() and (p_source_id is null or t.id=p_source_id)
   order by t.date desc nulls last,t.id limit 100 offset p_offset
  ) items;
 end if;
 if p_source_id is not null then
  if jsonb_array_length(result)=0 then raise exception 'Source not found in your Journal'; end if;
  return result->0;
 end if;
 return result;
end $$;
revoke all on function public.circle_studio_sources(text,text,integer) from public,anon;
grant execute on function public.circle_studio_sources(text,text,integer) to authenticated;
commit;
