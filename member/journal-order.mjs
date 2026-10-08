// The date of the original record controls chronology, not an edit/republication.
const timestamp = value => {
  if (typeof value !== 'string' || !value.trim()) return null;
  const time = Date.parse(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00Z` : value);
  return Number.isFinite(time) ? time : null;
};
export function journalRecordedAt(record) {
  const kind = record.source_kind || record.kind;
  const details = record.source_details || record;
  const tradeDate = kind === 'trade' ? details.date || record.body?.match(/(?:^| · )Date: (\d{4}-\d{2}-\d{2})(?:$| · )/)?.[1] : null;
  const primary = kind === 'achievement' ? details.achieved_on : kind === 'observation' ? details.created_at : tradeDate;
  return timestamp(primary) ?? timestamp(details.recorded_at) ?? timestamp(details.created_at) ?? timestamp(record.published_at) ?? timestamp(record.created_at) ?? timestamp(record.updated_at) ?? 0;
}
export function newestJournalFirst(records = []) {
  return [...records].sort((a,b) => journalRecordedAt(b)-journalRecordedAt(a) || `${a.source_kind || a.kind || ''}:${a.id || ''}`.localeCompare(`${b.source_kind || b.kind || ''}:${b.id || ''}`));
}
