import React,{useEffect,useRef,useState} from "react";
import {sb} from "./api.js";
export default function LifeOSWorkspace({active,preview}){
 const [visited,setVisited]=useState(active);
 const frameRef=useRef(null);
 useEffect(()=>{if(active)setVisited(true)},[active]);
 // Hand the already-verified admin session to the Life OS iframe so it opens
 // without a second login. Push on load, on request from the iframe, and on every
 // parent auth change (so a token refresh propagates in). Same-origin only.
 useEffect(()=>{
  if(preview||!sb) return;
  const post=async()=>{
   const frame=frameRef.current; if(!frame||!frame.contentWindow) return;
   try{
    const {data}=await sb.auth.getSession(); const s=data?.session;
    if(s?.access_token&&s?.refresh_token)
     frame.contentWindow.postMessage({type:"lmr-life-os-session",access_token:s.access_token,refresh_token:s.refresh_token},location.origin);
   }catch{/* ignore */}
  };
  const onMsg=(event)=>{
   if(event.origin!==location.origin) return;
   if(frameRef.current&&event.source!==frameRef.current.contentWindow) return;
   if(event.data&&event.data.type==="lmr-life-os-request-session") post();
  };
  window.addEventListener("message",onMsg);
  const {data:sub}=sb.auth.onAuthStateChange(()=>post());
  post();
  return ()=>{window.removeEventListener("message",onMsg); sub?.subscription?.unsubscribe?.();};
 },[preview,visited]);
 if(!visited&&!active)return null;
 return <section className="journal-workspace" id="workspace-life-os" tabIndex={-1} hidden={!active} aria-label="Life OS workspace"><iframe ref={frameRef} title="LMR Life OS" src={"/life-os/index.html"+(preview?"?preview=1":"")} sandbox="allow-scripts allow-same-origin allow-forms allow-downloads allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"/></section>
}
