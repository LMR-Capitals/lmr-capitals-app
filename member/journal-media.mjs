export function journalImageUrl(value) {
  if (typeof value !== "string") return null;
  if (
    /^data:image\/(?:png|jpeg|jpg|webp);base64,[a-zA-Z0-9+/=\r\n]+$/.test(value)
  )
    return value;
  if (/^\/(?:icons|term)\/[a-zA-Z0-9 _().-]+\.(?:png|jpe?g|webp)$/.test(value))
    return value;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password
      ? url.href
      : null;
  } catch {
    return null;
  }
}
export function journalPublication(source, owner) {
  return {
    id: crypto.randomUUID(),
    author_id: owner,
    kind: source.kind === "trade" ? "execution" : source.kind,
    title: source.title,
    source_details: journalDetails(source),
    body: source.kind === "achievement" ? source.caption || "" : source.kind === "trade" ? source.body || "" : "",
    source_kind: source.kind,
    source_id: source.id,
    source_owner_id: owner,
    source_content: source.kind === "observation" ? source.content : null,
    source_image: ["achievement", "trade"].includes(source.kind) ? source.image : null,
    image_url:
      ["achievement", "trade"].includes(source.kind) ? journalImageUrl(source.image) : null,
    image_caption: source.title,
    status: "published",
    published_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    preview: true,
  };
}

export function journalDetails(source) {
  const keys = source.kind === 'observation'
    ? ['title', 'session_tag', 'created_at', 'updated_at']
    : source.kind === 'achievement'
      ? ['title', 'caption', 'category', 'firm', 'amount', 'achieved_on', 'created_at', 'updated_at']
      : ['entry_slot', 'entry_label', 'date', 'created_at', 'recorded_at'];
  return Object.fromEntries(keys.filter(key => source[key] != null).map(key => [key, source[key]]));
}
export function journalTitle(record) {
  const title = record.source_details?.title;
  return typeof title === 'string' && title.trim() ? title : record.title;
}
export function journalCaption(record) {
  const caption = record.source_details?.caption ?? record.caption ?? record.body;
  return typeof caption === 'string' ? caption : '';
}
export function observationMeta(content) {
  const match = typeof content === 'string' && content.match(/<!--obsmeta\s*(\{[\s\S]*?\})-->/);
  if (!match) return {};
  try {
    const meta = JSON.parse(match[1]);
    return {market: typeof meta.m === 'string' ? meta.m.slice(0, 80) : '', timeframe: typeof meta.tf === 'string' ? meta.tf.slice(0, 80) : ''};
  } catch { return {}; }
}
export function achievementDisplay(record) {
  const item = record.source_details || record;
  const category = typeof item.category === 'string' ? item.category : 'Achievement';
  const firm = typeof item.firm === 'string' ? item.firm : '';
  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(item.achieved_on || '') && new Date(`${item.achieved_on}T12:00:00Z`);
  const date = parsed && !Number.isNaN(parsed.getTime()) ? new Intl.DateTimeFormat('en-US', {year:'numeric', month:'short', day:'numeric', timeZone:'UTC'}).format(parsed) : '';
  const amount = Number(item.amount);
  return {category, firm, date, payout: category.toLowerCase().includes('payout') && Number.isFinite(amount) && amount > 0 ? new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(amount) : null};
}
