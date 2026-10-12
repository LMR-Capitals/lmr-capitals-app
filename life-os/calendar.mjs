export const timezone='America/New_York';
export function todayKey(now=new Date(),zone=timezone){const p=Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now).map(x=>[x.type,x.value]));return `${p.year}-${p.month}-${p.day}`;}
export const parseDay=key=>new Date(`${key}T12:00:00Z`);
export const dayKey=d=>`${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}`;
export function addDays(key,n){const d=parseDay(key);d.setUTCDate(d.getUTCDate()+n);return dayKey(d)}
export function monthStart(key,n=0){const d=parseDay(key);d.setUTCDate(1);d.setUTCMonth(d.getUTCMonth()+n);return dayKey(d)}
export function rangeFor(period,key){const d=parseDay(key);let start=key,end=key;if(period==='Weekly'){start=addDays(key,-((d.getUTCDay()+6)%7));end=addDays(start,6)}if(period==='Monthly'){start=monthStart(key);end=addDays(monthStart(start,1),-1)}if(period==='Quarterly'){start=monthStart(key,-(d.getUTCMonth()%3));end=addDays(monthStart(start,3),-1)}if(period==='Yearly'){start=monthStart(key,-d.getUTCMonth());end=addDays(monthStart(start,12),-1)}return {start,end}}
export function shiftPeriod(period,key,step){const {start}=rangeFor(period,key);return period==='Daily'?addDays(key,step):period==='Weekly'?addDays(start,7*step):monthStart(start,step*(period==='Monthly'?1:period==='Quarterly'?3:12))}
export function formatDay(key,options={month:'short',day:'numeric',year:'numeric'}){return new Intl.DateTimeFormat('en-US',{...options,timeZone:'UTC'}).format(parseDay(key))}
export function periodTitle(period,key){const {start,end}=rangeFor(period,key);if(period==='Daily')return formatDay(key,{weekday:'long',month:'long',day:'numeric',year:'numeric'});if(period==='Weekly')return `${formatDay(start)} – ${formatDay(end)}`;if(period==='Monthly')return formatDay(start,{month:'long',year:'numeric'});if(period==='Quarterly')return `Q${Math.floor(parseDay(start).getUTCMonth()/3)+1} ${parseDay(start).getUTCFullYear()}`;return String(parseDay(start).getUTCFullYear())}
export const tasksInRange=(tasks,range)=>tasks.filter(t=>t.due&&t.due>=range.start&&t.due<=range.end);
