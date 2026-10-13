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
 const url=chart=>chart.path ? `${baseUrl}/storage/v1/object/public/app-images/${chart.path.split('/').map(encodeURIComponent).join('/')}?v=${encodeURIComponent(chart.version || '')}` : null;
 return {...data,charts:(data.charts || []).map(c=>({...c,url:url(c)}))};
}
