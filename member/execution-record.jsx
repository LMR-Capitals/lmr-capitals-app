import React from 'react';
import {executionDetails} from './executions.mjs';
export default function ExecutionRecord({record, compact = false}) {
 const details = executionDetails(record);
 return <div className="execution-record">
  <div className="execution-charts">{(record.charts || []).map(chart => <figure key={chart.label}>
   <figcaption>{chart.label}</figcaption>
   {chart.url ? <img src={chart.url} alt={`${record.title} · ${chart.label}`} loading="lazy"/> : <p className="execution-missing">No chart saved yet</p>}
  </figure>)}</div>
  <dl className="execution-details">{(compact ? details.filter(d => ['session','open_time','close_time','pnl','risk','rr'].includes(d.key)) : details).map(d => <div key={d.key}><dt>{d.label}</dt><dd>{d.value}</dd></div>)}</dl>
 </div>;
}
