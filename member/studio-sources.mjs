import {signJournalCharts} from './private-journal-media.mjs';
export async function fetchStudioSources(client,kind) {
 const rows=[];
 for(let offset=0;;offset+=100) {
  const {data,error}=await client.rpc('circle_studio_sources',{p_kind:kind,p_offset:offset});
  if(error) throw new Error(error.message);
  rows.push(...(data || []));if(!data || data.length<100)return rows;
 }
}
export async function fetchStudioDetail(client,kind,id,baseUrl) {
 const {data,error}=await client.rpc('circle_studio_sources',{p_kind:kind,p_source_id:id});
 if(error) throw new Error(error.message);
 return (await signJournalCharts(client, [data]))[0];
}

// Read only session labels for the same owner-approved source IDs. No Journal writes.
export async function fetchStudioTrades(client) {
 const rows=await fetchStudioSources(client,'trade');
 if(!rows.length)return rows;
 const {data:identity,error:identityError}=await client.auth.getUser();
 if(identityError || !identity?.user?.id)throw new Error(identityError?.message || 'Sign in again to load your trade sessions.');
 const sessions=new Map();
 for(let offset=0;offset<rows.length;offset+=100){
  const {data,error}=await client.from('trades').select('id,session').eq('user_id',identity.user.id).in('id',rows.slice(offset,offset+100).map(row=>row.id));
  if(error)throw new Error(error.message);
  for(const row of data || [])sessions.set(row.id,row.session);
 }
 return rows.map(row=>({...row,source_details:{session:sessions.get(row.id) ?? null}}));
}
