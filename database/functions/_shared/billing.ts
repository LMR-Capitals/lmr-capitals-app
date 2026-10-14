import { createClient } from "jsr:@supabase/supabase-js@2";
export const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
export const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
export const clean = (s: string | undefined) => (s ?? "").trim();
export function siteOrigin() {
  // Confirmed production domain from the existing Netlify project and deployment memory.
  const value = clean(Deno.env.get("APP_URL")) || "https://lmrcapitals.com";
  const url = new URL(value);
  if (
    url.protocol !== "https:" &&
    !(
      url.protocol === "http:" &&
      ["localhost", "127.0.0.1"].includes(url.hostname)
    )
  )
    throw new Error("APP_URL must use HTTPS");
  return url.origin;
}
export function callerOrigin(req: Request) {
  const configured = siteOrigin();
  const origin = req.headers.get("Origin");
  const allowed = (Deno.env.get("ALLOWED_APP_ORIGINS") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (origin && origin !== configured && !allowed.includes(origin))
    throw new Error("This application origin is not allowed");
  return origin || configured;
}
export async function authenticate(req: Request) {
  const header = req.headers.get("Authorization");
  if (!header) throw new Error("unauthorized");
  const sb = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: header } } },
  );
  const {
    data: { user },
    error,
  } = await sb.auth.getUser();
  if (error || !user) throw new Error("unauthorized");
  return user;
}
export function service() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}
export async function stripePost(
  path: string,
  params: Record<string, string>,
  idempotency?: string,
) {
  const key = clean(Deno.env.get("STRIPE_SECRET_KEY"));
  if (!key) throw new Error("Stripe is not configured");
  const headers: Record<string, string> = {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/x-www-form-urlencoded",
  };
  if (idempotency) headers["Idempotency-Key"] = idempotency;
  const response = await fetch(`https://api.stripe.com/v1${path}`, {
    method: "POST",
    headers,
    body: new URLSearchParams(params),
  });
  const data = await response.json();
  if (!response.ok) {
    console.error(
      "Stripe request failed",
      path,
      response.status,
      data.error?.code,
    );
    throw new Error(
      "Stripe could not complete this request. Please try again or contact LMR.",
    );
  }
  return data;
}
