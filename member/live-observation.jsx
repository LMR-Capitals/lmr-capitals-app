import React,{useEffect,useState} from 'react';
import {sb} from './api';
import {fetchObservationDetail} from './observations.mjs';
import {ObservationRecord} from './journal-record';
import {Button} from './ui';
export default function LiveObservation({id}) {
 const [record,setRecord]=useState(null),[error,setError]=useState(''),[retry,setRetry]=useState(0);
 useEffect(()=>{
  let active=true,pending=false;
  setRecord(null);setError('');
  const sync=async()=>{
   if(pending) return;pending=true;
   try {const next=await fetchObservationDetail(sb,id);if(active){setRecord(next);setError('');}}
   catch(e){if(active){setRecord(null);setError(e.message);}}
   finally{pending=false;}
  };
  sync();const onVisible=()=>{if(document.visibilityState==='visible')sync();};
  const tick=setInterval(onVisible,15000);window.addEventListener('focus',onVisible);
  return()=>{active=false;clearInterval(tick);window.removeEventListener('focus',onVisible);};
 },[id,retry]);
 return error ? <div role="alert"><p>{error}</p><Button onClick={()=>setRetry(n=>n+1)}>Try again</Button></div> : record ? <ObservationRecord record={record}/> : <p role="status">Loading original notes and charts…</p>;
}
