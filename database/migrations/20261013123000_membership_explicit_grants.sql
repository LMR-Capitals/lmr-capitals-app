begin;
-- Supabase project defaults can grant more than SELECT to newly created tables.
-- Revoke all client privileges, including TRUNCATE, then allow only the intended reads.
revoke all on public.circle_legal_documents,public.circle_membership_plans,public.circle_membership_launch,public.circle_agreement_acceptances,public.circle_checkout_receipts from anon,authenticated;
grant select on public.circle_legal_documents,public.circle_membership_plans,public.circle_membership_launch to anon,authenticated;
grant select on public.circle_agreement_acceptances,public.circle_checkout_receipts to authenticated;
commit;
