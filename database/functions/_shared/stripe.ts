import Stripe from 'npm:stripe@22.4.0';
export const stripeClient = () => new Stripe((Deno.env.get('STRIPE_SECRET_KEY') || '').trim(),{apiVersion:'2026-07-29.dahlia',httpClient:Stripe.createFetchHttpClient()});
