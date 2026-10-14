// Signing always runs with the caller's authenticated client and Storage RLS.
// Never fall back to public URLs when access is denied; do not cache across users.
export async function signJournalCharts(client, rows) {
 const paths = [...new Set(rows.flatMap(row => (row.charts || []).map(c => c.path).filter(Boolean)))];
 const signed = new Map();
 for (let offset = 0; offset < paths.length; offset += 100) {
  const {data, error} = await client.storage.from('app-images').createSignedUrls(paths.slice(offset, offset + 100), 300);
  if (error) throw new Error('Unable to load private Journal images. Please sign in again.');
  for (const item of data || []) if (item.signedUrl && !item.error) signed.set(item.path, item.signedUrl);
 }
 return rows.map(row => ({...row, charts: (row.charts || []).map(chart => ({...chart, url: signed.get(chart.path) || null}))}));
}
