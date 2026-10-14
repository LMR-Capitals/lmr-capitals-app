import assert from "node:assert/strict";
import { verifyTerminalAccess } from "./terminal-access.mjs";
const makeClient = ({
  user = { id: "owner" },
  admin = true,
  level = "aal2",
  identityError = null,
  registryError = null,
  assuranceError = null,
} = {}) => {
  const calls = [];
  return {
    calls,
    auth: {
      getUser: async () => {
        calls.push("identity");
        return { data: { user }, error: identityError };
      },
      mfa: {
        getAuthenticatorAssuranceLevel: async () => {
          calls.push("mfa");
          return { data: { currentLevel: level }, error: assuranceError };
        },
      },
    },
    rpc: async (name) => {
      calls.push(name);
      return { data: admin, error: registryError };
    },
  };
};
for (const client of [
  makeClient({ user: null }),
  makeClient({ identityError: { name: "AuthSessionMissingError" } }),
]) {
  assert.equal((await verifyTerminalAccess(client)).stage, "signin");
  assert.deepEqual(client.calls, ["identity"]);
}
for (const admin of [false, null, "true", []]) {
  const client = makeClient({
    user: { id: "ordinary-user", email: "admin@lmrcapitals.com" },
    admin,
  });
  assert.equal(
    (await verifyTerminalAccess(client)).stage,
    "denied",
    "The displayed admin email cannot grant access",
  );
  assert.deepEqual(client.calls, ["identity", "is_admin"]);
}
for (const level of ["aal1", null, "aal3"])
  assert.equal(
    (await verifyTerminalAccess(makeClient({ level }))).stage,
    "verify",
  );
const verified = makeClient();
assert.equal((await verifyTerminalAccess(verified)).stage, "ready");
assert.deepEqual(
  verified.calls,
  ["identity", "is_admin", "mfa"],
  "Admin access must not depend on membership or chapter RPCs",
);
for (const field of ["identityError", "registryError", "assuranceError"])
  await assert.rejects(
    () =>
      verifyTerminalAccess(makeClient({ [field]: new Error("unavailable") })),
    /unavailable/,
  );
console.log(
  "Admin Terminal access passed: registry and MFA required, missing/error sessions fail closed, no membership dependency.",
);
