import assert from 'node:assert/strict';
import {mergeExecutions,fetchLiveExecutions,executionDetails,executionSession,filterExecutionSession} from '../executions.mjs';
const live={id:'live:a',source_id:'a',source_owner_id:'owner',source_kind:'trade',kind:'execution',source_details:{date:'2026-10-13',pnl:0,feedback:'Saved review',account_no:'secret',risk:null}};
assert.equal(mergeExecutions([{...live,id:'snapshot'},{...live,id:'older',source_id:'b'}, {id:'obs',kind:'observation'}],[live]).length,2);
assert.deepEqual(executionDetails(live).map(d=>d.key),['date','pnl','feedback']);
const calls=[];
const rows=await fetchLiveExecutions({storage:{from:()=>({createSignedUrls:async paths=>({data:paths.map(path=>({path,signedUrl:'https://example.supabase.co/storage/v1/object/sign/app-images/'+path+'?token=short-lived'}))})})},rpc:async(name,args)=>{calls.push(args.p_offset);return {data:args.p_offset===0 ? Array.from({length:100},(_,i)=>({...live,id:String(i),charts:[{path:'owner/trade-a-entry',version:'2026-10-13'}]})) : [live]};}},'https://example.supabase.co');
assert.equal(rows.length,101);assert.deepEqual(calls,[0,100]);assert.match(rows[0].charts?.[0]?.url || rows[1].charts[0].url,/object\/sign\/app-images\/owner\/trade-a-entry\?token=short-lived/);
await assert.rejects(fetchLiveExecutions({rpc:async()=>({error:{message:'Denied'}})},''),/Denied/);
console.log('Execution pagination, zero values, private-field exclusion and snapshot deduplication passed.');

const sessions=[{source_details:{session:'AM'}},{source_details:{session:'NY AM'}},{source_details:{session:'PM'}},{body:'Market: NQ · Session: London Open · Date: 2026-10-13'},{source_details:{session:null}}];
assert.equal(executionSession(sessions[0]),'NY AM');
assert.equal(filterExecutionSession(sessions,'NY AM').length,2);
assert.equal(filterExecutionSession(sessions,'London Open').length,1);
assert.equal(filterExecutionSession(sessions,'').length,1);
assert.equal(filterExecutionSession(sessions,'all').length,5);
assert.equal(filterExecutionSession(sessions,'Asian Killzone').length,0);
console.log('PASS: grouped session filtering, legacy AM/PM aliases, snapshot sessions and unrecorded sessions.');
