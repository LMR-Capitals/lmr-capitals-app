// Reuses LMR's configured Stripe products. Only a verified webhook grants access.
import {
  authenticate,
  callerOrigin,
  clean,
  cors,
  json,
  service,
  stripePost,
} from "../_shared/billing.ts";
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    const user = await authenticate(req),
      origin = callerOrigin(req);
    const input = await req.json();
    const plan = input.plan;
    if (!["monthly", "yearly"].includes(plan))
      return json({ error: "Choose a monthly or yearly plan" }, 400);
    const member = input.return_surface === "members";
    if (
      Deno.env.get("MEMBER_LEGAL_APPROVED") !== "true" ||
      !Deno.env.get("MEMBER_LEGAL_VERSION") ||
      input.legal_version !== Deno.env.get("MEMBER_LEGAL_VERSION")
    )
      return json(
        { error: "Member enrollment is awaiting final policy publication." },
        409,
      );
    // Fail closed on missing prices rather than silently substituting live prices.
    const price = clean(
      Deno.env.get(
        plan === "yearly" ? "STRIPE_PRICE_YEARLY" : "STRIPE_PRICE_MONTHLY",
      ),
    );
    if (!/^price_[A-Za-z0-9]+$/.test(price))
      return json(
        { error: "This membership plan is not configured yet." },
        503,
      );
    const admin = service();
    const { data: existing, error } = await admin
      .from("subscriptions")
      .select("stripe_customer_id,stripe_subscription_id,status")
      .eq("user_id", user.id)
      .maybeSingle();
    if (error) throw new Error("Could not verify existing subscription.");
    if (
      existing &&
      [
        "active",
        "trialing",
        "past_due",
        "unpaid",
        "incomplete",
        "paused",
      ].includes(existing.status)
    )
      return json(
        {
          error:
            "You already have a subscription. Manage it in the billing portal.",
        },
        409,
      );
    const customerId =
      existing?.stripe_customer_id ||
      (
        await stripePost(
          "/customers",
          { email: user.email || "", "metadata[user_id]": user.id },
          `lmr-customer-${user.id}`,
        )
      ).id;
    // Persist the mapping before redirecting. A customer id never grants access.
    const { error: mapError } = await admin
      .from("subscriptions")
      .upsert(
        { user_id: user.id, stripe_customer_id: customerId },
        { onConflict: "user_id" },
      );
    if (mapError) throw new Error("Could not save the billing account.");
    const base = member
      ? `${origin}/member/index.html`
      : `${origin}/app/app.html`;
    const params: Record<string, string> = {
      mode: "subscription",
      customer: customerId,
      client_reference_id: user.id,
      "line_items[0][price]": price,
      "line_items[0][quantity]": "1",
      "subscription_data[metadata][user_id]": user.id,
      allow_promotion_codes: "true",
      success_url: `${base}?checkout=success${member ? "#billing" : ""}`,
      cancel_url: `${base}?checkout=cancel${member ? "#billing" : ""}`,
      "managed_payments[enabled]": "false",
    };
    // Free accounts learn without checkout. Premium access begins after payment.
    const window = Math.floor(Date.now() / 600000);
    {
      params["metadata[legal_version]"] = input.legal_version;
      params["metadata[legal_accepted_at]"] = new Date(
        window * 600000,
      ).toISOString();
      params["subscription_data[metadata][legal_version]"] =
        input.legal_version;
    }
    // Stable within a short checkout window to prevent duplicate clicks creating sessions.
    const session = await stripePost(
      "/checkout/sessions",
      params,
      `lmr-checkout-${user.id}-${plan}-${member ? "members" : "app"}-${window}`,
    );
    return json({ url: session.url });
  } catch (e) {
    const message = (e as Error).message;
    console.error("[create-checkout]", message);
    return json({ error: message }, message === "unauthorized" ? 401 : 400);
  }
});
