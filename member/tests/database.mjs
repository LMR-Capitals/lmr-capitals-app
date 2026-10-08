import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
// Keep the PostgreSQL test runtime outside production dependencies.
const { PGlite } = await import(
  process.env.PGLITE_MODULE ||
    "/private/tmp/lmr-circle-tests/node_modules/@electric-sql/pglite/dist/index.js"
);
const db = new PGlite();
await db.exec(`
create role anon;create role authenticated;create role service_role bypassrls;
create schema auth;create schema storage;
create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
create function auth.jwt() returns jsonb language sql stable as $$select jsonb_build_object('aal',current_setting('request.jwt.claim.aal',true))$$;
create table auth.users(id uuid primary key);
create table public.admins(user_id uuid primary key references auth.users);
create table public.comp_access(user_id uuid primary key references auth.users);
create table public.subscriptions(user_id uuid primary key references auth.users,stripe_customer_id text,stripe_subscription_id text,status text,price_id text,current_period_end timestamptz,cancel_at_period_end boolean default false,updated_at timestamptz default now());
create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
create table public.trades(user_id uuid not null references auth.users, note text);
alter table public.trades enable row level security;
create policy own_trades on public.trades for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
grant select,insert,update,delete on public.trades to authenticated;
create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);
alter table storage.objects enable row level security;
alter table public.subscriptions enable row level security;
alter table public.comp_access enable row level security;
create policy own_subscription_read on public.subscriptions for select to authenticated using(user_id=auth.uid());
create policy own_comp_read on public.comp_access for select to authenticated using(user_id=auth.uid());
grant usage on schema auth,storage,public to authenticated,anon,service_role;
grant select on public.admins,public.subscriptions,public.comp_access to authenticated;
grant all on public.subscriptions to service_role;
grant select,insert,update,delete on storage.objects to authenticated;
`);
const sql = await readFile(
  new URL("../../database/patches/inner-circle.sql", import.meta.url),
  "utf8",
);
const learningSql = await readFile(
  new URL("../../database/patches/inner-circle-learning.sql", import.meta.url),
  "utf8",
);
await db.exec(sql);
await db.exec(learningSql);
await db.exec(sql);
await db.exec(learningSql); // both patches are re-runnable
const ids = {
  admin: "00000000-0000-4000-8000-000000000001",
  member: "00000000-0000-4000-8000-000000000002",
  trial: "00000000-0000-4000-8000-000000000003",
  expired: "00000000-0000-4000-8000-000000000004",
  other: "00000000-0000-4000-8000-000000000005",
  comp: "00000000-0000-4000-8000-000000000006",
  free: "00000000-0000-4000-8000-000000000007",
};
for (const id of Object.values(ids))
  await db.query("insert into auth.users values($1)", [id]);
await db.query("insert into public.admins values($1)", [ids.admin]);
await db.query("insert into public.comp_access values($1)", [ids.comp]);
for (const [who, status, end, paid] of [
  ["member", "active", "1 month", "1 month"],
  ["other", "active", "1 month", "1 month"],
  ["trial", "trialing", "7 days", null],
  ["expired", "active", "-1 day", "-1 day"],
])
  await db.query(
    `insert into subscriptions(user_id,status,stripe_subscription_id,current_period_end,paid_until) values($1,$2,$3,now()+$4::interval,case when $5::text is null then null else now()+$5::interval end)`,
    [ids[who], status, `sub_${who}`, end, paid],
  );
async function as(who, aal = "aal1", role = "authenticated") {
  await db.exec("reset role");
  await db.query(
    "select set_config('request.jwt.claim.sub',$1,false),set_config('request.jwt.claim.aal',$2,false)",
    [ids[who] || "", aal],
  );
  await db.exec(`set role ${role}`);
}
async function scalar(sql, params = []) {
  const r = await db.query(sql, params);
  return Object.values(r.rows[0])[0];
}
async function denied(sql, params = []) {
  await assert.rejects(db.query(sql, params));
}
await as("member");
assert.equal(await scalar("select circle_can_access()"), true);
assert.equal(await scalar("select circle_is_paid()"), true);
await denied(
  "insert into circle_posts(kind,title,status) values('observation','Unauthorized','published')",
);
await denied(
  'select circle_publish_post(\'{"kind":"observation","title":"Bad","body":"No","status":"published"}\',true)',
);
await denied("update subscriptions set status=$1 where user_id=$2", [
  "active",
  ids.member,
]);
await denied("select circle_sync_subscription('{}')");
await as("admin");
assert.equal(await scalar("select circle_can_access()"), false);
await denied(
  "insert into circle_posts(kind,title) values('observation','Admin without MFA')",
);
await as("admin", "aal2");
assert.equal(await scalar("select circle_can_access()"), true);
const post = await scalar(
  "select row_to_json(p) from circle_publish_post($1::jsonb,true) p",
  [
    JSON.stringify({
      kind: "observation",
      title: "Published context",
      body: "Testing the desk",
      status: "published",
      image_path: `${ids.admin}/chart.png`,
    }),
  ],
);
const draft = await scalar(
  "select row_to_json(p) from circle_publish_post($1::jsonb,true) p",
  [
    JSON.stringify({
      kind: "execution",
      title: "Private draft",
      body: "Not yet published",
      status: "draft",
      image_path: `${ids.admin}/draft.png`,
    }),
  ],
);
assert.equal(await scalar("select count(*)::int from circle_notifications"), 1);
await db.query(
  "insert into storage.objects(bucket_id,name) values('circle-media',$1),('circle-media',$2)",
  [post.image_path, draft.image_path],
);
await as("member");
assert.equal(await scalar("select count(*)::int from circle_posts"), 1);
assert.equal(await scalar("select count(*)::int from storage.objects"), 1);
const q = (
  await db.query(
    "insert into circle_questions(title,body) values('Question','Private context') returning id",
  )
).rows[0].id;
await denied(
  "insert into circle_questions(title,body,answer,status) values('Fake','Fake','Fake answer','answered')",
);
await denied(
  "insert into circle_questions(user_id,title,body) values($1,'Spoof','Private')",
  [ids.other],
);
await denied("insert into circle_saved_posts(post_id) values($1)", [draft.id]);
await db.query(
  "insert into circle_mentorship_requests(goals,availability) values('Improve the review process','Monday evenings')",
);
await denied(
  "insert into circle_mentorship_requests(goals,availability) values('Duplicate','Monday')",
);
await as("other");
assert.equal(await scalar("select count(*)::int from circle_questions"), 0);
assert.equal(
  await scalar("select count(*)::int from circle_mentorship_requests"),
  0,
);
await as("trial");
assert.equal(await scalar("select circle_can_access()"), false);
assert.equal(await scalar("select circle_is_paid()"), false);
await denied(
  "insert into circle_mentorship_requests(goals,availability) values('No paid invoice','Monday')",
);
await as("comp");
assert.equal(await scalar("select circle_can_access()"), false);
assert.equal(await scalar("select circle_is_paid()"), false);
await as("expired");
assert.equal(await scalar("select circle_can_access()"), false);
assert.equal(await scalar("select count(*)::int from circle_posts"), 0);
assert.equal(await scalar("select count(*)::int from storage.objects"), 0);
await denied(
  "insert into circle_questions(title,body) values('Expired','No access')",
);
await as("admin", "aal2");
await db.query(
  "update circle_questions set answer='A private answer',status='answered' where id=$1",
  [q],
);
await as("member");
assert.equal(
  await scalar(
    "select count(*)::int from circle_notifications where category='reply'",
  ),
  1,
);
await as("other");
assert.equal(
  await scalar(
    "select count(*)::int from circle_notifications where category='reply'",
  ),
  0,
);
await as("admin", "aal2");
await db.query("select circle_set_post_status($1,'draft')", [post.id]);
await as("member");
assert.equal(await scalar("select count(*)::int from circle_posts"), 0);
assert.equal(await scalar("select count(*)::int from storage.objects"), 0);
// Free accounts receive free resources and announcements, never premium rows.
await as("admin", "aal2");
const freePost = await scalar(
  "select row_to_json(p) from circle_publish_post($1::jsonb,true) p",
  [
    JSON.stringify({
      kind: "terminology",
      title: "Free reference",
      body: "Chapter learning",
      status: "published",
      image_path: `${ids.admin}/free.png`,
    }),
  ],
);
await db.query(
  "insert into storage.objects(bucket_id,name) values('circle-media',$1)",
  [freePost.image_path],
);
await db.query("select circle_publish_session($1)", [
  JSON.stringify({
    title: "Paid live",
    session_block: "ny_am",
    description: "Members only",
    starts_at: new Date().toISOString(),
    status: "live",
    provider: "external",
    stream_url: "https://provider.example/private",
  }),
]);
assert.equal(
  await scalar(
    "select session_block from circle_live_sessions where title='Paid live'",
  ),
  "ny_am",
);
for (const session_block of ["asia", "london", "ny_pm"]) {
  await db.query("select circle_publish_session($1)", [
    JSON.stringify({
      title: session_block,
      description: "Four room check",
      starts_at: new Date().toISOString(),
      status: "scheduled",
      provider: "external",
      stream_url: "https://provider.example/private",
      session_block,
    }),
  ]);
}
assert.equal(
  await scalar(
    "select count(distinct session_block)::int from circle_live_sessions",
  ),
  4,
);
for (const session_block of [undefined, "invalid-room"]) {
  await denied("select circle_publish_session($1)", [
    JSON.stringify({
      title: "Invalid room",
      description: "Rejected",
      starts_at: new Date().toISOString(),
      status: "scheduled",
      provider: "external",
      stream_url: "https://provider.example/private",
      session_block,
    }),
  ]);
}
await denied("update circle_live_sessions set session_block='invalid-room'");
await as("member");
assert.equal(
  (
    await db.query(
      "update circle_live_sessions set session_block='asia' where title='Paid live' returning id",
    )
  ).rows.length,
  0,
  "Members cannot change an admin's session group",
);
await as("admin", "aal2");
await db.query(
  "insert into circle_notifications(title,body,audience) values('Free announcement','Every account','free')",
);
await as("free");
assert.equal(await scalar("select circle_has_account()"), true);
assert.equal(await scalar("select circle_can_access()"), false);
assert.equal(await scalar("select count(*)::int from circle_posts"), 1);
assert.equal(await scalar("select count(*)::int from circle_live_sessions"), 0);
assert.equal(await scalar("select count(*)::int from storage.objects"), 1);
assert.equal(
  await scalar(
    "select count(*)::int from circle_notifications where audience='members'",
  ),
  0,
);
assert.equal(
  await scalar(
    "select count(*)::int from circle_notifications where audience='free'",
  ),
  2,
);
await db.query("insert into circle_saved_posts(post_id) values($1)", [
  freePost.id,
]);
await denied(
  "insert into trades(user_id,note) values($1,'Free trading app write')",
  [ids.free],
);
await denied(
  "insert into circle_learning_progress(user_id,chapter_no,completed_at) values($1,10,now())",
  [ids.free],
);
await denied("select * from circle_private.learning_catalog");
await denied("select circle_record_learning(2,'amd',null)");
await denied(
  "select circle_record_learning(1,null,array['mm-rates','mm-bond'])",
);
await denied("select circle_record_learning(1,'not-a-lesson',null)");
const chapterOne = JSON.parse(
  await readFile(
    new URL("../../design/handoff/terminology.json", import.meta.url),
    "utf8",
  ),
).sections[0];
for (const term of chapterOne.terms)
  await db.query("select circle_record_learning(1,$1,null)", [term]);
await db.query("select circle_record_learning(1,'mm-rates',null)");
assert.equal(
  await scalar(
    "select cardinality(reviewed_terms) from circle_learning_progress where chapter_no=1",
  ),
  chapterOne.terms.length,
);
await denied("select circle_record_learning(1,null,array['wrong','wrong'])");
await db.query(
  "select circle_record_learning(1,null,array['mm-rates','mm-bond'])",
);
assert.equal(
  await scalar(
    "select completed_at is not null from circle_learning_progress where chapter_no=1",
  ),
  true,
);
await db.query("select circle_record_learning(2,'amd',null)");
await denied("select circle_record_learning(3,'t-asian',null)");
await as("other");
assert.equal(
  await scalar("select count(*)::int from circle_learning_progress"),
  0,
);
await db.query("insert into trades(user_id,note) values($1,'Paid app write')", [
  ids.other,
]);
await as("free");
assert.equal(await scalar("select count(*)::int from trades"), 0);
await as("", "aal1", "anon");
await denied("select * from circle_posts");
await denied("select circle_record_learning(1,'mm-rates',null)");
await as("", "aal1", "service_role");
const payload = {
  user_id: ids.member,
  stripe_subscription_id: "sub_member",
  stripe_customer_id: "cus_member",
  status: "canceled",
  current_period_end: new Date().toISOString(),
  stripe_event_created: 200,
};
await db.query("select circle_sync_subscription($1)", [payload]);
await db.query("select circle_sync_subscription($1)", [
  { ...payload, status: "active", stripe_event_created: 100 },
]);
assert.equal(
  await scalar("select status from subscriptions where user_id=$1", [
    ids.member,
  ]),
  "canceled",
);
// Journal-source replication uses the actual additive SQL and existing owner policies.
await db.exec("reset role");
await db.exec(`
create table public.lmr_observations(id text primary key,user_id uuid,title text,content text,created_at timestamptz default now(),updated_at timestamptz default now());
create table public.lmr_achievements(id text primary key,user_id uuid,title text,caption text,image text,category text,firm text,achieved_on date,is_public boolean default false,created_at timestamptz default now(),updated_at timestamptz default now());
alter table public.lmr_observations enable row level security;
alter table public.lmr_achievements enable row level security;
create policy own_obs on public.lmr_observations for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy own_ach on public.lmr_achievements for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
grant select,insert,update,delete on public.lmr_observations,public.lmr_achievements to authenticated;
`);
const journalSql = await readFile(
  new URL("../../database/patches/inner-circle-journal.sql", import.meta.url),
  "utf8",
);
await db.exec(journalSql);
await db.exec(journalSql);
await as("admin", "aal2");
const beforeSources = await scalar("select count(*)::int from circle_posts");
await db.query(
  "insert into lmr_observations(id,user_id,title,content) values('admin-obs',$1,'Source observation','<p>Original <strong>context</strong></p><img src=\"data:image/png;base64,AAAA\">')",
  [ids.admin],
);
await db.query(
  "insert into lmr_achievements(id,user_id,title,caption,image) values('admin-ach',$1,'Source certificate','Reviewed milestone','data:image/png;base64,AAAA')",
  [ids.admin],
);
await as("other");
await db.query(
  "insert into lmr_observations(id,user_id,title,content) values('member-private',$1,'Private notes','Do not share')",
  [ids.other],
);
await denied("select circle_journal_sources()");
await denied("select circle_publish_journal('observation','admin-obs')");
await as("admin");
await denied("select circle_journal_sources()");
await denied("select circle_publish_journal('observation','admin-obs')");
await as("admin", "aal2");
assert.equal(
  await scalar("select count(*)::int from circle_posts"),
  beforeSources,
);
const sources = await scalar("select circle_journal_sources()");
assert.equal(sources.length, 2);
assert.equal(
  sources.some((entry) => entry.id === "member-private"),
  false,
);
await denied("select circle_publish_journal('observation','member-private')");
let notices = await scalar("select count(*)::int from circle_notifications");
const copied = await scalar(
  "select row_to_json(p) from circle_publish_journal('observation','admin-obs') p",
);
assert.equal(copied.source_owner_id, ids.admin);
await as("admin");
await denied("update lmr_observations set content='Unverified update' where id='admin-obs'");
await denied("delete from lmr_observations where id='admin-obs'");
await as("admin", "aal2");
assert.equal(
  copied.source_content,
  '<p>Original <strong>context</strong></p><img src="data:image/png;base64,AAAA">',
);
assert.equal(
  await scalar("select count(*)::int from circle_notifications"),
  notices + 1,
);
await db.query("select circle_publish_journal('observation','admin-obs')");
assert.equal(
  await scalar("select count(*)::int from circle_notifications"),
  notices + 1,
);
assert.equal(
  await scalar(
    "select count(*)::int from circle_posts where source_id='admin-obs'",
  ),
  1,
);
await db.query(
  "update lmr_observations set content='<p>Updated source</p>' where id='admin-obs'",
);
assert.equal(
  await scalar("select source_content from circle_posts where id=$1", [
    copied.id,
  ]),
  "<p>Updated source</p>",
);
assert.equal(
  await scalar("select count(*)::int from circle_notifications"),
  notices + 2,
);
await db.query(
  "update lmr_observations set updated_at=now() where id='admin-obs'",
);
assert.equal(
  await scalar("select count(*)::int from circle_notifications"),
  notices + 2,
);
await as("other");
assert.equal(
  await scalar("select source_content from circle_posts where id=$1", [
    copied.id,
  ]),
  "<p>Updated source</p>",
);
assert.equal(await scalar("select count(*)::int from lmr_observations"), 1);
await as("free");
assert.equal(
  await scalar(
    "select count(*)::int from circle_posts where source_id is not null",
  ),
  0,
);
assert.equal(
  await scalar(
    "select count(*)::int from circle_notifications where title='Source observation'",
  ),
  0,
);
await as("admin", "aal2");
await db.query("select circle_set_post_status($1,'draft')", [copied.id]);
notices = await scalar("select count(*)::int from circle_notifications");
await db.query(
  "update lmr_observations set title='Private revision' where id='admin-obs'",
);
assert.equal(
  await scalar("select status from circle_posts where id=$1", [copied.id]),
  "draft",
);
assert.equal(
  await scalar("select count(*)::int from circle_notifications"),
  notices,
);
await db.query("select circle_publish_journal('observation','admin-obs')");
assert.equal(
  await scalar("select title from circle_posts where id=$1", [copied.id]),
  "Private revision",
);
const certificate = await scalar(
  "select row_to_json(p) from circle_publish_journal('achievement','admin-ach') p",
);
assert.equal(certificate.source_image, "data:image/png;base64,AAAA");
assert.equal(
  await scalar("select is_public from lmr_achievements where id='admin-ach'"),
  false,
);
await db.query(
  "update lmr_achievements set caption='Updated milestone',image='data:image/webp;base64,BBBB' where id='admin-ach'",
);
assert.equal(
  await scalar("select source_image from circle_posts where id=$1", [
    certificate.id,
  ]),
  "data:image/webp;base64,BBBB",
);
notices = await scalar("select count(*)::int from circle_notifications");
await db.query("delete from lmr_observations where id='admin-obs'");
assert.equal(
  await scalar("select count(*)::int from circle_posts where id=$1", [
    copied.id,
  ]),
  0,
);
assert.equal(
  await scalar("select count(*)::int from circle_notifications"),
  notices + 1,
);
const noticeSession = await scalar(
  "select row_to_json(s) from circle_publish_session($1::jsonb) s",
  [
    JSON.stringify({
      title: "Notification coverage",
      description: "Room details",
      starts_at: "2026-10-06T12:00:00Z",
      status: "scheduled",
      provider: "external",
      stream_url: "https://example.com/session",
      session_block: "asia",
    }),
  ],
);
notices = await scalar("select count(*)::int from circle_notifications");
await db.query(
  "update circle_live_sessions set session_block='london',starts_at=starts_at+interval '1 hour' where id=$1",
  [noticeSession.id],
);
await db.query("select circle_set_session_status($1,'live')", [
  noticeSession.id,
]);
await db.query("select circle_set_session_status($1,'ended')", [
  noticeSession.id,
]);
await db.query("select circle_set_session_status($1,'cancelled')", [
  noticeSession.id,
]);
assert.equal(
  await scalar("select count(*)::int from circle_notifications"),
  notices + 4,
);
await db.query("select circle_set_session_status($1,'cancelled')", [
  noticeSession.id,
]);
assert.equal(
  await scalar("select count(*)::int from circle_notifications"),
  notices + 4,
);
console.log(
  "PASS: Journal source copying, images, retries, edit/delete sync, private rows, MFA, paid audience and complete publication/session notification coverage.",
);
{
// New Studio migration runs after the existing, independently verified release.
await db.exec(`reset role;
alter table public.trades add column id text, add column market text, add column position text, add column session text, add column date date, add column img_entry text, add column img_exit text, add column pnl numeric, add column account_id text, add column created_at timestamptz default now(), add column updated_at timestamptz default now();
alter table public.lmr_observations add column session_tag text;
alter table storage.objects add column metadata jsonb default '{}'::jsonb, add column updated_at timestamptz default now();
create function storage.foldername(text) returns text[] language sql immutable as $$select string_to_array($1,'/')$$;
create policy test_journal_image_owner on storage.objects for all to authenticated using(bucket_id='app-images' and split_part(name,'/',1)=auth.uid()::text) with check(bucket_id='app-images' and split_part(name,'/',1)=auth.uid()::text);
`);
await db.exec(await readFile(new URL('../../database/migrations/20261008002338_inner_circle_studio.sql',import.meta.url),'utf8'));
await db.exec('alter table public.lmr_achievements add column amount numeric;');
await db.exec(await readFile(new URL('../../database/migrations/20261008005139_inner_circle_journal_display.sql',import.meta.url),'utf8'));
await as('free');
const freeQuestion = await scalar("insert into circle_questions(title,body) values('Free question','Learning context') returning id");
assert.equal(await scalar('select count(*)::int from circle_questions where id=$1',[freeQuestion]),1);
await denied("insert into circle_questions(title,body,session_id) values('Locked room','No subscription',$1)",[noticeSession.id]);
await denied("select circle_create_observation('circle-00000000-0000-4000-8000-000000000020','Bad','Bad','',null,true)");
await denied('select circle_journal_sources()');
await denied("insert into storage.objects(bucket_id,name) values('circle-avatars',$1)",[`${ids.other}/00000000-0000-4000-8000-000000000020.png`]);
await db.query("insert into storage.objects(bucket_id,name) values('circle-avatars',$1)",[`${ids.free}/00000000-0000-4000-8000-000000000020.png`]);
await db.query("insert into circle_profiles(user_id,display_name,avatar_mode,avatar_path) values($1,'Free member','custom',$2) on conflict(user_id) do update set avatar_mode=excluded.avatar_mode,avatar_path=excluded.avatar_path",[ids.free,`${ids.free}/00000000-0000-4000-8000-000000000020.png`]);
await denied("update circle_profiles set avatar_path=$1 where user_id=$2",[`${ids.other}/00000000-0000-4000-8000-000000000020.png`,ids.free]);
await as('other');
assert.equal(await scalar('select count(*)::int from circle_questions where id=$1',[freeQuestion]),0);
assert.equal(await scalar("select count(*)::int from storage.objects where bucket_id='circle-avatars'"),0);
await as('admin');
await denied('select circle_journal_sources()');
await as('admin','aal2');
notices = await scalar('select count(*)::int from circle_notifications');
const observation = await scalar("select row_to_json(p) from circle_create_observation($1,'Studio observation','<script>unsafe</script>\nContext','NY AM','data:image/png;base64,AAAA',true) p",['circle-00000000-0000-4000-8000-000000000020']);
assert.match(observation.source_content,/&lt;script&gt;/);
assert.equal(await scalar('select content from lmr_observations where id=$1',[observation.source_id]),observation.source_content);
assert.equal(await scalar('select count(*)::int from circle_notifications'),notices+1);
await db.query("select circle_create_observation($1,'Studio observation','<script>unsafe</script>\nContext','NY AM','data:image/png;base64,AAAA',true)",[observation.source_id]);
assert.equal(await scalar('select count(*)::int from circle_notifications'),notices+1); // retries do not create a second publication
await db.query("update circle_questions set answer='A private reply',status='answered' where id=$1",[freeQuestion]);
await db.query("insert into trades(id,user_id,market,position,session,date,img_exit,pnl,account_id) values('studio-trade',$1,'NQ','Long','NY AM','2026-10-07','private-exit',100,'private-account')",[ids.admin]);
await db.query("insert into storage.objects(bucket_id,name,metadata) values('app-images',$1,'{\"mimetype\":\"image/png\"}'),('circle-media',$2,'{\"mimetype\":\"image/png\"}')",[`${ids.admin}/trade-studio-trade-result`,`${ids.admin}/studio-entry.png`]);
for(const slot of ['htf','15m','entry']) await db.query("insert into storage.objects(bucket_id,name,metadata,updated_at) values('app-images',$1,'{\"mimetype\":\"image/png\"}','2026-01-01')",[`${ids.admin}/trade-studio-trade-${slot}`]);
await db.query("insert into trades(id,user_id,img_entry) values('no-result',$1,'data:image/png;base64,AAAA')",[ids.admin]);
const sources = await scalar('select circle_journal_sources()');
const tradeSource = sources.find(source=>source.id==='studio-trade');
assert.equal(tradeSource.image_path,`${ids.admin}/trade-studio-trade-result`);
assert.equal(tradeSource.entry_slot,"result");
assert.equal(tradeSource.entry_label,"ENTRY · exit / outcome");
assert.ok(!JSON.stringify(tradeSource).includes('private-exit'));
assert.ok(!JSON.stringify(tradeSource).includes('private-account'));
const noResult = sources.find(source=>source.id==='no-result');
assert.equal(noResult.image_path,null);
assert.equal(noResult.image,null); // Intraday/legacy fields never substitute for the labelled ENTRY zone
await denied('select circle_publish_trade($1,$2,$3)',['no-result',`${ids.admin}/studio-entry.png`,noResult.entry_version]);

await denied('select circle_publish_trade($1,$2,$3)',['studio-trade',`${ids.admin}/studio-entry.png`,'stale-version']);
const execution = await scalar('select row_to_json(p) from circle_publish_trade($1,$2,$3) p',['studio-trade',`${ids.admin}/studio-entry.png`,tradeSource.entry_version]);
assert.equal(execution.kind,'execution');
assert.equal(execution.source_image,null);
assert.equal(execution.source_details.entry_slot,'result');
assert.equal(execution.image_path,`${ids.admin}/studio-entry.png`);
assert.ok(!execution.body.includes('100'));
// Changing Intraday does not invalidate the independently chosen ENTRY image.
await db.query("update storage.objects set updated_at=now() where name=$1",[`${ids.admin}/trade-studio-trade-entry`]);
await db.query('select circle_publish_trade($1,$2,$3)',['studio-trade',`${ids.admin}/studio-entry.png`,tradeSource.entry_version]);
await db.query("update trades set market='ES' where id='studio-trade'");
assert.match(await scalar('select body from circle_posts where id=$1',[execution.id]),/Market: ES/);
const fullNotes = '<!--obsmeta {"m":"NQ","tf":"5m"}--><p class="o-meta"><strong>NQ · 5m</strong></p><p>Complete original notes<br>Conditions</p>' + ['HTF','Context','Intraday','Entry'].map(label=>`<p><img src="data:image/png;base64,AAAA" alt="${label}"></p>`).join('');
await db.query("update lmr_observations set title=$1,content=$2,session_tag='London',updated_at=now() where id=$3",['Full observation title '.repeat(13),fullNotes,observation.source_id]);
const fullObservation = await scalar('select row_to_json(p) from circle_posts p where id=$1',[observation.id]);
assert.equal(fullObservation.source_content,fullNotes);
assert.equal(fullObservation.source_details.session_tag,'London');
assert.equal(fullObservation.source_details.title,'Full observation title '.repeat(13));
assert.ok(fullObservation.source_details.created_at);
assert.ok(!('user_id' in fullObservation.source_details));
await db.query("update lmr_achievements set title=$1,caption=$2,category='Payout',firm='Original firm',amount=1234.56,achieved_on='2026-10-06' where id='admin-ach'",['Original achievement '.repeat(13),'Full caption '.repeat(2600)]);
const achievement = await scalar("select row_to_json(p) from circle_publish_journal('achievement','admin-ach') p");
assert.equal(achievement.source_details.amount,1234.56);
assert.equal(achievement.source_details.firm,'Original firm');
assert.equal(achievement.source_details.category,'Payout');
assert.equal(achievement.source_details.achieved_on,'2026-10-06');
assert.equal(achievement.source_details.caption,'Full caption '.repeat(2600));
assert.equal(achievement.source_details.title,'Original achievement '.repeat(13));
assert.equal(achievement.source_image,'data:image/webp;base64,BBBB');
assert.equal(await scalar("select is_public from lmr_achievements where id='admin-ach'"),false);
notices = await scalar('select count(*)::int from circle_notifications');
await db.query("update lmr_achievements set amount=2345.67,achieved_on='2026-10-07' where id='admin-ach'");
assert.equal(await scalar("select source_details->>'amount' from circle_posts where id=$1",[achievement.id]),'2345.67');
assert.equal(await scalar('select count(*)::int from circle_notifications'),notices+1);
await db.query('delete from lmr_observations where id=$1',[observation.source_id]);
assert.equal(await scalar('select status from circle_posts where id=$1',[observation.id]),'draft');
assert.equal(await scalar('select source_content from circle_posts where id=$1',[observation.id]),fullNotes);
await as('free');
assert.equal(await scalar('select answer from circle_questions where id=$1',[freeQuestion]),'A private reply');
assert.equal(await scalar("select count(*)::int from circle_notifications where target_user_id=$1 and category='reply'",[ids.free]),1);
assert.equal(await scalar('select count(*)::int from circle_posts where id=$1',[execution.id]),0);
assert.equal(await scalar('select count(*)::int from storage.objects where name=$1',[execution.image_path]),0);
await as('other');
assert.equal(await scalar('select count(*)::int from circle_posts where id=$1',[execution.id]),1);
assert.equal(await scalar('select count(*)::int from storage.objects where name=$1',[execution.image_path]),1);
await as('admin','aal2');
await db.query("delete from trades where id='studio-trade'");
assert.equal(await scalar('select status from circle_posts where id=$1',[execution.id]),'draft');
assert.equal(await scalar('select image_path from circle_posts where id=$1',[execution.id]),execution.image_path);
await as('other');
assert.equal(await scalar('select count(*)::int from circle_posts where id=$1',[execution.id]),0);
console.log('PASS: Studio migration, reversible source withdrawal, atomic observations, retry safety, MFA/owner checks, free/private Q&A and replies, private avatars, entry-only trades, stale chart protection, source sync and paid media.');

}
await db.exec('reset role');
await db.exec(await readFile(new URL('../../database/migrations/20261008010414_inner_circle_journal_newest_first.sql',import.meta.url),'utf8'));
await as('admin','aal2');
await db.query("insert into lmr_observations(id,user_id,title,content,created_at,updated_at) values('sort-obs-old',$1,'Old','<p>Old</p>','2026-10-01','2029-01-01'),('sort-obs-new',$1,'New','<p>New</p>','2026-10-07','2026-10-07')",[ids.admin]);
await db.query("insert into lmr_achievements(id,user_id,title,image,achieved_on,created_at,updated_at) values('sort-ach-old',$1,'Old','data:image/png;base64,AAAA','2026-10-01','2026-10-08','2029-01-01'),('sort-ach-new',$1,'New','data:image/png;base64,AAAA','2026-10-07','2026-10-07','2026-10-07')",[ids.admin]);
await db.query("insert into trades(id,user_id,date,created_at,updated_at) values('sort-trade-old',$1,'2026-10-01','2026-10-08','2029-01-01'),('sort-trade-new',$1,'2026-10-07','2026-10-07','2026-10-07')",[ids.admin]);
const sortedSources = await scalar('select circle_journal_sources()');
for(const [kind,prefix] of [['observation','obs'],['achievement','ach'],['trade','trade']]) assert.deepEqual(sortedSources.filter(s=>s.kind===kind&&s.id.startsWith('sort-')).map(s=>s.id),[`sort-${prefix}-new`,`sort-${prefix}-old`]);
const sortedCopy=await scalar("select row_to_json(p) from circle_publish_journal('observation','sort-obs-old') p");
assert.ok(sortedCopy.source_details.recorded_at.startsWith('2026-10-01'));
await db.query("update lmr_observations set updated_at='2030-01-01',content='<p>Edited old note</p>' where id='sort-obs-old'");
assert.ok((await scalar('select source_details from circle_posts where id=$1',[sortedCopy.id])).recorded_at.startsWith('2026-10-01'));
await as('free');
await denied('select circle_journal_sources()');
console.log('PASS: server Journal source order uses original dates, source-copy metadata stays chronological after editing and MFA guards remain enforced.');
await db.close();
console.log(
  "PASS: migration replay, free/paid/anonymous boundaries, sequential account learning, private checkpoints, application RLS, MFA publishing, mentorship, private media/replies, expiry and webhook ordering.",
);
