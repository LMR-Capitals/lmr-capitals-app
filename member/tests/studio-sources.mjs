import assert from 'node:assert/strict';import {fetchStudioSources,fetchStudioDetail} from '../studio-sources.mjs';
const calls=[];const client={rpc:async(name,args)=>{assert.equal(name,'circle_studio_sources');calls.push(args);return {data:args.p_source_id?{id:'1',charts:[{path:'owner/trade-1-result',version:'current'}]}:args.p_offset===0?Array.from({length:100},(_,i)=>({id:String(i)})):[{id:'last'}]};}};
assert.equal((await fetchStudioSources(client,'trade')).length,101);assert.deepEqual(calls.map(c=>c.p_offset),[0,100]);assert.match((await fetchStudioDetail(client,'trade','1','https://example.com')).charts[0].url,/trade-1-result\?v=current/);
await assert.rejects(fetchStudioDetail({rpc:async()=>({error:{message:'Denied'}})},'observation','1',''),/Denied/);
console.log('PASS: complete Studio source lists, on-demand review details, chart URL versions and denied access.');
