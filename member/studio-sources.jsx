import React,{useEffect,useState,useRef} from 'react';
import {sb} from './api';import {config,preview} from './config';
import {fetchStudioSources,fetchStudioDetail} from './studio-sources.mjs';
import {ObservationRecord} from './journal-record';import ExecutionRecord from './execution-record';
import {Button,Empty} from './ui';
function ObservationItem({entry,linked,busy,onPublish}) {
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
  (preview?Promise.resolve(entry):fetchStudioDetail(sb,'observation',entry.id,config.supabaseUrl)).then(item=>{if(active)setSource(item);}).catch(e=>{if(active)setError(e.message);});
  return()=>{active=false;};
 },[visible,entry.id,entry.updated_at,attempt]);
 const published=linked?.status==='published';
 return <article ref={element} className="studio-observation-item" aria-label={entry.title || 'Untitled observation'}>
  <header className="journal-source-meta"><h3>{entry.title || 'Untitled observation'}</h3><span className="tag">{published?'Published to members':'Private · Not published'}</span></header>
  {source?<>
   <ObservationRecord record={source}/>
   <form key={`${source.id}:${source.updated_at}`} className="form-stack studio-observation-publish" onSubmit={e=>{e.preventDefault();onPublish(source);}}>
    <p className="form-help">Audience: paid members. Published records follow your Journal edits.</p>
    {!published && <label className="check-label"><input type="checkbox" required disabled={busy}/><span>I have reviewed these images and details for privacy and accuracy.</span></label>}
    <div className="studio-observation-actions"><Button gold type="submit" icon="send" disabled={busy || published}>{published?'Published to members':'Publish to members'}</Button>{published && <a href="/inner-circle#admin">Manage / unpublish</a>}</div>
   </form>
  </>:error?<div role="alert"><p className="error">Could not load this observation: {error}</p><Button small onClick={()=>setAttempt(n=>n+1)}>Retry loading</Button></div>:<p className="form-help" role="status">{visible?'Loading original notes and images…':'Original notes and images load as you scroll.'}</p>}
 </article>;
}
export default function StudioSources({data,kind,busy,onPublish}) {
 const [entries,setEntries]=useState([]),[selected,setSelected]=useState(''),[source,setSource]=useState(null),[error,setError]=useState(''),[listLoading,setListLoading]=useState(true),[detailLoading,setDetailLoading]=useState(false),[version,setVersion]=useState(0);
 useEffect(()=>{let active=true,pending=false;setListLoading(true);setError('');
  const sync=async()=>{
   if(pending)return;pending=true;
   try {
    const rows=preview?(data.journalEntries || []).filter(p=>p.kind===kind):await fetchStudioSources(sb,kind);
    if(active){setEntries(rows);setSelected(id=>rows.some(p=>p.id===id)?id:rows[0]?.id || '');setError('');}
   }catch(e){if(active)setError(e.message);}
   finally{pending=false;if(active)setListLoading(false);}
  };
  sync();
  const onVisible=()=>{if(document.visibilityState==='visible')sync();};
  const tick=kind==='observation'&&!preview?setInterval(onVisible,30000):null;
  window.addEventListener('focus',onVisible);document.addEventListener('visibilitychange',onVisible);
  return()=>{active=false;clearInterval(tick);window.removeEventListener('focus',onVisible);document.removeEventListener('visibilitychange',onVisible);};
 },[kind,version]);
 useEffect(()=>{if(kind==='observation' || !selected){setSource(null);return;}let active=true;setDetailLoading(true);setError('');
  (preview ? Promise.resolve(entries.find(p=>p.id===selected)) : fetchStudioDetail(sb,kind,selected,config.supabaseUrl)).then(item=>{if(active)setSource(item);}).catch(e=>{if(active){setSource(null);setError(e.message);}}).finally(()=>{if(active)setDetailLoading(false);});
  return()=>{active=false;};
 },[kind,selected,version]);
 const linked=source && data.adminPosts.find(p=>p.source_kind===kind && p.source_id===source.id);
 return <section className="panel form-panel journal-source-panel">
  <h2>{kind==='observation'?'Your Journal observation posts':'Review, then publish to members.'}</h2>
  <p>Your Journal stays private until you publish a selected {kind==='trade'?'trade':'observation'}. Review the original images and details below.</p>
  <Button small icon="refresh" disabled={busy || listLoading || detailLoading} onClick={()=>setVersion(n=>n+1)}>Refresh from Journal</Button>
  {error && <p className="error" role="alert">{error}</p>}
  {listLoading ? <p role="status">Loading your Journal list…</p> : !entries.length ? <Empty title="No saved records yet" body="Save a record in your Journal, then refresh this list."/> : kind==='observation'?<>
   <p className="form-help">{entries.length} observations · Newest first · Administrator view · New posts appear automatically · Publish each post when ready.</p>
   <div className="studio-observation-list">{entries.map(entry=><ObservationItem key={`${version}:${entry.id}`} entry={entry} linked={data.adminPosts.find(p=>p.source_kind==='observation' && p.source_id===entry.id)} busy={busy} onPublish={onPublish}/>)}</div>
  </>:<>
   <label>Journal record · newest first<select value={selected} onChange={e=>setSelected(e.target.value)}>{entries.map(p=><option value={p.id} key={p.id}>{p.title}</option>)}</select></label>
   {detailLoading ? <p role="status">Loading original images and details…</p> : source && <>
    <article className="journal-source-preview"><span className="tag">{linked?.status==='published'?'Published to members':'Private · Not published'}</span><h3>{source.title}</h3>
     {kind==='observation'?<ObservationRecord record={source}/>:<ExecutionRecord record={source}/>}</article>
    <form key={`${source.id}:${source.updated_at}`} className="form-stack" onSubmit={e=>{e.preventDefault();onPublish(source);}}>
     <p className="form-help">Audience: paid members. After publishing, Journal edits keep the shared record up to date. Use Studio publications to unpublish and stop sharing.</p>
     <label className="check-label"><input type="checkbox" required disabled={busy || linked?.status==='published'}/><span>I have reviewed these images and details for privacy and accuracy.</span></label>
     {kind==='trade' && !source.image_path && !preview && <p className="form-help">Save the Entry / exit outcome chart in the Journal before publishing.</p>}
     <Button gold type="submit" icon="send" disabled={busy || linked?.status==='published' || (kind==='trade' && !source.image_path && !preview)}>{linked?.status==='published'?'Published to members':'Publish to members'}</Button>
     <a href="/inner-circle#admin">Manage publications / unpublish</a>
    </form>
   </>}
  </>}
 </section>;
}
