import {createClient} from '@supabase/supabase-js';
import {getStore} from '@netlify/blobs';
import {createHash} from 'node:crypto';
import {discordCategories,webhookUrl,discordMessage} from '../../lib/studio-discord.mjs';
const databaseUrl='https://agrvylclhvxyevsmmexf.supabase.co';
const publicKey='sb_publishable_vUhBxc3efVrs41yc9WZmAA_SnhBIrDh';
const response=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
export function createDiscordHandler({clientFactory=createClient,storeFactory=getStore,send=fetch,production=context=>context?.deploy?.context==='production'}={}) {
 return async (request,context)=>{
  if(!production(context))return response({error:'Discord setup is available only on the live LMR site.'},403);
  if(!['GET','PUT','POST'].includes(request.method))return response({error:'Method not allowed.'},405);
  const origin=request.headers.get('origin');
  if(origin&&!['https://lmrcapitals.com','https://www.lmrcapitals.com'].includes(origin))return response({error:'Use the live LMR site.'},403);
  const authorization=request.headers.get('authorization') || '';
  if(!/^Bearer \S+$/.test(authorization))return response({error:'Administrator sign-in required.'},401);
  const client=clientFactory(databaseUrl,publicKey,{global:{headers:{Authorization:authorization}},auth:{persistSession:false,autoRefreshToken:false}});
  try {
   const {data:identity,error:identityError}=await client.auth.getUser(authorization.slice(7));
   if(identityError||!identity?.user)return response({error:'Administrator sign-in required.'},401);
   const {data:admin,error:adminError}=await client.rpc('circle_is_admin');
   if(adminError||admin!==true)return response({error:'Verified administrator access required.'},403);
   const store=storeFactory({name:'lmr-studio-discord',consistency:'strong'});
   if(request.method==='GET'){
    const connected={};for(const category of discordCategories)connected[category]=Boolean((await store.get(`settings/${category}`,{type:'json'}))?.url);
    return response({connected});
   }
   if(Number(request.headers.get('content-length'))>4096)return response({error:'Request is too large.'},413);
   const text=await request.text();if(text.length>4096)return response({error:'Request is too large.'},413);
   let input;try{input=JSON.parse(text);}catch{return response({error:'Invalid request.'},400);}
   if(!discordCategories.includes(input.category))return response({error:'Invalid section.'},400);
   const category=input.category;
   if(request.method==='PUT'){
    let url;try{url=input.webhook===null?null:webhookUrl(input.webhook);}catch{return response({error:'Use a valid Discord webhook URL.'},400);}
    await store.setJSON(`settings/${category}`,{url,updated_by:identity.user.id,updated_at:new Date().toISOString()});
    return response({connected:Boolean(url)});
   }
   if(typeof input.id!=='string'||!/^[a-f0-9-]{36}$/i.test(input.id))return response({error:'Choose a saved record.'},400);
   const setting=await store.get(`settings/${category}`,{type:'json'});
   if(!setting?.url)return response({status:'not_configured'});
   const table={callouts:'circle_posts',sessions:'circle_live_sessions',announcements:'circle_notifications'}[category];
   const {data:record,error:recordError}=await client.from(table).select('*').eq('id',input.id).single();
   if(recordError||!record)return response({error:'Saved record unavailable.'},404);
   if(category==='callouts'&&(record.kind!=='callout'||record.status!=='published'||record.author_id!==identity.user.id))return response({error:'Publish your callout before sharing it.'},403);
   if(category==='announcements'&&(record.target_user_id||!['announcement','live','post'].includes(record.category)))return response({error:'Private notifications cannot be shared.'},403);
   const message=discordMessage(category,record);
   const signature=createHash('sha256').update(JSON.stringify({category,id:record.id,message,image:record.image_path,webhook:setting.url})).digest('hex');
   const key=`delivery/${signature}`;
   const lock=await store.setJSON(key,{status:'pending',at:new Date().toISOString()},{onlyIfNew:true});
   if(!lock.modified){const previous=await store.get(key,{type:'json'});return response({status:previous?.status==='sent'?'already_sent':'pending'});}
   let image;
   if(category==='callouts'&&record.image_path){
    if(!record.image_path.startsWith(`${identity.user.id}/`)){await store.delete(key);return response({error:'The saved image is unavailable.'},400);}
    const result=await client.storage.from('circle-media').download(record.image_path);
    if(result.error||!result.data||result.data.size>10*1024*1024||!['image/png','image/jpeg','image/webp'].includes(result.data.type)){await store.delete(key);return response({error:'The saved callout image could not be attached.'},400);}
    image=result.data;message.embeds[0].image={url:`attachment://chart.${image.type.split('/')[1]}`};
   }
   const url=new URL(webhookUrl(setting.url));url.searchParams.set('wait','true');
   let body,headers;
   if(image){body=new FormData();body.set('payload_json',JSON.stringify(message));body.set('files[0]',image,`chart.${image.type.split('/')[1]}`);}else{body=JSON.stringify(message);headers={'Content-Type':'application/json'};}
   let sent;
   try{sent=await send(url.href,{method:'POST',body,headers,redirect:'error',signal:AbortSignal.timeout(12000)});}catch{return response({error:'LMR saved successfully. Discord delivery could not be confirmed.'},502);}
   if(!sent.ok){await store.delete(key);return response({error:sent.status===429?'Discord is busy. LMR saved successfully.':'Discord rejected delivery. Check your webhook URL.'},502);}
   await store.setJSON(key,{status:'sent',at:new Date().toISOString()});
   return response({status:'sent'});
  }catch{return response({error:'Discord is unavailable. Your LMR records are preserved.'},503);}
 };
}
export default createDiscordHandler();
