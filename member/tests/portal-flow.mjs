import assert from "node:assert/strict";
import { journalDestination, adminReturnDestination, canOpenJournal, journalWorkspaceMessage, openJournal } from "../portal-flow.mjs";
import { hubRpc, journalRecords, journalCollections } from "../../admin/hub-api.mjs";
assert.equal(journalDestination(null), "/inner-circle#application");
assert.equal(journalDestination({ entitled: false }), "/inner-circle?next=journal#billing");
assert.equal(journalDestination({ paid: true, entitled: true }), "/inner-circle#application");
assert.equal(journalDestination({ admin: true, adminVerified: true }), "/inner-circle#application");
assert.equal(journalDestination({ admin: true, entitled: true, adminVerified: false }), "/admin?next=journal");
for (const unsafe of ["https://example.com", "//example.com", "/app?bypass=1", null]) assert.equal(adminReturnDestination(unsafe), "/inner-circle#admin");
assert.equal(adminReturnDestination("journal"), "/inner-circle#application");
let level = "aal2", admin = true, queries = 0, rpcNames = [];
const client = {
  auth: { getUser: async () => ({ data: { user: { id: "admin-owner" } } }), mfa: { getAuthenticatorAssuranceLevel: async () => ({ data: { currentLevel: level } }) } },
  rpc: async (name) => { rpcNames.push(name); return { data: name === "is_admin" ? admin : [{ total_users: 3 }] }; },
  from: (table) => {
    queries++; assert.equal(table, "trades");
    return { select: (columns, options) => { assert.ok(!columns.includes("user_id")); assert.equal(options.count, "exact"); return { eq: (field, owner) => { assert.equal(field, "user_id"); assert.equal(owner, "admin-owner"); return { order: () => ({ range: async (start, end) => { assert.equal(start, 40); assert.equal(end, 59); return { data: [{ id: "trade" }], count: 229 }; } }) }; } }; } };
  },
};
assert.equal((await hubRpc(client, "admin_metrics"))[0].total_users, 3);
assert.equal((await journalRecords(client, "trades", 2)).count, 229);
for (const [role, assurance] of [[false, "aal2"], [true, "aal1"]]) {
  admin = role; level = assurance; queries = 0; rpcNames = [];
  await assert.rejects(journalRecords(client, "trades", 2), /verification/);
  await assert.rejects(hubRpc(client, "admin_list_users"), /verification/);
  assert.equal(queries, 0); assert.ok(!rpcNames.includes("admin_list_users"));
}
await assert.rejects(hubRpc(client, "dump_all_data"), /Unsupported/);
await assert.rejects(journalRecords(client, "subscriptions"), /Choose/);
await assert.rejects(journalRecords(client, "trades", -1), /Choose/);
const profile = journalCollections.find(([id]) => id === "profiles")[2];
assert.ok(!profile.includes("settings") && !profile.includes("discord_webhook"));
console.log("PASS: paid/free/admin portal destinations, MFA rechecks, owner-filtered pagination, RPC and field allowlists.");

// A legacy entitlement, email, preview flag or incomplete role never loads Journal.
for (const access of [null, {}, { entitled: true }, { paid: true }, { admin: true, adminVerified: false, paid: true, entitled: true }, { adminVerified: true }, { email: 'admin@lmrcapitals.com' }, { preview: true }]) assert.equal(canOpenJournal(access), false);
assert.equal(canOpenJournal({ paid: true, entitled: true }), true);
assert.equal(canOpenJournal({ admin: true, adminVerified: true }), true);
const frame = {}, origin = 'https://lmrcapitals.com';
const event = { source: frame, origin, data: { type: 'lmr-workspace-navigation', action: 'circle' } };
assert.equal(journalWorkspaceMessage(event, frame, origin), 'circle');
for (const invalid of [{ ...event, source: {} }, { ...event, origin: 'https://other.test' }, { ...event, data: { ...event.data, action: 'https://other.test' } }, { ...event, data: { action: 'circle' } }]) assert.equal(journalWorkspaceMessage(invalid, frame, origin), null);
let navigated = false;
globalThis.location = { pathname: '/inner-circle', hash: '#observations', assign: () => { navigated = true; } };
openJournal({ paid: true, entitled: true });
assert.equal(location.hash, 'application');
assert.equal(navigated, false, 'Switching Journal must retain the current document and session');
delete globalThis.location;
console.log('PASS: strict Journal roles, same-document switching and origin/source-checked navigation.');
