const textDecoder = new TextDecoder('utf-8');

// Read only the ZIP central directory and the entries named by the signed-in
// user's private Journal rows. Nothing is extracted to the site or filesystem.
export async function openJournalArchive(file) {
  if (!file || file.size > 25 * 1024 * 1024) throw new Error('Choose the original Notes Journal.zip (25 MB maximum).');
  const buffer = await file.arrayBuffer();
  const view = new DataView(buffer);
  let end = -1;
  for (let p = view.byteLength - 22; p >= Math.max(0, view.byteLength - 65557); p--) {
    if (view.getUint32(p, true) === 0x06054b50) { end = p; break; }
  }
  if (end < 0) throw new Error('The selected file is not a readable ZIP archive.');
  const count = view.getUint16(end + 10, true);
  let pos = view.getUint32(end + 16, true);
  const entries = new Map();
  for (let i = 0; i < count; i++) {
    if (pos + 46 > view.byteLength || view.getUint32(pos, true) !== 0x02014b50)
      throw new Error('The ZIP directory is damaged.');
    const method = view.getUint16(pos + 10, true);
    const compressedSize = view.getUint32(pos + 20, true);
    const size = view.getUint32(pos + 24, true);
    const nameLength = view.getUint16(pos + 28, true);
    const extraLength = view.getUint16(pos + 30, true);
    const commentLength = view.getUint16(pos + 32, true);
    const offset = view.getUint32(pos + 42, true);
    const next = pos + 46 + nameLength + extraLength + commentLength;
    if (next > view.byteLength) throw new Error('The ZIP directory is truncated.');
    const name = textDecoder.decode(new Uint8Array(buffer, pos + 46, nameLength));
    entries.set(name, {method, compressedSize, size, offset});
    pos = next;
  }
  // Some Notion exports contain one legacy-encoded punctuation mark in a ZIP
  // filename. Match that path only when its ASCII skeleton is unambiguous.
  const skeleton = name => name.normalize('NFKD').replace(/[^\x20-\x7e]+/g, '?');
  const resolveName = name => {
    if (entries.has(name)) return name;
    const matches = [...entries.keys()].filter(candidate => skeleton(candidate) === skeleton(name));
    return matches.length === 1 ? matches[0] : null;
  };
  return {
    entries,
    hasImage(name) { return !!resolveName(name); },
    async image(name) {
      const actualName = resolveName(name);
      const item = entries.get(actualName);
      if (!item || !name.startsWith('Private & Shared/Notes/') || !name.toLowerCase().endsWith('.png'))
        throw new Error('Expected chart not found in this ZIP: ' + name);
      if (item.size > 5 * 1024 * 1024 || item.compressedSize > 5 * 1024 * 1024)
        throw new Error('A chart exceeds the 5 MB per-image limit.');
      const p = item.offset;
      if (p + 30 > view.byteLength || view.getUint32(p, true) !== 0x04034b50)
        throw new Error('A chart entry is damaged.');
      const start = p + 30 + view.getUint16(p + 26, true) + view.getUint16(p + 28, true);
      if (start + item.compressedSize > view.byteLength) throw new Error('A chart entry is truncated.');
      const compressed = new Uint8Array(buffer, start, item.compressedSize);
      let bytes;
      if (item.method === 0) bytes = compressed;
      else if (item.method === 8) {
        if (typeof DecompressionStream === 'undefined')
          throw new Error('This browser cannot decompress ZIP files. Open this page in a current browser.');
        const stream = new Blob([compressed]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
        bytes = new Uint8Array(await new Response(stream).arrayBuffer());
      } else throw new Error('The ZIP uses an unsupported compression method.');
      if (bytes.byteLength !== item.size) throw new Error('A chart did not decompress completely.');
      return new Blob([bytes], {type:'image/png'});
    }
  };
}
