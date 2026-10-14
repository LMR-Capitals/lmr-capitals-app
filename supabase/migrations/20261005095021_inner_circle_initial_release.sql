-- Initial production release: only new Inner Circle resources and additive subscription columns.
-- Existing application-table and journal-storage policies are preserved.
-- Additive Inner Circle patch. Apply AFTER subscriptions-and-comp-access.sql.
-- Local review artifact: applying this file to a hosted project is a separate release step.
begin;
alter table public.subscriptions add column if not exists paid_until timestamptz;
create or replace function public.circle_can_access() returns boolean language sql stable
set search_path = '' as $$
 select auth.uid() is not null and (
 (coalesce(auth.jwt()->>'aal','') = 'aal2' and exists(select 1 from public.admins where user_id=auth.uid()))
 or exists(select 1 from public.subscriptions where user_id=auth.uid() and status='active' and nullif(stripe_subscription_id,'') is not null and current_period_end > now() and paid_until > now())
 );
$$;
revoke all on function public.circle_can_access() from public, anon;
grant execute on function public.circle_can_access() to authenticated;
create or replace function public.circle_is_admin() returns boolean language sql stable
set search_path = '' as $$
 select auth.uid() is not null and coalesce(auth.jwt()->>'aal','') = 'aal2'
 and exists(select 1 from public.admins where user_id = auth.uid());
$$;
create or replace function public.circle_is_paid() returns boolean language sql stable
set search_path = '' as $$
 select exists(select 1 from public.subscriptions where user_id = auth.uid()
 and status = 'active' and nullif(stripe_subscription_id,'') is not null
 and current_period_end > now() and paid_until > now());
$$;
revoke all on function public.circle_is_admin(), public.circle_is_paid() from public, anon;
grant execute on function public.circle_is_admin(), public.circle_is_paid() to authenticated;
create or replace function public.circle_has_account() returns boolean language sql stable set search_path='' as $$
 select auth.uid() is not null and not coalesce((auth.jwt()->>'is_anonymous')::boolean,false);
$$;
revoke all on function public.circle_has_account() from public,anon;
grant execute on function public.circle_has_account() to authenticated;
create table if not exists public.circle_posts (
 id uuid primary key default gen_random_uuid(), author_id uuid not null default auth.uid() references auth.users,
 kind text not null check(kind in ('observation','execution','achievement','analysis','callout','terminology')),
 title text not null check(length(title) between 1 and 200), body text not null default '' check(length(body)<=30000),
 status text not null default 'draft' check(status in ('draft','published')),
 published_at timestamptz, created_at timestamptz not null default now(),
 image_path text, image_caption text, pinned boolean not null default false
);
create table if not exists public.circle_live_sessions (
 id uuid primary key default gen_random_uuid(), title text not null check(length(title) between 1 and 200),
 description text not null default '', starts_at timestamptz not null,
 status text not null default 'scheduled' check(status in ('scheduled','live','ended','cancelled')),
 provider text not null default 'external', stream_url text check(stream_url is null or stream_url like 'https://%'),
 created_at timestamptz not null default now()
);
-- Legacy rows remain unassigned until an admin chooses their room.
alter table public.circle_live_sessions add column if not exists session_block text
 constraint circle_live_session_block check(session_block in ('asia','london','ny_am','ny_pm'));
create table if not exists public.circle_questions (
 id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users on delete cascade,
 title text not null check(length(title) between 1 and 200), body text not null check(length(body) between 1 and 5000),
 answer text, status text not null default 'open' check(status in ('open','answered','closed')),
 created_at timestamptz not null default now(), session_id uuid references public.circle_live_sessions on delete set null
);
create table if not exists public.circle_notifications (
 id uuid primary key default gen_random_uuid(), title text not null check(length(title) between 1 and 200),
 body text not null check(length(body) between 1 and 5000), target_user_id uuid references auth.users on delete cascade, category text not null default 'announcement',
 created_at timestamptz not null default now()
);
create table if not exists public.circle_notification_reads (
 user_id uuid not null default auth.uid() references auth.users on delete cascade,
 notification_id uuid not null references public.circle_notifications on delete cascade,
 read_at timestamptz not null default now(), primary key(user_id,notification_id)
);
create table if not exists public.circle_preferences (
 user_id uuid primary key default auth.uid() references auth.users on delete cascade,
 live_alerts boolean not null default true, post_alerts boolean not null default true,
 mentorship_alerts boolean not null default true
);
create table if not exists public.circle_profiles (
 user_id uuid primary key default auth.uid() references auth.users on delete cascade,
 display_name text not null check(length(display_name) between 1 and 80), timezone text not null default 'America/New_York',
 bio text not null default '' check(length(bio)<=1000)
);
create table if not exists public.circle_mentorship_requests (
 id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users on delete cascade,
 goals text not null check(length(goals) between 1 and 5000), experience text not null default '', availability text not null,
 status text not null default 'pending' check(status in ('pending','reviewing','approved','scheduled','completed','declined')),
 admin_reply text, created_at timestamptz not null default now()
);
create unique index if not exists circle_one_pending_request on public.circle_mentorship_requests(user_id) where status in ('pending','reviewing','approved','scheduled');
create table if not exists public.circle_saved_posts (
 user_id uuid not null default auth.uid() references auth.users on delete cascade,
 post_id uuid not null references public.circle_posts on delete cascade, primary key(user_id,post_id)
);
create index if not exists circle_posts_feed on public.circle_posts(status,published_at desc);
create index if not exists circle_questions_owner on public.circle_questions(user_id,created_at desc);
create index if not exists circle_live_schedule on public.circle_live_sessions(starts_at desc);
-- Each fresh table has explicit grants AND row policies. No anonymous access.
do $$ declare t text; begin
 foreach t in array array['circle_posts','circle_live_sessions','circle_questions','circle_notifications','circle_notification_reads','circle_preferences','circle_profiles','circle_mentorship_requests','circle_saved_posts'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from anon, authenticated',t);
 execute format('grant select,insert,update,delete on public.%I to authenticated',t);
 execute format('grant all on public.%I to service_role',t);
 end loop;
end $$;
drop policy if exists circle_posts_read on public.circle_posts;
create policy circle_posts_read on public.circle_posts for select to authenticated using
 (public.circle_is_admin() or (public.circle_has_account() and (kind='terminology' or public.circle_can_access()) and status='published' and published_at <= now()));
drop policy if exists circle_posts_admin on public.circle_posts;
create policy circle_posts_admin on public.circle_posts for all to authenticated using(public.circle_is_admin()) with check(public.circle_is_admin());
drop policy if exists circle_live_read on public.circle_live_sessions;
create policy circle_live_read on public.circle_live_sessions for select to authenticated using(public.circle_can_access());
drop policy if exists circle_live_admin on public.circle_live_sessions;
create policy circle_live_admin on public.circle_live_sessions for all to authenticated using(public.circle_is_admin()) with check(public.circle_is_admin());
drop policy if exists circle_questions_read on public.circle_questions;
create policy circle_questions_read on public.circle_questions for select to authenticated using(public.circle_is_admin() or (user_id=auth.uid() and public.circle_can_access()));
drop policy if exists circle_questions_ask on public.circle_questions;
create policy circle_questions_ask on public.circle_questions for insert to authenticated with check(user_id=auth.uid() and public.circle_can_access() and answer is null and status='open');
drop policy if exists circle_questions_admin on public.circle_questions;
create policy circle_questions_admin on public.circle_questions for all to authenticated using(public.circle_is_admin()) with check(public.circle_is_admin());
alter table public.circle_notifications add column if not exists audience text not null default 'members' check(audience in ('free','members'));
drop policy if exists circle_notifications_read on public.circle_notifications;
create policy circle_notifications_read on public.circle_notifications for select to authenticated using(public.circle_is_admin() or (public.circle_has_account() and (target_user_id=auth.uid() or (target_user_id is null and (audience='free' or public.circle_can_access())))));
drop policy if exists circle_notifications_admin on public.circle_notifications;
create policy circle_notifications_admin on public.circle_notifications for all to authenticated using(public.circle_is_admin()) with check(public.circle_is_admin());
drop policy if exists circle_mentorship_read on public.circle_mentorship_requests;
create policy circle_mentorship_read on public.circle_mentorship_requests for select to authenticated using(user_id=auth.uid() or public.circle_is_admin());
drop policy if exists circle_mentorship_request on public.circle_mentorship_requests;
create policy circle_mentorship_request on public.circle_mentorship_requests for insert to authenticated with check(user_id=auth.uid() and public.circle_is_paid() and status='pending' and admin_reply is null);
drop policy if exists circle_mentorship_admin on public.circle_mentorship_requests;
create policy circle_mentorship_admin on public.circle_mentorship_requests for update to authenticated using(public.circle_is_admin()) with check(public.circle_is_admin());
drop policy if exists circle_profiles_admin_read on public.circle_profiles;
create policy circle_profiles_admin_read on public.circle_profiles for select to authenticated using(public.circle_is_admin());
drop policy if exists circle_profiles_own on public.circle_profiles;
create policy circle_profiles_own on public.circle_profiles for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
drop policy if exists circle_preferences_own on public.circle_preferences;
create policy circle_preferences_own on public.circle_preferences for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
drop policy if exists circle_reads_own on public.circle_notification_reads;
create policy circle_reads_own on public.circle_notification_reads for all to authenticated using(user_id=auth.uid() and public.circle_has_account()) with check(user_id=auth.uid() and public.circle_has_account() and exists(select 1 from public.circle_notifications n where n.id=notification_id));
drop policy if exists circle_saved_own on public.circle_saved_posts;
create policy circle_saved_own on public.circle_saved_posts for all to authenticated using(user_id=auth.uid() and public.circle_has_account()) with check(user_id=auth.uid() and public.circle_has_account() and exists(select 1 from public.circle_posts p where p.id=post_id));
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('circle-media','circle-media',false,10485760,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=false,file_size_limit=10485760,allowed_mime_types=array['image/jpeg','image/png','image/webp'];
drop policy if exists circle_media_read on storage.objects;
create policy circle_media_read on storage.objects for select to authenticated using(bucket_id='circle-media' and (public.circle_is_admin() or (public.circle_has_account() and exists(select 1 from public.circle_posts p where p.image_path=name and p.status='published' and p.published_at<=now()))));
drop policy if exists circle_media_admin on storage.objects;
create policy circle_media_admin on storage.objects for all to authenticated using(bucket_id='circle-media' and public.circle_is_admin()) with check(bucket_id='circle-media' and public.circle_is_admin());

-- All visible feed/session changes notify atomically, including direct database updates.
-- Draft saves and no-op writes stay quiet. Definer triggers only run on RLS-authorized writes.
create or replace function public.circle_content_notice() returns trigger
language plpgsql security definer set search_path='' as $$
declare item_title text; item_audience text := 'members'; message text; item_category text;
begin
 if TG_TABLE_NAME='circle_posts' then
  item_category := 'post';
  if TG_OP='DELETE' then
   if (old.status='published' and old.published_at<=now()) is not true then return old; end if;
   item_title := old.title; item_audience := case when old.kind='terminology' then 'free' else 'members' end;
   message := 'LMR removed a publication from the feed.';
  else
   item_title := new.title; item_audience := case when new.kind='terminology' then 'free' else 'members' end;
   if TG_OP='INSERT' then
    if (new.status='published' and new.published_at<=now()) is not true then return new; end if;
    message := 'New '||new.kind||' published by the LMR desk.';
   elsif new is not distinct from old then return new;
   elsif new.status='published' and new.published_at<=now() then
    message := case when old.status='published' then 'LMR updated this publication. Open the feed for the latest version.' else 'A publication is now available in your feed.' end;
   elsif old.status='published' and old.published_at<=now() then
    item_title := old.title; item_audience := case when old.kind='terminology' then 'free' else 'members' end;
    message := 'LMR withdrew this publication from the feed.';
   else return new;
   end if;
  end if;
 else
  item_category := 'live';
  if TG_OP='DELETE' then
   item_title := old.title; message := 'LMR removed this live analysis session. Check the live room for the latest schedule.';
  else
   item_title := new.title;
   if TG_OP='UPDATE' and new is not distinct from old then return new; end if;
   message := case
    when new.status='cancelled' then 'This live analysis session has been cancelled.'
    when new.status='ended' then 'This live analysis session has ended.'
    when new.status='live' and (TG_OP='INSERT' or old.status is distinct from new.status) then 'LMR is live. Open the live analysis room to join.'
    when TG_OP='INSERT' then 'A live analysis session has been announced. Open the live room for details.'
    else 'LMR updated this live session. Check the room, time and viewing details.' end;
  end if;
 end if;
 insert into public.circle_notifications(title,body,category,audience) values(item_title,message,item_category,item_audience);
 if TG_OP='DELETE' then return old; end if;
 return new;
end $$;
revoke all on function public.circle_content_notice() from public,anon,authenticated;
drop trigger if exists circle_post_notice on public.circle_posts;
create trigger circle_post_notice after insert or update or delete on public.circle_posts for each row execute function public.circle_content_notice();
drop trigger if exists circle_session_notice on public.circle_live_sessions;
create trigger circle_session_notice after insert or update or delete on public.circle_live_sessions for each row execute function public.circle_content_notice();

-- Invoker RPCs retain RLS. notify_members is retained for older clients; notices are mandatory.
create or replace function public.circle_publish_post(payload jsonb, notify_members boolean default true)
returns public.circle_posts language plpgsql security invoker set search_path = '' as $$
declare result public.circle_posts;
begin
 if not public.circle_is_admin() then raise exception 'Verified administrator required'; end if;
 insert into public.circle_posts(author_id,kind,title,body,status,published_at,image_path,image_caption,pinned)
 values(auth.uid(),payload->>'kind',payload->>'title',payload->>'body',payload->>'status',
 case when payload->>'status'='published' then now() else null end,
 nullif(payload->>'image_path',''),payload->>'image_caption',coalesce((payload->>'pinned')::boolean,false)) returning * into result;
 return result;
end $$;
create or replace function public.circle_publish_session(payload jsonb)
returns public.circle_live_sessions language plpgsql security invoker set search_path = '' as $$
declare result public.circle_live_sessions;
begin
 if not public.circle_is_admin() then raise exception 'Verified administrator required'; end if;
 if payload->>'session_block' is null or payload->>'session_block' not in ('asia','london','ny_am','ny_pm') then raise exception 'Choose Asia, London, NY AM or NY PM'; end if;
 insert into public.circle_live_sessions(title,description,starts_at,status,provider,stream_url,session_block)
 values(payload->>'title',payload->>'description',(payload->>'starts_at')::timestamptz,payload->>'status',payload->>'provider',payload->>'stream_url',payload->>'session_block') returning * into result;
 return result;
end $$;
-- Private replies generate private notifications in the same transaction.
create or replace function public.circle_reply_notice() returns trigger language plpgsql security invoker set search_path = '' as $$
begin
 if not public.circle_is_admin() then raise exception 'Verified administrator required'; end if;
 if TG_TABLE_NAME='circle_questions' then
  if new.answer is distinct from old.answer and new.answer is not null then
   insert into public.circle_notifications(title,body,category,target_user_id) values('LMR answered your question','Open Questions & answers to read your private reply.','reply',new.user_id);
  end if;
 else
  if new.admin_reply is distinct from old.admin_reply or new.status is distinct from old.status then
   insert into public.circle_notifications(title,body,category,target_user_id) values('Your mentorship request has an update','Open Private mentorship to read the response from LMR.','mentorship',new.user_id);
  end if;
 end if;
 return new;
end $$;
drop trigger if exists circle_question_reply on public.circle_questions;
create trigger circle_question_reply after update on public.circle_questions for each row execute function public.circle_reply_notice();
drop trigger if exists circle_mentorship_reply on public.circle_mentorship_requests;
create trigger circle_mentorship_reply after update on public.circle_mentorship_requests for each row execute function public.circle_reply_notice();
revoke all on function public.circle_publish_post(jsonb,boolean), public.circle_publish_session(jsonb), public.circle_reply_notice() from public,anon;
grant execute on function public.circle_publish_post(jsonb,boolean), public.circle_publish_session(jsonb), public.circle_reply_notice() to authenticated;


-- Service-only monotonic webhook write; older deliveries cannot roll status back.
alter table public.subscriptions add column if not exists stripe_event_created bigint not null default 0;
create or replace function public.circle_sync_subscription(payload jsonb) returns void
language plpgsql security invoker set search_path = '' as $$
begin
 insert into public.subscriptions(user_id,stripe_customer_id,stripe_subscription_id,status,price_id,current_period_end,cancel_at_period_end,paid_until,stripe_event_created,updated_at)
 values((payload->>'user_id')::uuid,payload->>'stripe_customer_id',payload->>'stripe_subscription_id',payload->>'status',payload->>'price_id',(payload->>'current_period_end')::timestamptz,coalesce((payload->>'cancel_at_period_end')::boolean,false),(payload->>'paid_until')::timestamptz,(payload->>'stripe_event_created')::bigint,now())
 on conflict(user_id) do update set stripe_customer_id=excluded.stripe_customer_id,stripe_subscription_id=excluded.stripe_subscription_id,status=excluded.status,price_id=excluded.price_id,current_period_end=excluded.current_period_end,cancel_at_period_end=excluded.cancel_at_period_end,paid_until=case when excluded.stripe_subscription_id=public.subscriptions.stripe_subscription_id then greatest(excluded.paid_until,public.subscriptions.paid_until) else excluded.paid_until end,stripe_event_created=excluded.stripe_event_created,updated_at=now()
 where excluded.stripe_event_created >= public.subscriptions.stripe_event_created;
end $$;
revoke all on function public.circle_sync_subscription(jsonb) from public,anon,authenticated;
grant execute on function public.circle_sync_subscription(jsonb) to service_role;


create or replace function public.circle_set_post_status(post_id uuid,new_status text)
returns void language plpgsql security invoker set search_path = '' as $$
declare result public.circle_posts;
begin
 if not public.circle_is_admin() then raise exception 'Verified administrator required'; end if;
 update public.circle_posts set status=new_status,published_at=case when new_status='published' then coalesce(published_at,now()) else null end where id=post_id returning * into result;
 if not found then raise exception 'Post not found'; end if;
end $$;
create or replace function public.circle_set_session_status(session_id uuid,new_status text)
returns void language plpgsql security invoker set search_path = '' as $$
declare result public.circle_live_sessions;
begin
 if not public.circle_is_admin() then raise exception 'Verified administrator required'; end if;
 update public.circle_live_sessions set status=new_status where id=session_id returning * into result;
 if not found then raise exception 'Session not found'; end if;
end $$;
revoke all on function public.circle_set_post_status(uuid,text),public.circle_set_session_status(uuid,text) from public,anon;
grant execute on function public.circle_set_post_status(uuid,text),public.circle_set_session_status(uuid,text) to authenticated;
commit;
