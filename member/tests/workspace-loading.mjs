import assert from 'node:assert/strict';
import {enrichPublicationMedia,loadAdministratorCore,workspaceExtras} from '../workspace-loading.mjs';
let releaseAccount,releaseDesk,started=[];
const core=loadAdministratorCore(()=>{started.push('account');return new Promise(resolve=>releaseAccount=resolve);},()=>{started.push('desk');return new Promise(resolve=>releaseDesk=resolve);});
assert.deepEqual(started,['account','desk']);releaseAccount({profile:{id:'owner'}});releaseDesk({posts:[{id:'post'}]});assert.equal((await core).posts.length,1);
let calls=0;const client={storage:{from:bucket=>{assert.equal(bucket,'circle-media');return {createSignedUrls:async(paths,expiry)=>{calls++;assert.deepEqual(paths,['a','b']);assert.equal(expiry,300);return {data:paths.map(path=>({path,signedUrl:`https://example.com/${path}`}))};}};}}};
const posts=[{id:1,image_path:'a'},{id:2,image_path:'a'},{id:3,image_path:'b'},{id:4,source_image:'/term/lmrkb-0.png'}];
const enriched=await enrichPublicationMedia(client,posts);assert.equal(calls,1);assert.equal(enriched[1].image_url,'https://example.com/a');assert.equal(enriched[3].image_url,'/term/lmrkb-0.png');assert.ok(!('image_url' in posts[0]));
await enrichPublicationMedia(client,[]);assert.equal(calls,1);
const denied=await enrichPublicationMedia({storage:{from:()=>({createSignedUrls:async()=>({error:{message:'Denied'}})})}},[{image_path:'private'}]);assert.equal(denied[0].image_url,null);assert.equal(denied[0].media_error,true);
assert.deepEqual(workspaceExtras('executions',{entitled:true,adminVerified:true}),{trades:true,observations:false,journal:false});
assert.deepEqual(workspaceExtras('application',{entitled:true,adminVerified:true}),{trades:false,observations:false,journal:false});
assert.deepEqual(workspaceExtras('studio-observations',{adminVerified:true}),{trades:false,observations:false,journal:false});
assert.deepEqual(workspaceExtras('studio-achievements',{adminVerified:false}),{trades:false,observations:false,journal:false});
assert.deepEqual(workspaceExtras('executions',{entitled:false}),{trades:false,observations:false,journal:false});
console.log('PASS: parallel admin bootstrap, one batched media request, signed-media failure handling and authorized route-only heavy records.');

assert.deepEqual(workspaceExtras('observations',{entitled:true}),{trades:false,observations:true,journal:false});
