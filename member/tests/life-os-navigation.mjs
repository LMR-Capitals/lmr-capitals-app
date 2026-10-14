import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import React from 'react';
import {transformWithOxc} from 'vite';
let receive,navigated=null;
const frameWindow={};
const source=(await fs.readFile(new URL('../life-os-workspace.jsx',import.meta.url),'utf8')).replace(/^import .*;\n/gm,'').replace('export default function LifeOSWorkspace','function LifeOSWorkspace');
const transformed=await transformWithOxc(source,'workspace.jsx',{jsx:{runtime:'classic'}});
const context=vm.createContext({React,sb:null,useState:value=>[value,()=>{}],useRef:()=>({current:{contentWindow:frameWindow}}),useEffect:effect=>effect(),location:{origin:'https://lmrcapitals.com'},window:{addEventListener:(name,fn)=>{receive=fn;},removeEventListener:()=>{}}});
vm.runInContext(transformed.code+'\nthis.component=LifeOSWorkspace',context);
context.component({active:true,preview:true,onNavigate:route=>{navigated=route;}});
const valid={origin:'https://lmrcapitals.com',source:frameWindow,data:{type:'lmr-life-os-navigation',action:'settings'}};
for(const event of [{...valid,origin:'https://other.test'},{...valid,source:{}},{...valid,data:{...valid.data,action:'admin'}},{...valid,data:{type:'different',action:'settings'}}]){receive(event);assert.equal(navigated,null);}
receive(valid);assert.equal(navigated,'settings');
console.log('PASS: Life OS account navigation works in preview, accepts only its own same-origin frame and only the settings action.');
