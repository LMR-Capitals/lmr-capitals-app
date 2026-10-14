import {newestJournalFirst} from './journal-order.mjs';
// Page through authorized rows so records beyond the first 100 are not dropped.
export async function fetchPublications(client,administrator=false) {
  const rows = [];
  for(let offset=0;;offset+=100) {
    let query = client.from('circle_posts').select('*');
    if(!administrator) query = query.eq('status','published');
    const {data,error} = await query.order('created_at',{ascending:false}).order('id',{ascending:true}).range(offset,offset+99);
    if(error) throw new Error(error.message);
    rows.push(...(data || []));
    if(!data || data.length<100) return newestJournalFirst(rows);
  }
}
