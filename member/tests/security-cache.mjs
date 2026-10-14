import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const handlers={}, writes=[],deleted=[];
let cacheControl='public, max-age=3600';
const cache={addAll:async()=>{},put:async(request)=>writes.push(request.url)};
const context={URL,Response,Set,
 self:{location:{href:'https://lmrcapitals.com/sw.js'},addEventListener:(name,fn)=>handlers[name]=fn,clients:{claim:async()=>{}},skipWaiting:async()=>{}},
 caches:{open:async()=>cache,match:async()=>undefined,keys:async()=>['lmr-v13','lmr-v14'],delete:async key=>deleted.push(key)},
 fetch:async()=>new Response('ok',{headers:{'Cache-Control':cacheControl}})
};
vm.runInNewContext(readFileSync(new URL('../../public/sw.js',import.meta.url),'utf8'),context);
async function request(path,options={}){
 let response;
 handlers.fetch({request:new Request('https://lmrcapitals.com'+path,options),respondWith:p=>response=p});
 if(response)await response;
 return response;
}
assert.equal(await request('/.netlify/functions/studio-discord'),undefined);
assert.equal(await request('/inner-circle'),undefined);
assert.equal(await request('/icons/icon-192.png',{headers:{Authorization:'Bearer example'}}),undefined);
assert.equal(await request('/icons/icon-192.png?account=other'),undefined);
assert.equal(writes.length,0);
await request('/icons/icon-192.png');assert.equal(writes.length,1);
cacheControl='private, no-store';await request('/icons/icon-512.png');assert.equal(writes.length,1);
let activation;handlers.activate({waitUntil:p=>activation=p});await activation;
assert.deepEqual(deleted,['lmr-v13']);
console.log('PASS: authenticated/API/HTML requests bypass shared caches; no-store honored; old caches purged.');
