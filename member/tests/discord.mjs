import assert from 'node:assert/strict';
import {createDiscordHandler} from '../../netlify/functions/studio-discord.mjs';
import {webhookUrl,discordMessage} from '../../lib/studio-discord.mjs';
const hook='https://discord.com/api/webhooks/123456789012345678/fake_token_for_local_tests_only';
assert.equal(webhookUrl(hook),hook);
for(const value of ['http://discord.com/api/webhooks/123456789012345678/fake_token_for_local_tests_only','https://evil.example/api/webhooks/123456789012345678/fake_token_for_local_tests_only',hook+'?redirect=evil','https://discord.com.evil.example/api/webhooks/123456789012345678/fake_token_for_local_tests_only'])assert.throws(()=>webhookUrl(value));
const id='00000000-0000-4000-8000-000000000001';
let verified=true,identity=true,record={id,kind:'callout',author_id:'owner',status:'published',title:'Chart',body:'@everyone',image_path:'owner/chart.png'},sent=[],reject=false,crash=false;
const cache=new Map();
const store={get:async key=>cache.get(key)||null,setJSON:async(key,value,opts)=>{if(opts?.onlyIfNew&&cache.has(key))return {modified:false};cache.set(key,value);return {modified:true};},delete:async key=>cache.delete(key)};
const client={
 auth:{getUser:async()=>({data:{user:identity?{id:'owner'}:null}})},
 rpc:async name=>{assert.equal(name,'circle_is_admin');return {data:verified};},
 from:()=>({select(){return this;},eq(){return this;},single:async()=>({data:record})}),
 storage:{from:bucket=>{assert.equal(bucket,'circle-media');return {download:async()=>({data:new Blob(['chart'],{type:'image/png'})})};}}
};
const handler=createDiscordHandler({clientFactory:()=>client,storeFactory:()=>store,send:async(url,opts)=>{sent.push({url,opts});if(crash)throw new Error('Network');return new Response(null,{status:reject?429:200});}});
const context={deploy:{context:'production'}};
const request=(method,body,auth=true)=>new Request('https://lmrcapitals.com/.netlify/functions/studio-discord',{method,headers:{origin:'https://lmrcapitals.com',...(auth?{authorization:'Bearer test-jwt'}:{}),'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});
const run=(method,body)=>handler(request(method,body),context);
assert.equal((await handler(request('GET'),{deploy:{context:'deploy-preview'}})).status,403);
assert.equal((await handler(request('GET',null,false),context)).status,401);
verified=false;assert.equal((await run('GET')).status,403);verified=true;
identity=false;assert.equal((await run('GET')).status,401);identity=true;
for(const category of ['callouts','sessions','announcements'])assert.equal((await run('PUT',{category,webhook:hook})).status,200);
const status=await (await run('GET')).json();assert.deepEqual(status.connected,{callouts:true,sessions:true,announcements:true});assert.ok(!JSON.stringify(status).includes('fake_token'));
assert.equal((await run('PUT',{category:'callouts',webhook:'https://example.com'})).status,400);
record.status='draft';assert.equal((await run('POST',{category:'callouts',id})).status,403);record.status='published';
record.author_id='other';assert.equal((await run('POST',{category:'callouts',id})).status,403);record.author_id='owner';
assert.equal((await (await run('POST',{category:'callouts',id})).json()).status,'sent');
assert.ok(sent[0].opts.body instanceof FormData);assert.ok(sent[0].opts.body.get('files[0]'));assert.deepEqual(JSON.parse(sent[0].opts.body.get('payload_json')).allowed_mentions,{parse:[]});assert.match(sent[0].url,/wait=true/);
assert.equal((await (await run('POST',{category:'callouts',id})).json()).status,'already_sent');assert.equal(sent.length,1);
record={id,title:'Live room',description:'Context',status:'live',session_block:'london',starts_at:'2026-10-13T12:00:00Z',stream_url:'https://private.example/stream'};
assert.equal((await run('POST',{category:'sessions',id})).status,200);assert.ok(!sent[1].opts.body.includes('private.example'));record.status='ended';assert.equal((await run('POST',{category:'sessions',id})).status,200);
record={id,title:'Announcement',body:'Saved update',category:'announcement',target_user_id:'member'};assert.equal((await run('POST',{category:'announcements',id})).status,403);record.target_user_id=null;
reject=true;assert.equal((await run('POST',{category:'announcements',id})).status,502);reject=false;assert.equal((await (await run('POST',{category:'announcements',id})).json()).status,'sent');
record.body='Ambiguous failure';crash=true;assert.equal((await run('POST',{category:'announcements',id})).status,502);crash=false;assert.equal((await (await run('POST',{category:'announcements',id})).json()).status,'pending');
assert.equal((await run('PUT',{category:'sessions',webhook:null})).status,200);assert.equal((await (await run('POST',{category:'sessions',id})).json()).status,'not_configured');
assert.equal(discordMessage('sessions',{title:'Room',starts_at:'2026-10-13T12:00:00Z'}).embeds[0].url,'https://lmrcapitals.com/inner-circle#live');
console.log('PASS: verified admin/MFA boundary, production isolation, three private settings, validated destinations, saved published records, attached image, no mentions/private stream links, duplicate suppression, status changes, failures, disconnect and no secret in responses.');
