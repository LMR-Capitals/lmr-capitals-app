// Apply inner-circle.sql before deploying this function. Signature verification is mandatory.
import Stripe from "npm:stripe@22.4.0";
import { paidSubscriptionState } from "../_shared/subscription-state.mjs";
import { stripeClient } from "../_shared/stripe.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
const clean = (s: string | undefined) => (s ?? "").trim();
const stripe = stripeClient();
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
  if(sub.metadata?.agreement_id){
    const {data:acceptance,error}=await admin.from('circle_agreement_acceptances').select('user_id,legal_version').eq('id',sub.metadata.agreement_id).single();
    if(error||!acceptance||acceptance.user_id!==userId||acceptance.legal_version!==sub.metadata.legal_version)throw new Error('Subscription agreement mapping mismatch');
  }
  const state = paidSubscriptionState(sub);
  const { error } = await admin.rpc("circle_sync_subscription", {
    payload: {
      user_id: userId,
      stripe_customer_id: id(sub.customer),
      stripe_subscription_id: sub.id,
      status: sub.status,
      ...state,
      cancel_at_period_end: sub.cancel_at_period_end,
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
      if(session.metadata?.agreement_id){
        const {data:acceptance,error}=await admin.from('circle_agreement_acceptances').select('user_id,legal_version,content_hash,acknowledgement').eq('id',session.metadata.agreement_id).single();
        if(error||!acceptance||acceptance.user_id!==session.client_reference_id||acceptance.legal_version!==session.metadata.legal_version||acceptance.content_hash!==session.metadata.agreement_hash||acceptance.acknowledgement?.terms!==true)throw new Error('Checkout agreement verification failed');
        const {error:receiptError}=await admin.from('circle_checkout_receipts').upsert({stripe_session_id:session.id,agreement_id:session.metadata.agreement_id,user_id:acceptance.user_id,stripe_subscription_id:id(session.subscription),terms_accepted:true,acceptance_source:'lmr_before_checkout',amount_total:session.amount_total,currency:session.currency},{onConflict:'stripe_session_id',ignoreDuplicates:true});
        if(receiptError)throw receiptError;
      }
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
        id((invoice as any).subscription) ||
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
