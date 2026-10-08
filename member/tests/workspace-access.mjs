import assert from "node:assert/strict";
import { administratorEntry, resolveWorkspaceAccess, workspaceRole } from "../workspace-access.mjs";
let registered = true, level = "aal2", paid = false, entitled = false, failure = null;
let calls = [];
const user = { id: "verified-identity", email: "admin@lmrcapitals.com" };
const client = {
  auth: {
    getUser: async () => ({ data: { user } }),
    mfa: { getAuthenticatorAssuranceLevel: async () => { calls.push("mfa"); return { data: { currentLevel: level } }; } },
  },
  rpc: async (name) => { calls.push(name); return { data: name === "is_admin" ? registered : name === "circle_is_paid" ? paid : entitled, error: failure }; },
  from: (table) => { calls.push(table); return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null }) }) }) }; },
};
let access = await resolveWorkspaceAccess(client, user);
assert.equal(workspaceRole(access), "administrator");
assert.deepEqual(calls, ["is_admin", "mfa"], "Administrators must not depend on membership RPCs or subscription tables");
assert.equal(administratorEntry(access, "dashboard"), "/inner-circle#admin");
assert.equal(administratorEntry(access, "billing"), "/inner-circle#admin");
assert.equal(administratorEntry(access, "admin-hub"), null);
assert.equal(administratorEntry(access, "application"), null);
assert.equal(workspaceRole({ ...access, paid: true }), "administrator", "Admin role wins over paid status");
level = "aal1";
access = await resolveWorkspaceAccess(client, user);
assert.equal(access.entitled, false);
assert.equal(administratorEntry(access, "admin-hub"), "/admin?next=circle");
registered = false;
for (const [invoice, permission, role] of [[false, false, "free"], [true, true, "paid"], [true, false, "free"], [false, true, "free"]]) {
  paid = invoice; entitled = permission; calls = [];
  access = await resolveWorkspaceAccess(client, user);
  assert.equal(workspaceRole(access), role);
  assert.equal(access.admin, false, "An administrator email alone cannot grant the role");
  assert.equal(administratorEntry(access, "dashboard"), null);
  assert.ok(!calls.includes("mfa"));
}
failure = new Error("Authorization unavailable");
await assert.rejects(resolveWorkspaceAccess(client, user), /Authorization unavailable/);
failure = null;
await assert.rejects(resolveWorkspaceAccess(client, { id: "different-cached-user" }), /Sign in again/);
assert.equal(workspaceRole(null), null);
console.log("PASS: automatic administrator/free/paid routing, registry priority, MFA, verified identity, independent admin access and fail-closed member access.");
