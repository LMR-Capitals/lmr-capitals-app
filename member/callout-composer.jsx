import React,{useEffect,useRef,useState} from 'react';
import Icon from './icons';
import {Button,Empty,formatDate,Modal} from './ui';
import {newestCallouts,validateCalloutImage} from './callouts.mjs';
export default function CalloutComposer({data,busy,onPublish,onPostStatus}) {
 const [file,setFile]=useState(null),[url,setUrl]=useState(''),[error,setError]=useState(''),[reading,setReading]=useState(false),[opened,setOpened]=useState(null);
 const input=useRef(null),form=useRef(null);
 useEffect(()=>{if(!file){setUrl('');return;}const next=URL.createObjectURL(file);setUrl(next);return()=>URL.revokeObjectURL(next);},[file]);
 const attach=next=>{try{validateCalloutImage(next);setFile(next);setError('');}catch(e){setError(e.message);} };
 const paste=event=>{if(busy)return;const item=[...(event.clipboardData?.items || [])].find(item=>item.kind==='file'&&item.type.startsWith('image/'));if(item){event.preventDefault();attach(item.getAsFile());}};
 const readClipboard=async()=>{
  setReading(true);setError('');
  try {
   if(!navigator.clipboard?.read)throw new Error('Click inside this form and press ⌘V or Ctrl+V to paste your image, or choose Upload image.');
   const items=await navigator.clipboard.read();
   for(const item of items){const type=item.types.find(type=>['image/png','image/jpeg','image/webp'].includes(type));if(type){const blob=await item.getType(type);attach(new File([blob],`callout-${Date.now()}.${type.split('/')[1]}`,{type}));return;}}
   throw new Error('Copy an image first, then paste it here.');
  }catch(e){setError(e.name==='NotAllowedError'?'Clipboard access was unavailable. Click inside this form and press ⌘V or Ctrl+V, or choose Upload image.':e.message);}
  finally{setReading(false);}
 };
 const records=newestCallouts([...data.adminPosts,...data.posts.filter(post=>!data.adminPosts.some(saved=>saved.id===post.id))]);
 return <div className="callout-workspace">
  <form ref={form} className="form-stack callout-composer" onPaste={paste} onReset={()=>{setFile(null);setError('');}} onSubmit={event=>{if(!file){event.preventDefault();setError('Add a callout image before publishing.');return;}onPublish(event,'callout',file);}}>
   <h2>New callout</h2>
   <label>Post title<input name="title" required maxLength="160" placeholder="What are you watching?" disabled={busy}/></label>
   <div className="callout-image-area" tabIndex={0} role="group" aria-label="Callout image: upload or paste" aria-describedby="callout-image-help">
    {url?<img src={url} alt="Callout image preview"/>:<div className="callout-image-empty"><Icon name="image" size={28}/><strong>Add your chart</strong><span>Upload an image or paste one here.</span></div>}
    <input ref={input} className="callout-file-input" type="file" name="image" accept="image/png,image/jpeg,image/webp" disabled={busy} aria-label="Upload callout image" onChange={event=>{if(event.target.files?.[0])attach(event.target.files[0]);}}/>
    <div className="callout-image-actions"><Button icon="image" disabled={busy} onClick={()=>input.current?.click()}>{file?'Replace image':'Upload image'}</Button><Button disabled={busy || reading} onClick={readClipboard}>{reading?'Reading clipboard…':'Paste image'}</Button>{file&&<Button small disabled={busy} onClick={()=>{setFile(null);if(input.current)input.current.value='';}}>Remove image</Button>}</div>
   </div>
   <small id="callout-image-help" className="form-help">PNG, JPEG or WebP · Up to 10 MB · ⌘V / Ctrl+V to paste</small>
   {error&&<p className="error" role="alert">{error}</p>}
   <div className="callout-publish-row"><span>Visible to paid members after publishing.</span><Button gold type="submit" icon="send" disabled={busy || reading}>{busy?'Publishing…':'Publish to members'}</Button></div>
  </form>
  <section className="callout-archive" aria-label="Saved callouts"><div className="section-head"><h2>Your callouts</h2><span>{records.length} · Newest first</span></div>
   {records.map(post=><article className="panel callout-post" key={post.id}>
    <header><div><h3>{post.title}</h3><time dateTime={post.created_at}>{formatDate(post.created_at)}</time></div><span className="tag">{post.status==='published'?'Published to members':'Private draft'}</span></header>
    {post.body&&<p className="callout-notes">{post.body}</p>}
    {post.image_url&&<button type="button" className="post-media" onClick={()=>setOpened(post)} aria-label={`View callout image: ${post.title}`}><img src={post.image_url} alt={post.title} loading="lazy"/></button>}
    {post.media_error&&<p className="content-note">The saved image could not load. Refresh the workspace to try again.</p>}
    <footer><Button small disabled={busy} onClick={()=>onPostStatus(post.id,post.status==='published'?'draft':'published')}>{post.status==='published'?'Unpublish':'Publish to members'}</Button></footer>
   </article>)}
   {!records.length&&<Empty icon="callouts" title="Your callouts will appear here" body="Publish your first title and chart to save it here and share it with members."/>}
  </section>
  {opened&&<Modal title={opened.title} onClose={()=>setOpened(null)}><img className="callout-expanded-image" src={opened.image_url} alt={opened.title}/></Modal>}
 </div>;
}
