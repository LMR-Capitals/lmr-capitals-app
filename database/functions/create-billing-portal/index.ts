import {
  authenticate,
  callerOrigin,
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
    const input = await req.json().catch(() => ({}));
    const { data, error } = await service()
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (error) throw new Error("Could not read your billing account.");
    if (!data?.stripe_customer_id)
      return json(
        { error: "No Stripe billing account was found for this member." },
        404,
      );
    const session = await stripePost("/billing_portal/sessions", {
      customer: data.stripe_customer_id,
      return_url:
        input.return_surface === "members"
          ? `${origin}/member/index.html#billing`
          : `${origin}/app/app.html`,
    });
    return json({ url: session.url });
  } catch (e) {
    const message = (e as Error).message;
    return json({ error: message }, message === "unauthorized" ? 401 : 400);
  }
});
