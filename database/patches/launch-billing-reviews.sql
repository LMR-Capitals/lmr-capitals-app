-- Additive billing audit only. Existing member, Journal and payment rows are untouched.
begin;
create table if not exists public.circle_billing_reviews (
  stripe_event_id text primary key,
  event_type text not null check(event_type in ('charge.refunded','charge.dispute.created','radar.early_fraud_warning.created','checkout.session.async_payment_failed')),
  stripe_object_id text not null,
  stripe_charge_id text,
  stripe_customer_id text,
  stripe_subscription_id text,
  user_id uuid references auth.users(id) on delete set null,
  amount bigint,
  currency text,
  reason text not null,
  event_created timestamptz not null,
  received_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null
);
create index if not exists circle_billing_reviews_user_idx on public.circle_billing_reviews(user_id);
create index if not exists circle_billing_reviews_reviewer_idx on public.circle_billing_reviews(reviewed_by);
create index if not exists circle_billing_reviews_created_idx on public.circle_billing_reviews(event_created desc);
alter table public.circle_billing_reviews enable row level security;
revoke all on public.circle_billing_reviews from public,anon,authenticated;
grant select,insert on public.circle_billing_reviews to service_role;
-- Admin reads/acknowledgements must pass server-side registry + MFA verification.
create or replace function public.circle_admin_billing_reviews(search text default '')
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  if not public.circle_is_admin() then raise exception 'Administrator MFA required' using errcode='42501'; end if;
  return coalesce((select jsonb_agg(row_to_json(r)) from (
    select b.*,u.email from public.circle_billing_reviews b left join auth.users u on u.id=b.user_id
    where coalesce(u.email,'') ilike '%' || left(coalesce(search,''),200) || '%'
    order by b.event_created desc,b.stripe_event_id limit 100
  ) r),'[]'::jsonb);
end; $$;
create or replace function public.circle_admin_review_billing_event(event_id text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.circle_is_admin() then raise exception 'Administrator MFA required' using errcode='42501'; end if;
  update public.circle_billing_reviews set reviewed_at=now(),reviewed_by=auth.uid()
  where stripe_event_id=event_id and reviewed_at is null;
  if not found then raise exception 'Review item is absent or already reviewed'; end if;
end; $$;
revoke all on function public.circle_admin_billing_reviews(text),public.circle_admin_review_billing_event(text) from public,anon;
grant execute on function public.circle_admin_billing_reviews(text),public.circle_admin_review_billing_event(text) to authenticated;
commit;
