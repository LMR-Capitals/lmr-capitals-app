import React from 'react';
import {executionSession,executionSessionGroups} from './executions.mjs';
import {Button} from './ui';
export default function ExecutionSessionFilter({records,value,onChange}) {
 const known=executionSessionGroups.flatMap(([,sessions])=>sessions);
 const extra=[...new Set(records.map(executionSession))].filter(s=>s&&!known.includes(s)).sort();
 const count=session=>records.filter(p=>executionSession(p)===session).length;
 return <div className="execution-filters">
  <label>Session traded<select value={value} onChange={event=>onChange(event.target.value)}>
   <option value="all">All sessions ({records.length})</option>
   {executionSessionGroups.map(([group,sessions])=><optgroup key={group} label={group}>{sessions.map(session=><option key={session} value={session}>{session} ({count(session)})</option>)}</optgroup>)}
   {extra.length>0&&<optgroup label="Other saved sessions">{extra.map(session=><option key={session} value={session}>{session} ({count(session)})</option>)}</optgroup>}
   {count('')>0&&<option value="">Not recorded ({count('')})</option>}
  </select></label>
  {value!=='all'&&<Button small onClick={()=>onChange('all')}>Clear session filter</Button>}
 </div>;
}
