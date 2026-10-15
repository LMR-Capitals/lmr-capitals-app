import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {createClient} from '@supabase/supabase-js';
import {signOutSession} from '../session-actions.mjs';

// Exercise the installed Auth SDK against an isolated transport, with two
// independent browser sessions. No production credentials or accounts used.
const sessions = new Map();
const scopes = [];
let serial = 0;
function session() {
  const id = String(++serial);
  const access_token = ['e30', Buffer.from(JSON.stringify({sub:'owner',exp:Math.floor(Date.now()/1000)+3600,session_id:id})).toString('base64url'), 'test'].join('.');
  const result = {access_token,refresh_token:'refresh-'+id,expires_in:3600,token_type:'bearer',user:{id:'owner',aud:'authenticated',email:'test@example.invalid'}};
  sessions.set(result.refresh_token,result);
  return result;
}
const transport = async (input,init={}) => {
  const url = new URL(input);
  if (url.pathname.endsWith('/user')) return new Response(JSON.stringify({id:'owner',aud:'authenticated',email:'test@example.invalid'}),{headers:{'content-type':'application/json'}});
  if (url.pathname.endsWith('/logout')) {
    const scope = url.searchParams.get('scope'); scopes.push(scope);
    const token = new Headers(init.headers).get('Authorization')?.replace('Bearer ','');
    for (const [key,value] of sessions) if(scope==='global'||value.access_token===token)sessions.delete(key);
    return new Response(null,{status:204});
  }
  if (url.pathname.endsWith('/token')) {
    const body=JSON.parse(init.body);
    const found=sessions.get(body.refresh_token);
    return new Response(JSON.stringify(found||{msg:'Refresh Token Not Found',error_code:'refresh_token_not_found'}),{status:found?200:400,headers:{'content-type':'application/json'}});
  }
  throw new Error('Unexpected Auth request: '+url.pathname);
};
function client() {return createClient('https://isolated.example.invalid','test-public-key',{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},global:{fetch:transport}});}
const a=client(),b=client(),first=session(),second=session();
assert.equal((await a.auth.setSession(first)).error,null);assert.equal((await b.auth.setSession(second)).error,null);
await signOutSession(a);
assert.equal(scopes.at(-1),'local');
assert.equal((await a.auth.getSession()).data.session,null);
assert.equal((await b.auth.refreshSession()).error,null,'Other browser must retain refresh access after local logout');
assert.equal(sessions.has(first.refresh_token),false);
await a.auth.setSession(session());
await signOutSession(a,'global');
assert.equal(scopes.at(-1),'global');
assert.ok((await b.auth.refreshSession()).error,'Global logout must revoke other browser refresh access');
await assert.rejects(signOutSession(a,{type:'click'}),/valid sign-out/);
await assert.rejects(signOutSession({auth:{signOut:async()=>({error:new Error('network unavailable')})}}),/network unavailable/);

const member=readFileSync(new URL('../main.jsx',import.meta.url),'utf8');
const setter=member.match(/const setData = useCallback\(\(update\) => \{([\s\S]*?)\}, \[identity\]\);/)[1];
const identity={current:'owner-a'};let visible={owner:'owner-a'};
const makeSetter=id=>vm.runInNewContext('(update)=>{'+setter+'}',{preview:false,authenticatedIdentity:identity,identity:id,setDataState:update=>{visible=typeof update==='function'?update(visible):update;}});
const staleResponse=makeSetter('owner-a');
identity.current='owner-b';visible={owner:'owner-b'};
staleResponse({owner:'owner-a',privateNotes:'must not render'});
assert.equal(visible.owner,'owner-b');assert.equal(visible.privateNotes,undefined);
makeSetter('owner-b')({owner:'owner-b',notes:'own'});assert.equal(visible.notes,'own');
identity.current=null;makeSetter('owner-b')({owner:'owner-b'});assert.equal(visible.notes,'own','Signed-out responses discarded');

const effectStart=member.indexOf('    let active = true, observedAuth = false;');
const effectEnd=member.indexOf('\n  const refresh = useCallback',effectStart);
const authEffect=member.slice(effectStart,effectEnd).replace(/\n  \}, \[\]\);\s*$/,'');
let authEvent,finishStartup;const resets=[];
const authContext={preview:false,sb:{auth:{getSession:()=>new Promise(resolve=>{finishStartup=resolve;}),onAuthStateChange:fn=>{authEvent=fn;return {data:{subscription:{unsubscribe(){}}}};}}},authenticatedIdentity:{current:'owner-a'},requestGeneration:{current:1},baseData:{privateRecords:[]},timer:{current:null},clearTimeout(){},history:{replaceState(){}},location:{pathname:'/inner-circle',search:''}};
for(const name of ['setDataState','setUser','setAuthReady','setAccess','setModal','setMenu','setSearch','setToast','setLoading','setRoute','setRecovery','setError'])authContext[name]=value=>resets.push([name,value]);
vm.runInNewContext('(function(){'+authEffect+'})()',authContext);
authEvent('SIGNED_IN',{user:{id:'owner-b'}});
assert.equal(authContext.authenticatedIdentity.current,'owner-b');
assert.equal(authContext.requestGeneration.current,2);
assert.ok(resets.some(([name,value])=>name==='setModal'&&value===null));
assert.ok(resets.some(([name,value])=>name==='setDataState'&&value===authContext.baseData));
const afterSwitch=resets.length;
finishStartup({data:{session:{user:{id:'owner-a'}}},error:null});await Promise.resolve();
assert.equal(resets.length,afterSwitch,'Late startup session must not restore old account');
authEvent('SIGNED_OUT',null);assert.equal(authContext.authenticatedIdentity.current,null);

const terminal=readFileSync(new URL('../../admin/terminal.jsx',import.meta.url),'utf8');
const terminalAuth=terminal.slice(terminal.indexOf('      const next = session?.user?.id || null;'),terminal.indexOf('      // Defer API calls outside'));
const terminalResets=[];
const terminalContext={session:{user:{id:'owner-b'}},authenticatedIdentity:{current:'owner-a'},generation:{current:1},emptyDesk:{posts:[]},timer:{current:null},clearTimeout(){}};
for(const name of ['setData','setReady','setUser','setMenu','setToast'])terminalContext[name]=value=>terminalResets.push([name,value]);
vm.runInNewContext(terminalAuth,terminalContext);
assert.equal(terminalContext.generation.current,2);
assert.equal(terminalContext.authenticatedIdentity.current,'owner-b');
assert.ok(terminalResets.some(([name,value])=>name==='setReady'&&value===false));
assert.ok(terminalResets.some(([name,value])=>name==='setData'&&value===terminalContext.emptyDesk));

// Exercise the actual Journal logout body: cancelled/failed logout must retain
// the UI and data; successful local/global logout preserves owner local edits.
const journal=readFileSync(new URL('../../app/app.html',import.meta.url),'utf8');
const logout=journal.slice(journal.indexOf("async function sbDoSignOut(scope"),journal.indexOf('async function sbPushNow()'));
async function journalLogout(scope,accept=true,failed=false) {
 const writes=new Map(),calls=[],elements=new Map();let cleared=false,stopped=false;
 const element=id=>{if(!elements.has(id))elements.set(id,{style:{},classList:{remove(){}},value:'',disabled:false});return elements.get(id);};
 const context={_sb:{auth:{signOut:async options=>{calls.push(options.scope);return {error:failed?new Error('offline'):null};}}},_sbUserId:'owner-a',STORE_KEY:'lmr_v3_state__owner-a',state:{note:'pending'},SESSION_KEY:'session',
 confirm:()=>accept,flushAutoSaves:()=>{},localStorage:{setItem:(k,v)=>writes.set(k,v),removeItem(){}},sessionStorage:{removeItem(){}},flash:()=>{},sbStopRealtime:()=>{stopped=true;},updateRTIndicator:()=>{},document:{getElementById:element},resetState:()=>{cleared=true;}};
 vm.runInNewContext(logout,context);await context.sbDoSignOut(scope);
 return {writes,calls,cleared,stopped};
}
for(const scope of [undefined,'global']) {const r=await journalLogout(scope);assert.deepEqual(r.calls,[scope||'local']);assert.equal(JSON.parse(r.writes.get('lmr_v3_state__owner-a')).note,'pending');assert.ok(r.cleared&&r.stopped);}
const cancelled=await journalLogout('global',false);assert.equal(cancelled.calls.length,0);assert.equal(cancelled.cleared,false);
const failed=await journalLogout('local',true,true);assert.equal(failed.cleared,false);assert.equal(failed.stopped,false);
for(const file of ['../../app/app.html','../../admin/main.jsx','../../admin/terminal.jsx','../auth.jsx'])assert.doesNotMatch(readFileSync(new URL(file,import.meta.url),'utf8'),/\.auth\.signOut\(\s*\)/,'No implicit global sign-outs: '+file);
console.log('PASS: actual Auth SDK local/global scopes, independent session refresh isolation, error handling, stale-account responses, Journal edit preservation, cancelled/failed logout.');
