import React,{useEffect,useState} from 'react';
import {Button} from './ui';
import {discordRequest} from './discord-api';
import {preview} from './config';
export default function DiscordSettings({category}) {
 const [connected,setConnected]=useState(false),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[url,setUrl]=useState(''),[error,setError]=useState(''),[saved,setSaved]=useState('');
 useEffect(()=>{let active=true;setLoading(true);setError('');setUrl('');setSaved('');
  discordRequest().then(result=>{if(active)setConnected(Boolean(result.connected?.[category]));}).catch(e=>{if(active)setError(e.message);}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};
 },[category]);
 const save=async(disconnect=false)=>{setBusy(true);setError('');setSaved('');try{const result=await discordRequest('PUT',{category,webhook:disconnect?null:url.trim()});setConnected(result.connected);setUrl('');setSaved(disconnect?'Discord disconnected.':'Webhook saved. Automatic Discord delivery is enabled.');}catch(e){setError(e.message);}finally{setBusy(false);}};
 return <details className="discord-settings"><summary>Discord webhook <span>{loading?'Checking…':connected?'Connected · Automatic':'Not connected'}</span></summary>
  <p>{category==='sessions'?'Saved sessions and status changes':category==='announcements'?'New announcements':'Published callouts and their images'} send automatically to this Discord channel. Anyone with access to that channel can view them.</p>
  <form className="discord-settings-form" onSubmit={event=>{event.preventDefault();save();}}>
   <label>Discord webhook URL<input type="password" value={url} onChange={event=>setUrl(event.target.value)} placeholder={connected?'Paste a new URL to replace the saved webhook':'https://discord.com/api/webhooks/…'} autoComplete="off" spellCheck={false} required maxLength={500} disabled={busy || preview}/></label>
   <div><Button type="submit" disabled={busy || loading || preview}>{busy?'Saving…':connected?'Replace webhook':'Save webhook'}</Button>{connected&&<Button small disabled={busy || preview} onClick={()=>save(true)}>Disconnect</Button>}</div>
  </form>
  <small>The saved URL stays on the server and is never shown to members. {preview?'Connect it on the live LMR site.':''}</small>
  {error&&<p className="error" role="alert">{error}</p>}{saved&&<p role="status">{saved}</p>}
 </details>;
}
