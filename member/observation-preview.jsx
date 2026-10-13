import React,{useEffect,useRef,useState} from 'react';
import {sb} from './api';import {fetchObservationDetail} from './observations.mjs';import {journalImageUrl} from './journal-media.mjs';
export default function ObservationPreview({record,onOpen}) {
 const ref=useRef(null),[src,setSrc]=useState(null),[failed,setFailed]=useState(false);
 useEffect(()=>{let active=true,started=false;setSrc(null);setFailed(false);
  const load=async()=>{if(started)return;started=true;try{const item=await fetchObservationDetail(sb,record.source_id);const doc=new DOMParser().parseFromString(item.source_content || '', 'text/html');const image=[...doc.querySelectorAll('img')].find(i=>!i.closest('script,style,iframe,object,embed,svg,form,template')&&journalImageUrl(i.getAttribute('src')));if(active){setSrc(image?journalImageUrl(image.getAttribute('src')):null);setFailed(!image);}}catch{if(active)setFailed(true);}};
  const observer=typeof IntersectionObserver==='function'?new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){load();observer.disconnect();}},{rootMargin:'100px'}):null;
  if(observer&&ref.current)observer.observe(ref.current);else load();
  return()=>{active=false;observer?.disconnect();};
 },[record.source_id,record.updated_at]);
 return <div ref={ref}>{src?<button className="post-media" onClick={onOpen} aria-label={`Open observation: ${record.title}`}><img src={src} alt={record.title || 'Observation chart'} loading="lazy" referrerPolicy="no-referrer"/></button>:<p className="form-help">{failed?'Open the observation to view its original charts.':'Loading image preview…'}</p>}</div>;
}
