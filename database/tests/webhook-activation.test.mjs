import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import Stripe from 'stripe';
import {PGlite} from '@electric-sql/pglite';
import {transformWithOxc} from 'vite';
import {paidSubscriptionState} from '../functions/_shared/subscription-state.mjs';
const root=fileURLToPath(new URL('../../',import.meta.url));
// Synthetic Stripe data only: no real accounts, keys, payments or member records.
const start=Math.floor(Date.now()/1000),end=start+604800;
const fixture={subscription:{id:'sub_fixture',customer:'cus_fixture',created:start,livemode:false,status:'active',cancel_at_period_end:false,metadata:{user_id:'00000000-0000-0000-0000-000000000123'},items:{data:[{id:'si_fixture',price:{id:'price_fixture'},current_period_end:end}]},latest_invoice:{id:'in_fixture',status:'paid',amount_paid:2800,lines:{data:[{parent:{subscription_item_details:{subscription_item:'si_fixture'}},period:{end}}]}}},event:{id:'evt_fixture',livemode:false,type:'checkout.session.completed',created:start,data:{object:{id:'cs_fixture',mode:'subscription',subscription:'sub_fixture',client_reference_id:'00000000-0000-0000-0000-000000000123',metadata:{},amount_total:2800,currency:'usd'}}}};
assert.equal(fixture.event.livemode,false);assert.equal(fixture.subscription.livemode,false);
const uid='00000000-0000-0000-0000-000000000123',other='00000000-0000-0000-0000-000000000124',administrator='00000000-0000-0000-0000-000000000125';
const db=new PGlite();
await db.exec(`
create role anon;create role authenticated;create role service_role bypassrls;
create schema auth;
create table auth.users(id uuid primary key,email text);
create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('test.uid',true),'')::uuid$$;
create function auth.jwt() returns jsonb language sql stable as $$select jsonb_build_object('aal',current_setting('test.aal',true))$$;
create table public.admins(user_id uuid primary key);
create function public.circle_is_admin() returns boolean language sql stable set search_path='' as $$ select auth.uid() is not null and coalesce(auth.jwt()->>'aal','')='aal2' and exists(select 1 from public.admins where user_id=auth.uid()); $$;
create table public.subscriptions(user_id uuid primary key,status text,price_id text,current_period_end timestamptz,cancel_at_period_end boolean,stripe_subscription_id text,updated_at timestamptz,paid_until timestamptz,stripe_event_created bigint,stripe_customer_id text);
alter table subscriptions enable row level security;
create policy own_subscription on subscriptions for select to authenticated using(user_id=auth.uid());
grant usage on schema auth,public to anon,authenticated,service_role;
grant execute on function auth.uid(),auth.jwt() to anon,authenticated,service_role;
grant select on subscriptions,admins to authenticated;grant all on subscriptions to service_role;
create function public.circle_can_access() returns boolean language sql stable set search_path='' as $$
 select auth.uid() is not null and ((coalesce(auth.jwt()->>'aal','')='aal2' and exists(select 1 from public.admins where user_id=auth.uid())) or exists(select 1 from public.subscriptions where user_id=auth.uid() and status='active' and nullif(stripe_subscription_id,'') is not null and current_period_end>now() and paid_until>now())); $$;
create table trades(user_id uuid,note text);alter table trades enable row level security;
create policy owner_trades on trades for select to authenticated using(user_id=auth.uid());grant select on trades to authenticated;
insert into auth.users values('${uid}','fixture@example.com'),('${other}','other@example.com'),('${administrator}','admin@example.com');
insert into admins values('${administrator}');insert into trades values('${uid}','isolated fixture');
`);
await db.exec(readFileSync(root+'/database/migrations/20261013120000_membership_agreements.sql','utf8'));
await db.exec(readFileSync(root+'/database/migrations/20261013122000_checkout_acceptance_source.sql','utf8'));
await db.exec(readFileSync(root+'/database/migrations/20261013123000_membership_explicit_grants.sql','utf8'));
await db.exec(readFileSync(root+'/database/patches/launch-journal-membership.sql','utf8'));
await db.exec(readFileSync(root+'/database/patches/launch-billing-reviews.sql','utf8'));
await db.exec(`insert into circle_legal_documents(version,documents) values('sandbox-fixture-v1','{"terms":"TEST ONLY simulated local agreement"}');update circle_membership_launch set legal_version='sandbox-fixture-v1';update circle_membership_plans set enabled=true;select set_config('test.uid','${uid}',false);select set_config('test.aal','aal1',false);set role authenticated;`);
const ack={terms:true,privacy:true,risk:true,adult:true,renewal:true};
const acceptance=(await db.query(`select circle_accept_agreement('sandbox-fixture-v1',$1::jsonb,'weekly') as id`,[JSON.stringify(ack)])).rows[0].id;
await db.exec('reset role');
const consent=(await db.query('select * from circle_agreement_acceptances where id=$1',[acceptance])).rows[0];
// Only consent-link metadata is rebound to a locally generated test agreement.
// Paid amount, real sandbox invoice lines and subscription identifiers are unchanged.
fixture.subscription.metadata={...fixture.subscription.metadata,agreement_id:acceptance,legal_version:consent.legal_version};
fixture.event.data.object.metadata={...fixture.event.data.object.metadata,agreement_id:acceptance,legal_version:consent.legal_version,agreement_hash:consent.content_hash};
await db.query('insert into subscriptions(user_id,stripe_customer_id) values($1,$2)',[uid,fixture.subscription.customer]);
const ident=v=>{if(!/^[a-z_]+$/.test(v))throw Error('Invalid identifier');return '"'+v+'"';};
const admin={from(table){const filters=[];return {select(){return this;},eq(key,value){filters.push([key,value]);return this;},async single(){return this.maybeSingle();},async maybeSingle(){try{await db.exec('reset role;set role service_role');
const result=await db.query('select * from '+ident(table)+(filters.length?' where '+filters.map(([k],i)=>ident(k)+'=$'+(i+1)).join(' and '):''),filters.map(([,v])=>v));return {data:result.rows[0]||null,error:null};}catch(error){return {data:null,error};}},async upsert(record,options){try{await db.exec('reset role;set role service_role');const keys=Object.keys(record);await db.query('insert into '+ident(table)+'('+keys.map(ident).join(',')+') values('+keys.map((_,i)=>'$'+(i+1)).join(',')+') on conflict('+ident(options.onConflict)+') do nothing',keys.map(k=>record[k]));return {error:null};}catch(error){return {error};}}};},async rpc(name,args){try{assert.equal(name,'circle_sync_subscription');await db.exec('reset role;set role service_role');await db.query('select circle_sync_subscription($1::jsonb)',[JSON.stringify(args.payload)]);return {error:null};}catch(error){return {error};}}};
const sdk=new Stripe('sk_test_local_fixture_only');
let currentSub=fixture.subscription;
const stripe={webhooks:sdk.webhooks,subscriptions:{async retrieve(id){assert.equal(id,currentSub.id);return structuredClone(currentSub);}}};
stripe.charges={async retrieve(id){assert.equal(id,'ch_local');return {id,customer:fixture.subscription.customer,payment_intent:'pi_local',currency:'usd'};}};
stripe.invoicePayments={async list(params){assert.equal(params.payment.payment_intent,'pi_local');return {data:[{invoice:'in_local'}],has_more:false};}};
stripe.invoices={async retrieve(id){assert.equal(id,'in_local');return {parent:{subscription_details:{subscription:fixture.subscription.id}}};}};
let handler;
const source=readFileSync(root+'/database/functions/stripe-webhook/index.ts','utf8').replace(/^import[\s\S]*?;\n/gm,'');
const transformed=await transformWithOxc(source,'webhook.ts');
const secret='whsec_local_fixture_only_not_a_real_secret';
vm.runInNewContext(transformed.code,{Stripe,stripeClient:()=>stripe,createClient:()=>admin,paidSubscriptionState,Request,Response,console,Deno:{env:{get:key=>key==='STRIPE_WEBHOOK_SECRET'?secret:'isolated-local-fixture'},serve:fn=>handler=fn}});
async function deliver(event,{invalid=false}={}){const payload=JSON.stringify(event);const signature=invalid?'t=1,v1=invalid':sdk.webhooks.generateTestHeaderString({payload,secret});return handler(new Request('http://localhost/local-webhook',{method:'POST',headers:{'stripe-signature':signature},body:payload}));}
async function access(id,aal='aal1'){await db.exec(`reset role;set role authenticated;select set_config('test.uid','${id}',false);select set_config('test.aal','${aal}',false);`);return {allowed:(await db.query('select circle_can_access() as yes')).rows[0].yes,trades:(await db.query('select count(*)::int n from trades')).rows[0].n};}
assert.equal((await access(uid)).allowed,false,'Unpaid before webhook');
assert.equal((await deliver(fixture.event,{invalid:true})).status,400);
assert.equal((await access(uid)).allowed,false,'Invalid signature cannot activate');
let response=await deliver(fixture.event);assert.equal(response.status,200,await response.text());
assert.deepEqual(await access(uid),{allowed:true,trades:1},'Paid webhook grants owner access');
assert.deepEqual(await access(other),{allowed:false,trades:0},'Free other account denied');
response=await deliver(fixture.event);assert.equal(response.status,200);
await db.exec('reset role');assert.equal((await db.query('select count(*)::int n from circle_checkout_receipts')).rows[0].n,1,'Duplicate event does not duplicate receipt');
assert.equal((await access(administrator,'aal1')).allowed,false,'Admin without MFA denied');
assert.equal((await access(administrator,'aal2')).allowed,true,'Registered admin MFA allowed');
await db.exec('reset role');await db.query("update subscriptions set paid_until=now()-interval '1 second' where user_id=$1",[uid]);
assert.equal((await access(uid)).allowed,false,'Expired paid access denied');
const expired=await access(uid);assert.equal(expired.trades,0);
await db.exec('reset role');
// Exercise subscription lifecycle branches against the same isolated database.
currentSub=structuredClone(fixture.subscription);
currentSub.status='canceled';
let lifecycle={id:'evt_local_cancel',type:'customer.subscription.deleted',created:fixture.event.created+10,data:{object:{id:currentSub.id}},livemode:false};
assert.equal((await deliver(lifecycle)).status,200);
assert.equal((await access(uid)).allowed,false,'Cancellation revokes access');
// An older paid checkout must not restore access after a newer cancellation.
currentSub=structuredClone(fixture.subscription);
assert.equal((await deliver(fixture.event)).status,200);
assert.equal((await access(uid)).allowed,false,'Old event cannot override newer cancellation');
currentSub.status='past_due';currentSub.latest_invoice.status='open';currentSub.latest_invoice.amount_paid=0;
lifecycle={id:'evt_local_failed_renewal',type:'invoice.payment_failed',created:fixture.event.created+20,data:{object:{parent:{subscription_details:{subscription:currentSub.id}}}},livemode:false};
assert.equal((await deliver(lifecycle)).status,200);
assert.equal((await access(uid)).allowed,false,'Failed renewal does not grant access');
// Mismatched consent must fail instead of acknowledging an invalid receipt.
const badConsent=structuredClone(fixture.event);badConsent.id='evt_local_bad_agreement';badConsent.data.object.metadata.agreement_hash='wrong';
assert.equal((await deliver(badConsent)).status,500,'Agreement mismatch is rejected for retry/review');
await db.exec('reset role');assert.equal((await db.query('select count(*)::int n from circle_checkout_receipts')).rows[0].n,1);
// Asynchronous success follows the same verified consent/payment path.
currentSub=structuredClone(fixture.subscription);
const asyncSuccess=structuredClone(fixture.event);asyncSuccess.type='checkout.session.async_payment_succeeded';asyncSuccess.created+=40;
assert.equal((await deliver(asyncSuccess)).status,200);
assert.equal((await access(uid)).allowed,true);
for(const type of ['charge.refunded','charge.dispute.created','radar.early_fraud_warning.created','checkout.session.async_payment_failed']){
  const object=type==='charge.refunded'?{id:'ch_local',customer:fixture.subscription.customer,payment_intent:'pi_local',amount_refunded:500,currency:'usd'}:type==='checkout.session.async_payment_failed'?{id:'cs_local',customer:fixture.subscription.customer,subscription:fixture.subscription.id}:{id:'obj_'+type,charge:'ch_local',amount:2800,reason:'fixture'};
  const event={id:'evt_'+type,type,created:fixture.event.created+50,data:{object},livemode:false};
  const r=await deliver(event);assert.equal(r.status,200,await r.text());assert.equal((await access(uid)).allowed,true,'Risk event does not revoke access');
  assert.equal((await deliver(event)).status,200);
}
await db.exec('reset role');
assert.equal((await db.query('select count(*)::int n from circle_billing_reviews')).rows[0].n,4,'Deduplicated risk events');
assert.equal((await db.query('select count(*)::int n from circle_billing_reviews where stripe_subscription_id=$1',[fixture.subscription.id])).rows[0].n,4,'Current API invoice graph mapping');
await access(uid);await assert.rejects(()=>db.query('select * from circle_billing_reviews'),/permission denied/);
await assert.rejects(()=>db.query('select circle_admin_billing_reviews()'),/Administrator MFA required/);
await access(administrator,'aal1');await assert.rejects(()=>db.query('select circle_admin_billing_reviews()'),/Administrator MFA required/);
await access(administrator,'aal2');assert.equal((await db.query('select circle_admin_billing_reviews() r')).rows[0].r.length,4);
await db.query("select circle_admin_review_billing_event('evt_charge.refunded')");
assert.equal((await deliver({id:'evt_charge.refunded',type:'charge.refunded',created:fixture.event.created+50,data:{object:{id:'ch_local',customer:fixture.subscription.customer,amount_refunded:500,currency:'usd'}},livemode:false})).status,200);
await db.exec('reset role');assert.ok((await db.query("select reviewed_at from circle_billing_reviews where stripe_event_id='evt_charge.refunded'")).rows[0].reviewed_at,'Retry preserves reviewed state');
const result={passed:true,environment:'isolated PGlite + deployed webhook source + Stripe SDK 22.4.0',checks:['unpaid denied','bad signature denied','verified checkout activates owner','free other user denied','duplicate receipt idempotent','admin requires MFA','expired Journal denied','cancellation revokes access','out-of-order event ignored','failed renewal denied','agreement mismatch rejected','async payment success activates','risk events preserve access','risk events deduplicate','current invoice payment graph resolves subscription','review queue requires admin MFA','retry preserves reviewed state'],limitation:'Synthetic signed local integration test; does not prove Stripe network delivery or production activation.'};
console.log(JSON.stringify(result));await db.close();
