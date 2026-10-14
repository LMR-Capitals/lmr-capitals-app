import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../app/app.html',import.meta.url),'utf8');
const helper=source.slice(source.indexOf('function _sbComparable('),source.indexOf('async function _sbUpsertAll('));
const writes=[],reads=[];
let db=[],readError=null,writeError=null;
const context=vm.createContext({_sbUserId:'owner',_sb:{from(table){return {
 select(columns){let uid;return {eq(field,value){assert.equal(field,'user_id');uid=value;return this;},async in(key,ids){reads.push({table,columns,uid,ids});return {data:db.filter(row=>row.user_id===uid&&ids.includes(String(row[key]))),error:readError};}};},
 async upsert(rows,options){writes.push(structuredClone(rows));if(!writeError)for(const row of rows){const key=options.onConflict.split(',').find(k=>k!=='user_id')||'user_id';const existing=db.find(r=>r.user_id===row.user_id&&String(r[key])===String(row[key]));if(existing)Object.assign(existing,row);else db.push(structuredClone(row));}return {error:writeError};}
};}}});
vm.runInContext(helper,context);
async function sync(rows,conflict='id',table='notes'){context.rows=rows;context.options={onConflict:conflict};context.table=table;return vm.runInContext('_sbUpsertChanged(table,rows,options)',context);}
db=Array.from({length:1205},(_,i)=>({id:String(i),user_id:'owner',text:'saved',created_at:'2020-01-01'}));
const unchanged=db.map(row=>({...row,created_at:'2026-10-14',updated_at:new Date().toISOString()}));
await sync(unchanged);
assert.equal(writes.length,0,'Unchanged 1,205-row history must generate zero writes, despite fresh timestamps');
assert.equal(reads.length,7,'History comparisons must chunk below the REST response limit');
assert.ok(reads.every(read=>read.uid==='owner'&&read.ids.length<=200));
unchanged[99].text='one edit';await sync(unchanged);
assert.equal(writes.length,1);assert.equal(writes[0].length,1);assert.equal(writes[0][0].id,'99');
assert.equal(writes[0][0].created_at,'2020-01-01','Existing creation time is preserved');
await sync(unchanged);assert.equal(writes.length,1,'Repeated sync must not rewrite the edited history');
await sync([{id:'new',user_id:'owner',text:'new entry'}]);assert.equal(writes.at(-1)[0].id,'new');
db=[{user_id:'owner',key:'2026-10',data:{b:2,a:1}},{user_id:'other',key:'2026-10',data:{a:9}}];
const before=writes.length;await sync([{user_id:'owner',key:'2026-10',data:{a:1,b:2}}],'key,user_id','monthly');
assert.equal(writes.length,before,'JSON object key order must not trigger a write');
await sync([{user_id:'owner',key:'2026-10',data:{a:1,b:3}}],'key,user_id','monthly');
assert.equal(writes.length,before+1);assert.equal(db[1].data.a,9,'Other owner untouched');
readError={message:'network unavailable'};assert.equal((await sync([{id:'fail',user_id:'owner'}])).error.message,readError.message);
assert.equal(writes.length,before+1,'Read error must not fall back to rewriting history');readError=null;
context._sbUserId='different';assert.equal((await sync([{id:'wrong',user_id:'owner'}])).error.message,'Account changed during sync');
assert.equal(writes.length,before+1);context._sbUserId='owner';
writeError={message:'denied'};assert.equal((await sync([{id:'retry',user_id:'owner'}])).error.message,'denied');writeError=null;
await sync([{id:'retry',user_id:'owner'}]);assert.ok(db.some(row=>row.id==='retry'),'Failed writes remain retryable');
// Exercise the actual async autosave completion path: edits made during a sync
// must stay dirty and queue another sync, instead of being acknowledged unsaved.
const safeSync=source.slice(source.indexOf('async function sbDoSafeSync(){'),source.indexOf('// Map local trade to Supabase schema'));
let finish;const pending=new Promise(resolve=>finish=resolve);let scheduled=0;
const race=vm.createContext({_sb:{},_sbSyncEnabled:true,_sbDirty:true,_sbSyncing:false,_sbUserId:'owner',_sbSaveRevision:1,
 _sbSyncFailNotified:false,_sbSyncFailCount:0,_sbUpsertAll:()=>pending,setSyncIndicator:()=>{},setSbStatus:()=>{},
 sbScheduleSync:()=>scheduled++,localStorage:{setItem(){}},setTimeout:()=>{},notifSettings:()=>({}),sendAppNotification:()=>{}});
vm.runInContext(safeSync,race);const saving=vm.runInContext('sbDoSafeSync()',race);race._sbSaveRevision++;finish();await saving;
assert.equal(race._sbDirty,true);assert.equal(scheduled,1);
assert.match(source,/function save\(\)[\s\S]*?_sbSaveRevision\+\+/);
console.log('PASS: unchanged histories produce zero writes; one edit produces one write; pagination, ownership, nested JSON, creation dates, failed reads/writes and concurrent edits preserved. No production data touched.');
