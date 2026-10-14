import React,{useEffect,useState} from "react";
export default function LifeOSWorkspace({active,preview}){
 const [visited,setVisited]=useState(active);useEffect(()=>{if(active)setVisited(true)},[active]);
 if(!visited&&!active)return null;
 return <section className="journal-workspace" id="workspace-life-os" tabIndex={-1} hidden={!active} aria-label="Life OS workspace"><iframe title="LMR Life OS" src={"/life-os/index.html"+(preview?"?preview=1":"")} sandbox="allow-scripts allow-same-origin allow-forms allow-downloads allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"/></section>
}
