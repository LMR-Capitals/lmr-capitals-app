-- Read-only live feed explicitly authorized by the LMR owner on 13 October 2026.
-- No trade, account, publication, image or RLS rows are changed.
-- Only this owner's trades are opted in; future admins are NOT auto-enrolled.
begin;
create schema if not exists circle_private;
revoke all on schema circle_private from public, anon;
grant usage on schema circle_private to authenticated;
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
  where t.user_id='05fac964-001e-49d3-bf50-bcf0f31eb96d'::uuid
  order by t.date desc nulls last,t.id limit 100 offset p_offset
 ) entries;
 return result;
end $$;
revoke all on function circle_private.live_executions(integer) from public,anon;
grant execute on function circle_private.live_executions(integer) to authenticated;
create or replace function public.circle_live_executions(p_offset integer default 0)
returns jsonb language sql stable security invoker set search_path='' as $$
 select circle_private.live_executions(p_offset);
$$;
revoke all on function public.circle_live_executions(integer) from public,anon;
grant execute on function public.circle_live_executions(integer) to authenticated;
commit;
