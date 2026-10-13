import {newestJournalFirst} from './journal-order.mjs';
export function mergeObservations(posts=[],live=[]) {
 const keys=new Set(live.map(p=>`${p.source_owner_id}:${p.source_id}`));
 return newestJournalFirst([...live,...posts.filter(p=>p.kind==='observation'&&!keys.has(`${p.source_owner_id}:${p.source_id}`))]);
}
export async function fetchLiveObservations(client) {
 const rows=[];
 for(let offset=0;;offset+=100) {
  const {data,error}=await client.rpc('circle_live_observations',{p_offset:offset});
  if(error) throw new Error(error.message);
  rows.push(...(data || []));
  if(!data || data.length<100) return newestJournalFirst(rows);
 }
}
export async function fetchObservationDetail(client,id) {
 const {data,error}=await client.rpc('circle_live_observations',{p_source_id:id});
 if(error) throw new Error(error.message);
 return data;
}
