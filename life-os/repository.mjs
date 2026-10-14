import {lifeOsClient as sb, sessionReady} from './client.mjs';
import {preview} from '../member/config.js';
import {verifyTerminalAccess} from '../admin/terminal-access.mjs';
export {preview};
let sample={version:0,data:{goals:[{id:'sample',title:'Plan your next meaningful goal',category:'Personal',description:'Illustrative example. Your private records appear only after LMR administrator verification.',date:''}],tasks:[],reviews:[],reminders:[],habits:[],achievementRecords:[],roadmap:[],financialReference:[['Reference amounts','Not shown in preview']],deadlines:[]}};
export async function verifyAccess(){
 if(preview)return {id:'illustrative-preview'};
 await sessionReady; // adopt the parent's verified admin session before checking
 const access=await verifyTerminalAccess(sb);
 if(access.stage!=='ready')throw new Error(access.stage==='verify'?'Complete LMR two-factor verification to open Life OS.':'Life OS is available only to verified LMR administrators.');
 return access.user;
}
export async function loadWorkspace(){
 const user=await verifyAccess();if(preview)return structuredClone(sample);
 const {data,error}=await sb.from('life_os_workspaces').select('version,payload').eq('user_id',user.id).maybeSingle();
 if(error)throw new Error('Your Life OS records could not load. '+error.message);
 return {version:data?.version||0,data:data?.payload||null};
}
export async function saveWorkspace(version,data){
 await verifyAccess();
 if(new TextEncoder().encode(JSON.stringify(data)).length>20*1024*1024)throw new Error('Your workspace exceeds 20 MB. Export it and reduce achievement images before saving.');
 if(preview){if(version!==sample.version)throw new Error('Newer preview changes exist.');sample={version:version+1,data:structuredClone(data)};return {version:sample.version}}
 const result=await sb.rpc('life_os_save_workspace',{p_version:version,p_payload:data});
 if(result.error)throw new Error(result.error.code==='40001'?'Another device saved newer changes. Download your attempted changes, then reload.':'Could not save Life OS. '+result.error.message);
 return {version:result.data};
}
// Week plan history (public.lmr_week_plans, owner-only RLS). Newest first.
let samplePlans=[];
export async function loadWeekPlans(limit=26){
 const user=await verifyAccess();if(preview)return structuredClone(samplePlans);
 const {data,error}=await sb.from('lmr_week_plans').select('week_key,week_start,week_end,title,summary,plan,outcome,outcome_md').eq('user_id',user.id).order('week_start',{ascending:false}).limit(limit);
 if(error)throw new Error('Your week plans could not load. '+error.message);
 return data||[];
}
