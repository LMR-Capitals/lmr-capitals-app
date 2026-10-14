create table public.life_os_workspaces (
 user_id uuid primary key references auth.users(id) on delete cascade,
 version integer not null default 1 check(version > 0),
 payload jsonb not null check(jsonb_typeof(payload)='object' and octet_length(payload::text)<=20971520),
 updated_at timestamptz not null default now()
);
alter table public.life_os_workspaces enable row level security;
create policy life_os_owner_admin_select on public.life_os_workspaces for select to authenticated
 using(user_id=(select auth.uid()) and (select public.is_admin()) and (select auth.jwt()->>'aal')='aal2');
create policy life_os_owner_admin_insert on public.life_os_workspaces for insert to authenticated
 with check(user_id=(select auth.uid()) and (select public.is_admin()) and (select auth.jwt()->>'aal')='aal2');
create policy life_os_owner_admin_update on public.life_os_workspaces for update to authenticated
 using(user_id=(select auth.uid()) and (select public.is_admin()) and (select auth.jwt()->>'aal')='aal2')
 with check(user_id=(select auth.uid()) and (select public.is_admin()) and (select auth.jwt()->>'aal')='aal2');
revoke all on public.life_os_workspaces from anon;
grant select,insert,update on public.life_os_workspaces to authenticated;
create function public.life_os_save_workspace(p_version integer,p_payload jsonb) returns integer
language plpgsql security invoker set search_path='' as $$
declare next_version integer;
begin
 if auth.uid() is null or not public.is_admin() or coalesce(auth.jwt()->>'aal','')<>'aal2' then
  raise exception 'Verified administrator access required' using errcode='42501';
 end if;
 if p_version is null or p_version<0 or p_payload is null or jsonb_typeof(p_payload)<>'object'
 or octet_length(p_payload::text)>20971520
 or coalesce(jsonb_typeof(p_payload->'goals'),'')<>'array'
 or coalesce(jsonb_typeof(p_payload->'tasks'),'')<>'array'
 or coalesce(jsonb_typeof(p_payload->'reviews'),'')<>'array'
 or coalesce(jsonb_typeof(p_payload->'reminders'),'')<>'array'
 or coalesce(jsonb_typeof(p_payload->'habits'),'')<>'array' then
  raise exception 'Invalid Life OS workspace' using errcode='22023';
 end if;
 if p_version=0 then
  insert into public.life_os_workspaces(user_id,version,payload) values(auth.uid(),1,p_payload)
  on conflict(user_id) do nothing returning version into next_version;
 else
  update public.life_os_workspaces set version=version+1,payload=p_payload,updated_at=now()
  where user_id=auth.uid() and version=p_version returning version into next_version;
 end if;
 if next_version is null then raise exception 'Newer workspace changes exist' using errcode='40001';end if;
 return next_version;
end;
$$;
revoke all on function public.life_os_save_workspace(integer,jsonb) from public,anon;
grant execute on function public.life_os_save_workspace(integer,jsonb) to authenticated;
