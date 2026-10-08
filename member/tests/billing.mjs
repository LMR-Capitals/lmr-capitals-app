import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { stripTypeScriptTypes } from "node:module";
import vm from "node:vm";
const env = {
  APP_URL: "https://lmrcapitals.com",
  STRIPE_SECRET_KEY: "test-placeholder",
  STRIPE_PRICE_MONTHLY: "price_monthly",
  STRIPE_PRICE_YEARLY: "price_yearly",
  MEMBER_LEGAL_APPROVED: "true",
  MEMBER_LEGAL_VERSION: "reviewed-v1",
};
let handler,
  existing = null,
  dbError = null,
  calls = [];
const context = vm.createContext({
  Request,
  Response,
  URL,
  URLSearchParams,
  Date,
  console,
  Deno: { env: { get: (k) => env[k] }, serve: (fn) => (handler = fn) },
});
const sharedSource = stripTypeScriptTypes(
  await readFile(
    new URL("../../database/functions/_shared/billing.ts", import.meta.url),
    "utf8",
  ),
);
const supabaseMock = new vm.SyntheticModule(
  ["createClient"],
  function () {
    this.setExport("createClient", () => ({}));
  },
  { context },
);
const realShared = new vm.SourceTextModule(sharedSource, { context });
await realShared.link(() => supabaseMock);
await realShared.evaluate();
assert.equal(
  realShared.namespace.callerOrigin(
    new Request("https://api.example.com", {
      headers: { Origin: "https://lmrcapitals.com" },
    }),
  ),
  "https://lmrcapitals.com",
);
assert.throws(
  () =>
    realShared.namespace.callerOrigin(
      new Request("https://api.example.com", {
        headers: { Origin: "https://evil.example" },
      }),
    ),
  /not allowed/,
);
env.APP_URL = "";
assert.equal(realShared.namespace.siteOrigin(), "https://lmrcapitals.com");
env.APP_URL = "https://lmrcapitals.com";
const shared = new vm.SyntheticModule(
  [
    "authenticate",
    "callerOrigin",
    "clean",
    "cors",
    "json",
    "service",
    "stripePost",
  ],
  function () {
    this.setExport("authenticate", async (req) => {
      if (!req.headers.get("Authorization")) throw new Error("unauthorized");
      return { id: "test-user", email: "test@example.com" };
    });
    for (const key of ["callerOrigin", "clean", "cors", "json"])
      this.setExport(key, realShared.namespace[key]);
    this.setExport("service", () => ({
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: existing, error: dbError }),
          }),
        }),
        upsert: async () => ({ error: dbError }),
      }),
    }));
    this.setExport("stripePost", async (path, params, key) => {
      calls.push({ path, params, key });
      return path === "/customers"
        ? { id: "cus_test" }
        : { url: "https://checkout.stripe.com/test" };
    });
  },
  { context },
);
const checkout = new vm.SourceTextModule(
  stripTypeScriptTypes(
    await readFile(
      new URL(
        "../../database/functions/create-checkout/index.ts",
        import.meta.url,
      ),
      "utf8",
    ),
  ),
  { context },
);
await checkout.link(() => shared);
await checkout.evaluate();
const call = async (body, auth = true) => {
  calls = [];
  return handler(
    new Request("https://api.example.com", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "https://lmrcapitals.com",
        ...(auth ? { Authorization: "Bearer test" } : {}),
      },
      body: JSON.stringify(body),
    }),
  );
};
const valid = {
  plan: "monthly",
  return_surface: "members",
  legal_version: "reviewed-v1",
};
assert.equal((await call(valid, false)).status, 401);
assert.equal(calls.length, 0);
assert.equal((await call({ ...valid, plan: "invented" })).status, 400);
assert.equal(calls.length, 0);
env.MEMBER_LEGAL_APPROVED = "false";
assert.equal((await call(valid)).status, 409);
assert.equal(calls.length, 0);
env.MEMBER_LEGAL_APPROVED = "true";
assert.equal(
  (await call({ ...valid, legal_version: "old-policy" })).status,
  409,
);
assert.equal(calls.length, 0);
env.STRIPE_PRICE_MONTHLY = "";
assert.equal((await call(valid)).status, 503);
assert.equal(calls.length, 0);
env.STRIPE_PRICE_MONTHLY = "price_monthly";
existing = {
  status: "active",
  stripe_customer_id: "cus_existing",
  stripe_subscription_id: "sub_existing",
};
assert.equal((await call(valid)).status, 409);
assert.equal(calls.length, 0);
existing = null;
dbError = { message: "database unavailable" };
assert.equal((await call(valid)).status, 400);
assert.equal(calls.length, 0);
dbError = null;
assert.equal((await call(valid)).status, 200);
let checkoutCall = calls.find((x) => x.path === "/checkout/sessions");
assert.equal(checkoutCall.params["line_items[0][price]"], "price_monthly");
assert.equal(
  checkoutCall.params["subscription_data[trial_period_days]"],
  undefined,
);
assert.equal(
  checkoutCall.params.success_url,
  "https://lmrcapitals.com/member/index.html?checkout=success#billing",
);
assert.ok(checkoutCall.key);
assert.equal(
  checkoutCall.params["subscription_data[metadata][user_id]"],
  "test-user",
);
assert.equal(
  (await call({ ...valid, return_surface: "app", legal_version: null })).status,
  409,
);
assert.equal((await call({ ...valid, return_surface: "app" })).status, 200);
checkoutCall = calls.find((x) => x.path === "/checkout/sessions");
assert.equal(
  checkoutCall.params["subscription_data[trial_period_days]"],
  undefined,
);
assert.equal(
  checkoutCall.params.success_url,
  "https://lmrcapitals.com/app/app.html?checkout=success",
);
existing = {
  status: "canceled",
  stripe_customer_id: "cus_existing",
  stripe_subscription_id: "sub_existing",
};
assert.equal((await call(valid)).status, 200);
checkoutCall = calls.find((x) => x.path === "/checkout/sessions");
assert.equal(checkoutCall.params.customer, "cus_existing");
assert.equal(
  checkoutCall.params["subscription_data[trial_period_days]"],
  undefined,
);
assert.equal(
  calls.some((x) => x.path === "/customers"),
  false,
);
console.log(
  "PASS: checkout authentication, origin allowlist, legal/version gate, unknown plans, missing price, existing subscription, database failure, trusted return URL, existing customer and immediate paid member checkout. No Stripe network calls made.",
);
