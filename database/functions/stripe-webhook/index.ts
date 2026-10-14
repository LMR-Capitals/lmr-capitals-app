// Apply inner-circle.sql before deploying this function. Signature verification is mandatory.
import Stripe from "npm:stripe@17";
import { createClient } from "jsr:@supabase/supabase-js@2";
const clean = (s: string | undefined) => (s ?? "").trim();
const stripe = new Stripe(clean(Deno.env.get("STRIPE_SECRET_KEY")), {
  httpClient: Stripe.createFetchHttpClient(),
  apiVersion: "2024-12-18.acacia",
});
const cryptoProvider = Stripe.createSubtleCryptoProvider();
const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);
const id = (value: any) => (typeof value === "string" ? value : value?.id);
async function sync(
  subscriptionId: string,
  eventCreated: number,
  reference?: string | null,
) {
  // Re-read Stripe's current state rather than trust a possibly stale event payload.
  const sub = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ["latest_invoice"],
  });
  let userId = sub.metadata?.user_id || reference;
  if (!userId) {
    const { data, error } = await admin
      .from("subscriptions")
      .select("user_id")
      .eq("stripe_customer_id", id(sub.customer))
      .maybeSingle();
    if (error) throw error;
    userId = data?.user_id;
  }
  if (!userId) throw new Error("Subscription has no LMR member mapping");
  const { data: existing, error: readError } = await admin
    .from("subscriptions")
    .select("stripe_subscription_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (readError) throw readError;
  // Late cancellation of an older subscription must not revoke a newer subscription.
  if (
    existing?.stripe_subscription_id &&
    existing.stripe_subscription_id !== sub.id
  ) {
    const current = await stripe.subscriptions.retrieve(
      existing.stripe_subscription_id,
    );
    if (current.created > sub.created) return;
  }
  const invoice =
    typeof sub.latest_invoice === "object"
      ? (sub.latest_invoice as Stripe.Invoice)
      : null;
  const paidUntil =
    invoice?.status === "paid" &&
    invoice.amount_paid > 0 &&
    sub.current_period_end
      ? new Date(sub.current_period_end * 1000).toISOString()
      : null;
  const { error } = await admin.rpc("circle_sync_subscription", {
    payload: {
      user_id: userId,
      stripe_customer_id: id(sub.customer),
      stripe_subscription_id: sub.id,
      status: sub.status,
      price_id: sub.items.data[0]?.price.id || null,
      current_period_end: sub.current_period_end
        ? new Date(sub.current_period_end * 1000).toISOString()
        : null,
      cancel_at_period_end: sub.cancel_at_period_end,
      paid_until: paidUntil,
      stripe_event_created: eventCreated,
    },
  });
  if (error) throw error;
}
Deno.serve(async (req) => {
  if (req.method !== "POST")
    return new Response("Method not allowed", { status: 405 });
  const signature = req.headers.get("stripe-signature");
  if (!signature) return new Response("Missing signature", { status: 400 });
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      await req.text(),
      signature,
      clean(Deno.env.get("STRIPE_WEBHOOK_SECRET")),
      undefined,
      cryptoProvider,
    );
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }
  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode === "subscription" && session.subscription)
        await sync(
          id(session.subscription),
          event.created,
          session.client_reference_id,
        );
    } else if (
      [
        "customer.subscription.created",
        "customer.subscription.updated",
        "customer.subscription.deleted",
      ].includes(event.type)
    ) {
      await sync((event.data.object as Stripe.Subscription).id, event.created);
    } else if (
      ["invoice.paid", "invoice.payment_failed"].includes(event.type)
    ) {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId =
        id(invoice.subscription) ||
        id((invoice as any).parent?.subscription_details?.subscription);
      if (subscriptionId) await sync(subscriptionId, event.created);
    }
    return new Response("ok", { status: 200 });
  } catch (e) {
    console.error(
      "[stripe-webhook] failed to sync verified event",
      event.id,
      (e as Error).message,
    );
    return new Response("Subscription update failed; retry required", {
      status: 500,
    });
  }
});
