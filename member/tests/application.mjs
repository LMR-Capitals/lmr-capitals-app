import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
const source = await readFile(
  new URL("../../app/app.html", import.meta.url),
  "utf8",
);
const start = source.indexOf("async function _checkEntitled(uid){"),
  end = source.indexOf("function _showSubscribeGate", start);
let result = { data: true, error: null },
  admin = { data: false, error: null },
  assurance = { data: { currentLevel: "aal2" }, error: null },
  calls = [];
const context = vm.createContext({
  _sb: {
    rpc: async (name) => {
      calls.push(name);
      if (name === "is_admin") return admin;
      assert.equal(name, "circle_can_access");
      return result;
    },
    auth: { mfa: { getAuthenticatorAssuranceLevel: async () => assurance } },
  },
});
vm.runInContext(source.slice(start, end), context);
assert.equal(await context._checkEntitled("member"), true);
result = { data: false, error: null };
assert.equal(await context._checkEntitled("free"), false);
result = { data: true, error: new Error("unavailable") };
assert.equal(await context._checkEntitled("member"), false);
admin = { data: true, error: null };
calls = [];
assert.equal(await context._checkEntitled("admin"), true);
assert.deepEqual(
  calls,
  ["is_admin"],
  "Verified admin journal access does not need member schema",
);
for (const level of ["aal1", null]) {
  assurance = { data: { currentLevel: level }, error: null };
  assert.equal(await context._checkEntitled("admin"), false);
}
assurance = { data: { currentLevel: "aal2" }, error: new Error("unavailable") };
assert.equal(await context._checkEntitled("admin"), false);
admin = { data: true, error: new Error("unavailable") };
assert.equal(await context._checkEntitled("admin"), false);
context._sb = {
  rpc: async () => {
    throw new Error("network");
  },
};
assert.equal(await context._checkEntitled("member"), false);
context._sb = null;
assert.equal(await context._checkEntitled("member"), false);
console.log(
  "PASS: Journal Application requires server membership or registered MFA admin; errors fail closed.",
);
