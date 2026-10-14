import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
import vm from 'node:vm';
const raw=readFileSync('database/functions/admin-cancel-subscription/index.ts','utf8').replace(/^import .*;$/m,'');
async function attempt({method='POST',verified=false,loggedIn=true,body={user_id:'00000000-0000-0000-0000-000000000001'}}={}){
 let handler,privileged=0,stripeCalls=0;
 const matches=[];
 const query={select(){return this;},eq(k,v){matches.push([k,v]);return this;},maybeSingle:async()=>({data:{stripe_subscription_id:'sub_example'}}),update(){return this;}};
 const context={Response,console:{error(){}},Deno:{env:{get:()=> 'test'},serve:fn=>handler=fn},
 createClient:(_url,_key,options)=>options?{auth:{getUser:async()=>({data:{user:loggedIn?{id:'admin'}:null}})},rpc:async name=>{assert.equal(name,'circle_is_admin');return {data:verified};}}:(privileged++,{from:()=>query}),
 fetch:async()=>{stripeCalls++;return new Response('{}');}};
 vm.runInNewContext(stripTypeScriptTypes(raw),context);
 const response=await handler(new Request('https://example.com/cancel',{method,headers:{Authorization:'Bearer test','Content-Type':'application/json'},...(method==='POST'?{body:JSON.stringify(body)}:{})}));
 return {response,privileged,stripeCalls,matches};
}
for(const options of [{},{verified:false},{loggedIn:false},{method:'GET'}]){
 const r=await attempt(options);assert.ok([401,403,405].includes(r.response.status));assert.equal(r.privileged,0);assert.equal(r.stripeCalls,0);
}
assert.equal((await attempt({verified:true,body:{user_id:'invalid'}})).response.status,400);
const ok=await attempt({verified:true});assert.equal(ok.response.status,200);assert.equal(ok.stripeCalls,1);assert.ok(ok.matches.some(([k,v])=>k==='stripe_subscription_id'&&v==='sub_example'));assert.equal(ok.response.headers.get('Cache-Control'),'no-store');
console.log('PASS: verified MFA required before service-role use or Stripe access; method/input validation; cancellation update bound to original subscription.');
