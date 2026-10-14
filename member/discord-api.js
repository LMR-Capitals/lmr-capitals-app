import {sb} from './api';
import {preview} from './config';
export async function discordRequest(method='GET',body) {
 if(preview)return method==='GET'?{connected:{}}:{status:'preview'};
 const {data,error}=await sb.auth.getSession();
 if(error||!data?.session?.access_token)throw new Error('Sign in again to manage Discord.');
 const result=await fetch('/.netlify/functions/studio-discord',{method,headers:{Authorization:`Bearer ${data.session.access_token}`,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(20000)});
 const output=await result.json().catch(()=>({error:'Discord setup is unavailable.'}));
 if(!result.ok)throw new Error(output.error || 'Discord is unavailable.');
 return output;
}
export async function deliverDiscord(category,id) {
 if(preview)return '';
 try{
  const result=await discordRequest('POST',{category,id});
  return result.status==='sent'?' Sent to Discord.':result.status==='already_sent'?' Already shared to Discord.':result.status==='pending'?' Discord delivery is pending confirmation.':'';
 }catch{return ' LMR saved successfully; Discord could not confirm delivery. Check your webhook setup.';}
}
