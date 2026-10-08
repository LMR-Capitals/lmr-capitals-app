import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import { workspaceJournalHtml } from "./journal-workspace.mjs";

const canonical = await readFile(new URL("../app/app.html", import.meta.url), "utf8");
const embedded = workspaceJournalHtml(canonical);
assert.equal(embedded.replace('<script src="/journal-workspace-bridge.js" defer></script>', ""), canonical, "Embedded Journal must preserve the complete canonical runtime");
const bridge = await readFile(new URL("../public/journal-workspace-bridge.js", import.meta.url), "utf8");
let handler, redirect, messages = [];
const parent = { postMessage: (...args) => messages.push(args) };
const location = { origin: "https://lmrcapitals.com", href: "https://lmrcapitals.com/app/workspace.html", replace: (url) => { redirect = url; } };
vm.runInNewContext(bridge, { window: { parent }, parent, location, URL, document: { addEventListener: (_type, listener) => { handler = listener; } } });
for (const [href, action] of [["https://lmrcapitals.com/inner-circle", "circle"], ["https://lmrcapitals.com/inner-circle#billing", "membership"], ["https://other.test/inner-circle", null], ["https://lmrcapitals.com/app/journal-import.html", null]]) {
  messages = []; let prevented = false;
  handler({ target: { closest: () => ({ href }) }, preventDefault: () => { prevented = true; } });
  assert.equal(prevented, !!action);
  assert.equal(messages.length, action ? 1 : 0);
  if (action) { assert.equal(messages[0][0].action, action); assert.equal(messages[0][1], location.origin); assert.deepEqual(Object.keys(messages[0][0]).sort(), ["action", "type"]); }
}
const standalone = {}; standalone.parent = standalone;
vm.runInNewContext(bridge, { window: standalone, location });
assert.equal(redirect, "/inner-circle#application", "Direct embedded URL must return to role-checked workspace");
console.log("PASS: canonical Journal preservation, same-origin navigation bridge, no token messages, standalone entry routing.");
