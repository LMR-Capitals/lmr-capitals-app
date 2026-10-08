import assert from 'node:assert/strict';
import {newestJournalFirst,journalRecordedAt} from '../journal-order.mjs';
import {fetchPublications} from '../publications.mjs';
const observations=[
 {id:'old',kind:'observation',created_at:'2026-10-01T10:00:00Z',updated_at:'2029-01-01T00:00:00Z'},
 {id:'new',kind:'observation',created_at:'2026-10-07T10:00:00Z',updated_at:'2026-10-07T10:00:00Z'},
];
assert.deepEqual(newestJournalFirst(observations).map(x=>x.id),['new','old']);
assert.equal(observations[0].id,'old');
for (const [kind,field] of [['trade','date'],['achievement','achieved_on']]) {
 const records=[{id:'old',kind,[field]:'2026-10-01',created_at:'2026-10-08T00:00:00Z',updated_at:'2029-01-01'}, {id:'new',kind,[field]:'2026-10-07',created_at:'2026-10-07T00:00:00Z'}];
 assert.deepEqual(newestJournalFirst(records).map(x=>x.id),['new','old']);
 const copies=records.map(source=>({id:source.id,kind:kind==='trade'?'execution':kind,source_kind:kind,source_details:source,published_at:source.id==='old'?'2029-01-01':'2026-10-07'}));
 assert.deepEqual(newestJournalFirst(copies).map(x=>x.id),['new','old']);
}
assert.equal(journalRecordedAt({source_kind:'trade',body:'Market: NQ · Direction: Long · Session: NY AM · Date: 2026-10-07',created_at:'2029-01-01'}),Date.parse('2026-10-07T00:00:00Z')); // already published before this migration
assert.equal(journalRecordedAt({kind:'observation',created_at:'invalid',updated_at:'2026-10-07'}),Date.parse('2026-10-07T00:00:00Z'));
assert.deepEqual(newestJournalFirst([{id:'b',kind:'trade'},{id:'a',kind:'trade'}]).map(x=>x.id),['a','b']);
// The newest original Journal record is on a later page by publication time.
const rows=Array.from({length:205},(_,i)=>({id:String(i),kind:'achievement',source_kind:'achievement',source_details:{achieved_on:i===204?'2026-10-07':'2026-10-01'},created_at:'2026-10-08'}));
const calls=[];
const client={from:table=>{assert.equal(table,'circle_posts');return {select:columns=>{assert.equal(columns,'*');const query={eq:(field,value)=>{calls.push(['filter',field,value]);return query;},order:(field,options)=>{calls.push(['order',field,options]);return query;},range:async(a,b)=>{calls.push(['range',a,b]);return {data:rows.slice(a,b+1)};}};return query;}};}};
const results=await fetchPublications(client,false);
assert.equal(results.length,205);
assert.equal(results[0].id,'204');
assert.deepEqual(calls.filter(c=>c[0]==='range'),[['range',0,99],['range',100,199],['range',200,299]]);
assert.ok(calls.filter(c=>c[0]==='filter').every(c=>c[1]==='status'&&c[2]==='published'));
calls.length=0;
await fetchPublications(client,true);
assert.equal(calls.filter(c=>c[0]==='filter').length,0);
console.log('PASS: Journal chronology for all three sources, edits/republishing, stable ties, legacy copies and complete authorized pagination.');
