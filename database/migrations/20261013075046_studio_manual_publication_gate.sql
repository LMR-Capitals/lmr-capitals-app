-- Supersedes automatic sharing: only explicitly published sources are member-visible.
-- Source rows, images and existing publication statuses are untouched.
begin;
create or replace function circle_private.live_executions(p_offset integer default 0)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 if auth.uid() is null or not (public.circle_is_admin() or public.circle_is_paid()) then
  raise exception 'Paid membership or verified administrator required' using errcode='42501';
 end if;
 if p_offset < 0 or p_offset is null then raise exception 'Invalid offset'; end if;
 select coalesce(jsonb_agg(item order by recorded desc, source_id),'[]'::jsonb) into result from (
  select t.id as source_id, t.date as recorded,
   jsonb_build_object('id','live-trade:'||t.id,'kind','execution','source_kind','trade',
    'source_id',t.id,'source_owner_id',t.user_id,'live',true,'status','published',
    'title',coalesce(nullif(concat_ws(' · ',nullif(t.market,''),nullif(t.position,''),t.date::text),''),'Journal trade'),
    'body',public.circle_trade_details(to_jsonb(t)), 'created_at',t.created_at,'updated_at',t.updated_at,
    'source_details',(select coalesce(jsonb_object_agg(k,v),'{}'::jsonb) from jsonb_each(to_jsonb(t)) e(k,v)
      where k=any(array['date','market','position','session','time_period','open_time','close_time','models','trade_models','confirmations','emotions','phases','mmm','movement','tframes','rth','htf','pnl','risk','lots','draws','feedback','rr','win','pd_array','plan_followed','grade'])),
    'charts',jsonb_build_array(
      jsonb_build_object('label','Intraday / entry trigger','path',entry.name,'version',entry.updated_at),
      jsonb_build_object('label','Entry / exit outcome','path',outcome.name,'version',outcome.updated_at))) as item
  from public.trades t
  join public.admins a on a.user_id=t.user_id
  left join storage.objects entry on entry.bucket_id='app-images' and entry.name=t.user_id::text||'/trade-'||t.id||'-entry'
  left join storage.objects outcome on outcome.bucket_id='app-images' and outcome.name=t.user_id::text||'/trade-'||t.id||'-result'
  where t.user_id='05fac964-001e-49d3-bf50-bcf0f31eb96d'::uuid and exists(select 1 from public.circle_posts p where p.source_kind='trade' and p.source_id=t.id and p.source_owner_id=t.user_id and p.status='published' and p.published_at<=now())
  order by t.date desc nulls last,t.id limit 100 offset p_offset
 ) entries;
 return result;
end $$;
create or replace function circle_private.live_observations(p_offset integer default 0,p_source_id text default null)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 if auth.uid() is null or not (public.circle_is_admin() or public.circle_is_paid()) then
  raise exception 'Paid membership or verified administrator required' using errcode='42501';
 end if;
 if p_offset is null or p_offset<0 then raise exception 'Invalid offset'; end if;
 if p_source_id is not null then
  select jsonb_build_object('id','live-observation:'||o.id,'kind','observation','source_kind','observation',
   'source_id',o.id,'source_owner_id',o.user_id,'live_observation',true,
   'title',coalesce(nullif(o.title,''),'Untitled observation'),'source_content',o.content,
   'source_details',public.circle_journal_details('observation',to_jsonb(o))) into result
  from public.lmr_observations o join public.admins a on a.user_id=o.user_id
  where o.user_id='05fac964-001e-49d3-bf50-bcf0f31eb96d'::uuid and exists(select 1 from public.circle_posts p where p.source_kind='observation' and p.source_id=o.id and p.source_owner_id=o.user_id and p.status='published' and p.published_at<=now()) and o.id=p_source_id;
  if result is null then raise exception 'Observation is no longer available'; end if;
  return result;
 end if;
 select coalesce(jsonb_agg(item order by recorded desc,source_id),'[]'::jsonb) into result from (
  select o.id as source_id,o.created_at as recorded,
   jsonb_build_object('id','live-observation:'||o.id,'kind','observation','source_kind','observation',
    'source_id',o.id,'source_owner_id',o.user_id,'live_observation',true,'status','published',
    'title',coalesce(nullif(o.title,''),'Untitled observation'),
    'body',left(regexp_replace(coalesce(o.content,''),'<[^>]*>',' ','g'),12000),
    'chart_count',(select count(*) from regexp_matches(coalesce(o.content,''),'<img[[:space:]>]','gi')),
    'created_at',o.created_at,'updated_at',o.updated_at,
    'source_details',public.circle_journal_details('observation',to_jsonb(o))) as item
  from public.lmr_observations o join public.admins a on a.user_id=o.user_id
  where o.user_id='05fac964-001e-49d3-bf50-bcf0f31eb96d'::uuid and exists(select 1 from public.circle_posts p where p.source_kind='observation' and p.source_id=o.id and p.source_owner_id=o.user_id and p.status='published' and p.published_at<=now())
  order by o.created_at desc nulls last,o.id limit 100 offset p_offset
 ) entries;
 return result;
end $$;
commit;
