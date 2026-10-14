import assert from 'node:assert/strict';import {fetchStudioSources,fetchStudioDetail} from '../studio-sources.mjs';
const calls=[];const client={storage:{from:()=>({createSignedUrls:async paths=>({data:paths.map(path=>({path,signedUrl:'https://example.com/'+path+'?token=short-lived'}))})})},rpc:async(name,args)=>{assert.equal(name,'circle_studio_sources');calls.push(args);return {data:args.p_source_id?{id:'1',charts:[{path:'owner/trade-1-result',version:'current'}]}:args.p_offset===0?Array.from({length:100},(_,i)=>({id:String(i)})):[{id:'last'}]};}};
assert.equal((await fetchStudioSources(client,'trade')).length,101);assert.deepEqual(calls.map(c=>c.p_offset),[0,100]);assert.match((await fetchStudioDetail(client,'trade','1','https://example.com')).charts[0].url,/trade-1-result\?token=short-lived/);
await assert.rejects(fetchStudioDetail({rpc:async()=>({error:{message:'Denied'}})},'observation','1',''),/Denied/);
console.log('PASS: complete Studio source lists, on-demand review details, chart URL versions and denied access.');

const {fetchStudioTrades}=await import('../studio-sources.mjs');
const {filterExecutionSession}=await import('../executions.mjs');
const archive=Array.from({length:236},(_,i)=>({id:`trade-${i}`,date:i<100?'2026-10-13':'2026-09-01',kind:'trade'}));
const reads=[];
const sessionClient={
 rpc:async(name,args)=>({data:archive.slice(args.p_offset,args.p_offset+100)}),
 auth:{getUser:async()=>({data:{user:{id:'owner'}}})},
 from(table){assert.equal(table,'trades');return {
  select(columns){assert.equal(columns,'id,session');return this;},
  eq(column,value){assert.equal(column,'user_id');assert.equal(value,'owner');return this;},
  async in(column,ids){assert.equal(column,'id');reads.push(ids.length);return {data:ids.map(id=>({id,session:Number(id.split('-')[1])%2?'London Open':'AM'}))};}
 };}
};
const all=await fetchStudioTrades(sessionClient);
assert.equal(all.length,236);assert.deepEqual(reads,[100,100,36]);
assert.equal(filterExecutionSession(all,'NY AM').length,118);
assert.equal(filterExecutionSession(all,'London Open').length,118);
assert.ok(filterExecutionSession(all,'London Open').some(row=>row.date==='2026-09-01'));
assert.deepEqual(archive[0].source_details,undefined);
await assert.rejects(fetchStudioTrades({...sessionClient,auth:{getUser:async()=>({error:{message:'Expired'}})}}),/Expired/);
await assert.rejects(fetchStudioTrades({...sessionClient,from:()=>({select(){return this;},eq(){return this;},in:async()=>({error:{message:'Denied sessions'}})})}),/Denied sessions/);
console.log('PASS: all 236 historical trades, owner-scoped batched session reads, matching filters across dates, immutable sources and read failures.');
