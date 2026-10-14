-- Owner explicitly authorized existing/future observations for paid members.
-- Read-only summaries; full original HTML/charts are fetched one record at a time.
begin;
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
  where o.user_id='05fac964-001e-49d3-bf50-bcf0f31eb96d'::uuid and o.id=p_source_id;
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
  where o.user_id='05fac964-001e-49d3-bf50-bcf0f31eb96d'::uuid
  order by o.created_at desc nulls last,o.id limit 100 offset p_offset
 ) entries;
 return result;
end $$;
revoke all on function circle_private.live_observations(integer,text) from public,anon;
grant execute on function circle_private.live_observations(integer,text) to authenticated;
create or replace function public.circle_live_observations(p_offset integer default 0,p_source_id text default null)
returns jsonb language sql stable security invoker set search_path='' as $$
 select circle_private.live_observations(p_offset,p_source_id);
$$;
revoke all on function public.circle_live_observations(integer,text) from public,anon;
grant execute on function public.circle_live_observations(integer,text) to authenticated;
commit;
