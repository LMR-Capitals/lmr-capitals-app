import {newestJournalFirst} from './journal-order.mjs';
export function mergeExecutions(posts = [], live = []) {
 const keys = new Set(live.map(p => `${p.source_owner_id}:${p.source_id}`));
 return newestJournalFirst([...live, ...posts.filter(p => p.kind === 'execution' && !keys.has(`${p.source_owner_id}:${p.source_id}`))]);
}
export async function fetchLiveExecutions(client, baseUrl) {
 const rows = [];
 for(let offset=0;;offset+=100) {
  const {data,error} = await client.rpc('circle_live_executions',{p_offset:offset});
  if(error) throw new Error(error.message);
  const page = data || [];
  rows.push(...page.map(p => ({...p, charts:(p.charts || []).map(chart => ({...chart,
   url:chart.path ? `${baseUrl}/storage/v1/object/public/app-images/${chart.path.split('/').map(encodeURIComponent).join('/')}?v=${encodeURIComponent(chart.version || '')}` : null
  }))})));
  if(page.length < 100) return newestJournalFirst(rows);
 }
}
const labels = [['date','Date'],['market','Market'],['position','Direction'],['session','Session'],['open_time','Open'],['close_time','Close'],['models','Models'],['trade_models','Trade models'],['pnl','P&L'],['risk','Risk'],['rr','R:R'],['lots','Lots'],['htf','HTF'],['rth','RTH'],['pd_array','PD array'],['plan_followed','Plan followed'],['grade','Grade'],['confirmations','Confirmations'],['emotions','Emotions'],['phases','Phases'],['mmm','MMM'],['movement','Movement'],['tframes','Timeframes'],['draws','Draws'],['feedback','Review']];
export function executionDetails(record) {
 const d = record.source_details || {};
 return labels.flatMap(([key,label]) => {
  const value = d[key];
  if(value == null || value === '' || (Array.isArray(value) && !value.length)) return [];
  const text = Array.isArray(value) ? value.filter(v => ['string','number'].includes(typeof v)).join(', ') : ['string','number','boolean'].includes(typeof value) ? String(value) : '';
  return text ? [{key,label,value:text}] : [];
 });
}

// Match Journal's SESSION_GROUPS without changing its saved session strings.
export const executionSessionGroups = [
 ['Asian',['Asian Killzone']],
 ['London',['Midnight Open','London Open','London Kill Zone','London Close']],
 ['NY AM',['Pre-NY Session','NY AM','NY Lunch']],
 ['NY PM',['NY PM','Final Hour']],
];
export function executionSession(record) {
 const saved = record.source_details?.session ?? record.body?.match(/(?:^| · )Session: (.*?)(?: · |$)/)?.[1];
 const value = typeof saved === 'string' ? saved.trim() : '';
 return ({AM:'NY AM',PM:'NY PM'})[value] || value;
}
export function filterExecutionSession(records, session) {
 return records.filter(p => session === 'all' || executionSession(p) === session);
}
