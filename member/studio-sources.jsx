import React,{useEffect,useState,useRef} from 'react';
import {sb} from './api';import {config,preview} from './config';
import {fetchStudioSources,fetchStudioDetail,fetchStudioTrades} from './studio-sources.mjs';
import {ObservationRecord} from './journal-record';import ExecutionRecord from './execution-record';
import {filterExecutionSession} from './executions.mjs';
import ExecutionSessionFilter from './execution-session-filter';
import {Button,Empty} from './ui';
function JournalItem({entry,kind,linked,busy,onPublish}) {
 const element=useRef(null),[visible,setVisible]=useState(false),[source,setSource]=useState(null),[error,setError]=useState(''),[attempt,setAttempt]=useState(0);
 useEffect(()=>{
  if(typeof IntersectionObserver==='undefined'){setVisible(true);return;}
  const observer=new IntersectionObserver(items=>{if(items.some(item=>item.isIntersecting)){setVisible(true);observer.disconnect();}},{rootMargin:'300px'});
  if(element.current)observer.observe(element.current);
  return()=>observer.disconnect();
 },[]);
 useEffect(()=>{
  if(!visible)return;
  let active=true;setError('');
  (preview?Promise.resolve(entry):fetchStudioDetail(sb,kind,entry.id,config.supabaseUrl)).then(item=>{if(active)setSource(item);}).catch(e=>{if(active)setError(e.message);});
  return()=>{active=false;};
 },[visible,kind,entry.id,entry.updated_at,attempt]);
 const published=linked?.status==='published';
 const missingChart=kind==='trade'&&source&&!source.image_path&&!preview;
 return <article ref={element} className="studio-observation-item" aria-label={entry.title || (kind==='trade'?'Journal trade':'Untitled observation')}>
  <header className="journal-source-meta"><h3>{entry.title || (kind==='trade'?'Journal trade':'Untitled observation')}</h3><span className="tag">{published?'Published to members':'Private · Not published'}</span></header>
  {source?<>
   {kind==='trade'?<ExecutionRecord record={source}/>:<ObservationRecord record={source}/>}
   <form key={`${source.id}:${source.updated_at}`} className="form-stack studio-observation-publish" onSubmit={e=>{e.preventDefault();onPublish(source);}}>
    <p className="form-help">Audience: paid members. Published records follow your Journal edits.</p>
    {!published && <label className="check-label"><input type="checkbox" required disabled={busy}/><span>I have reviewed these images and details for privacy and accuracy.</span></label>}
    {missingChart&&<p className="form-help">Save the Entry / exit outcome chart in the Journal before publishing.</p>}
    <div className="studio-observation-actions"><Button gold type="submit" icon="send" disabled={busy || published || missingChart}>{published?'Published to members':'Publish to members'}</Button>{published && <a href="/inner-circle#admin">Manage / unpublish</a>}</div>
   </form>
  </>:error?<div role="alert"><p className="error">Could not load this {kind==='trade'?'trade':'observation'}: {error}</p><Button small onClick={()=>setAttempt(n=>n+1)}>Retry loading</Button></div>:<p className="form-help" role="status">{visible?'Loading original notes and images…':'Original notes and images load as you scroll.'}</p>}
 </article>;
}
export default function StudioSources({data,kind,busy,onPublish}) {
 const [entries,setEntries]=useState([]),[error,setError]=useState(''),[listLoading,setListLoading]=useState(true),[version,setVersion]=useState(0),[session,setSession]=useState('all');
 useEffect(()=>{let active=true,pending=false;setListLoading(true);setError('');
  const sync=async()=>{
   if(pending)return;pending=true;
   try {
    const rows=preview?(data.journalEntries || []).filter(p=>p.kind===kind):await (kind==='trade'?fetchStudioTrades(sb):fetchStudioSources(sb,kind));
    if(active){setEntries(rows);setError('');}
   }catch(e){if(active)setError(e.message);}
   finally{pending=false;if(active)setListLoading(false);}
  };
  sync();
  const onVisible=()=>{if(document.visibilityState==='visible')sync();};
  const tick=!preview?setInterval(onVisible,30000):null;
  window.addEventListener('focus',onVisible);document.addEventListener('visibilitychange',onVisible);
  return()=>{active=false;clearInterval(tick);window.removeEventListener('focus',onVisible);document.removeEventListener('visibilitychange',onVisible);};
 },[kind,version]);
 const items=kind==='trade'?filterExecutionSession(entries,session):entries;
 return <section className="panel form-panel journal-source-panel">
  <h2>{kind==='observation'?'Your Journal observation posts':'Your Journal trade history'}</h2>
  <p>Your Journal stays private until you publish a selected {kind==='trade'?'trade':'observation'}. Review the original images and details below.</p>
  <Button small icon="refresh" disabled={busy || listLoading} onClick={()=>setVersion(n=>n+1)}>Refresh from Journal</Button>
  {error && <p className="error" role="alert">{error}</p>}
  {listLoading ? <p role="status">Loading your Journal list…</p> : !entries.length ? <Empty title="No saved records yet" body="Save a record in your Journal, then refresh this list."/> : <>
   {kind==='trade'&&<ExecutionSessionFilter records={entries} value={session} onChange={setSession}/>}
   <p className="form-help" role="status">{items.length} of {entries.length} {kind==='trade'?'trades · All dates':'observations'} · Newest first · Administrator view · New posts appear automatically · Publish each post when ready.</p>
   <div className="studio-observation-list">{items.map(entry=><JournalItem key={`${kind}:${version}:${entry.id}`} entry={entry} kind={kind} linked={data.adminPosts.find(p=>p.source_kind===kind && p.source_id===entry.id)} busy={busy} onPublish={onPublish}/>)}</div>
   {!items.length&&<Empty title="No trades match this session" body="Choose another saved session or clear the session filter."/>}
  </>}
 </section>;
}
