import React,{useEffect,useState} from 'react';
import {sb} from './api';import {config,preview} from './config';
import {fetchStudioSources,fetchStudioDetail} from './studio-sources.mjs';
import {ObservationRecord} from './journal-record';import ExecutionRecord from './execution-record';
import {Button,Empty} from './ui';
export default function StudioSources({data,kind,busy,onPublish}) {
 const [entries,setEntries]=useState([]),[selected,setSelected]=useState(''),[source,setSource]=useState(null),[error,setError]=useState(''),[listLoading,setListLoading]=useState(true),[detailLoading,setDetailLoading]=useState(false),[version,setVersion]=useState(0);
 useEffect(()=>{let active=true;setListLoading(true);setError('');
  (preview ? Promise.resolve((data.journalEntries || []).filter(p=>p.kind===kind)) : fetchStudioSources(sb,kind)).then(rows=>{if(active){setEntries(rows);setSelected(id=>rows.some(p=>p.id===id)?id:rows[0]?.id || '');}}).catch(e=>{if(active)setError(e.message);}).finally(()=>{if(active)setListLoading(false);});
  return()=>{active=false;};
 },[kind,version]);
 useEffect(()=>{if(!selected){setSource(null);return;}let active=true;setDetailLoading(true);setError('');
  (preview ? Promise.resolve(entries.find(p=>p.id===selected)) : fetchStudioDetail(sb,kind,selected,config.supabaseUrl)).then(item=>{if(active)setSource(item);}).catch(e=>{if(active){setSource(null);setError(e.message);}}).finally(()=>{if(active)setDetailLoading(false);});
  return()=>{active=false;};
 },[kind,selected,version]);
 const linked=source && data.adminPosts.find(p=>p.source_kind===kind && p.source_id===source.id);
 return <section className="panel form-panel journal-source-panel">
  <h2>Review, then publish to members.</h2>
  <p>Your Journal stays private until you publish a selected {kind==='trade'?'trade':'observation'}. Review the original images and details below.</p>
  <Button small icon="refresh" disabled={busy || listLoading || detailLoading} onClick={()=>setVersion(n=>n+1)}>Refresh from Journal</Button>
  {error && <p className="error" role="alert">{error}</p>}
  {listLoading ? <p role="status">Loading your Journal list…</p> : !entries.length ? <Empty title="No saved records yet" body="Save a record in your Journal, then refresh this list."/> : <>
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
