import React,{useEffect,useState} from 'react';
import {loadWeekPlans} from './repository.mjs';
import {formatDay} from './calendar.mjs';

// Week Plan: shows ONLY the current week's LMR plan. History (with the recorded outcome/path)
// lives in public.lmr_week_plans; the Sunday "Week Plan" automation writes a new row every week
// and mirrors the current week into payload.weekPlan.
const range=(a,b)=>a&&b?`${formatDay(a,{month:'short',day:'numeric'})} – ${formatDay(b,{month:'short',day:'numeric',year:'numeric'})}`:'';
export function currentWeekPlan(rows,fallback,today){
 const hit=(rows||[]).find(r=>r.week_start<=today&&today<=r.week_end);
 if(hit)return hit;
 if(fallback&&fallback.week_start<=today&&today<=fallback.week_end)return fallback;
 // Weekend before the plan's Monday (plan is written Sunday evening): show the upcoming week.
 const upcoming=(rows||[]).filter(r=>r.week_start>today).sort((a,b)=>a.week_start.localeCompare(b.week_start))[0];
 return upcoming||(fallback&&fallback.week_start>today?fallback:null);
}
function List({items}){return items?.length?<ul className="wp-list">{items.map((x,i)=><li key={i}>{x}</li>)}</ul>:<div className="empty">Nothing recorded.</div>}
function Section({title,children,className=''}){return <section className={'panel wp-section '+className}><div className="section-head"><h2>{title}</h2></div>{children}</section>}
export default function WeekPlan({data,today,save,ready}){
 const [rows,setRows]=useState(null),[error,setError]=useState('');
 useEffect(()=>{let active=true;loadWeekPlans().then(r=>{if(active)setRows(r)}).catch(e=>{if(active){setRows([]);setError(e.message)}});return()=>{active=false}},[]);
 const week=currentWeekPlan(rows,data.weekPlan,today);
 const past=(rows||[]).filter(r=>!week||r.week_key!==week.week_key).filter(r=>r.week_end<today);
 if(rows===null&&!data.weekPlan)return <div className="empty">Loading your week plan…</div>;
 if(!week)return <section className="panel"><div className="empty">Your plan for this week arrives Sunday 18:31 New York time, right after the futures open.{error&&<><br/><small>{error}</small></>}</div><PastWeeks past={past}/></section>;
 const p=week.plan||{};
 const checks=(data.weekPlanChecks||{})[week.week_key]||[];
 const toggle=i=>{if(!ready)return;const next=checks.includes(i)?checks.filter(x=>x!==i):[...checks,i].sort((a,b)=>a-b);save({...data,weekPlanChecks:{...(data.weekPlanChecks||{}),[week.week_key]:next}})};
 return <div className="week-plan">
  <section className="panel wp-hero"><span className="badge">{week.week_key}</span><h2>{week.title}</h2><small className="muted">{range(week.week_start,week.week_end)} · This week only · a new plan arrives every Sunday</small>{week.summary&&<p>{week.summary}</p>}</section>
  <div className="two-columns">
   <Section title="Objectives this week"><div className="tasks">{(p.objectives||[]).map((o,i)=><label key={i} className={'task wp-objective '+(checks.includes(i)?'done':'')}><input type="checkbox" checked={checks.includes(i)} onChange={()=>toggle(i)} aria-label={'Mark objective done: '+o}/><span className="task-title">{o}</span></label>)}{!(p.objectives||[]).length&&<div className="empty">No objectives recorded.</div>}</div><small className="muted">{checks.length} / {(p.objectives||[]).length} done</small></Section>
   <Section title="Things to care about"><List items={p.cautions}/></Section>
  </div>
  <Section title="Context"><List items={p.context}/></Section>
  <div className="two-columns">
   <Section title="Key levels · Premium (above)"><List items={p.levels?.above}/></Section>
   <Section title="Key levels · Discount (below)"><List items={p.levels?.below}/></Section>
  </div>
  <Section title="Intermarket · DXY · US10Y · ZN"><List items={p.intermarket}/></Section>
  <Section title="Calendar (New York time)"><div className="wp-calendar">{(p.calendar||[]).map(d=><div key={d.day} className="wp-day"><strong>{d.day}</strong><ul>{(d.items||[]).map((x,i)=><li key={i} className={String(x).includes('★')?'wp-key':''}>{x}</li>)}</ul></div>)}</div></Section>
  <Section title="Scenarios"><div className="wp-scenarios">{(p.scenarios||[]).map(s=><article key={s.name}><h3>{s.name}</h3><p>{s.path}</p></article>)}</div></Section>
  {week.outcome_md&&<Section title="Outcome (recorded Friday)"><pre className="wp-md">{week.outcome_md}</pre></Section>}
  <PastWeeks past={past}/>
  <p className="muted wp-footer">Journal record from LMR data — not trading advice.</p>
 </div>;
}
function PastWeeks({past}){
 if(!past.length)return null;
 return <details className="panel wp-past"><summary>Past weeks · the path ({past.length})</summary>{past.map(r=><details key={r.week_key} className="wp-past-week"><summary><strong>{r.title}</strong><span className="muted"> {range(r.week_start,r.week_end)}{r.outcome?` · ${r.outcome.scenario_played?'Scenario '+r.outcome.scenario_played:'Outcome recorded'}`:' · outcome pending'}</span></summary>{r.summary&&<p>{r.summary}</p>}{r.outcome_md?<pre className="wp-md">{r.outcome_md}</pre>:<div className="empty">The Friday weekly review records how this week played out.</div>}</details>)}</details>;
}
