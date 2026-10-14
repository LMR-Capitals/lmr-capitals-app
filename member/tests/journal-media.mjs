import assert from "node:assert/strict";
import { journalImageUrl } from "../journal-media.mjs";
for (const value of [
  "javascript:alert(1)",
  "data:image/svg+xml;base64,PHN2Zz4=",
  "data:text/html;base64,AAAA",
  "http://example.com/image.png",
  "//example.com/image.png",
  "/icons/../../private.png",
  "https://user:secret@example.com/image.png",
  null,
])
  assert.equal(journalImageUrl(value), null);
for (const value of [
  "data:image/png;base64,AAAA",
  "data:image/webp;base64,BBBB",
  "https://example.com/chart.png",
  "/term/lmrkb-0.png",
  "/icons/High-Resolution-Color-Logo-on-Transparent-Background.png",
])
  assert.equal(journalImageUrl(value), value);
console.log(
  "PASS: journal media accepts supported charts and blocks active payloads, insecure URLs, credentials and arbitrary relative paths.",
);
