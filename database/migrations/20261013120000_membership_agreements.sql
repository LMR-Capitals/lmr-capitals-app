begin;
-- New, append-only agreement records. Existing billing and Journal data are unchanged.
create table public.circle_legal_documents (
 version text primary key,
 documents jsonb not null check(jsonb_typeof(documents)='object'),
 content_hash text not null,
 published_at timestamptz not null default now()
);
create function public.circle_document_fingerprint() returns trigger language plpgsql set search_path='' as $$begin new.content_hash:=encode(sha256(convert_to(new.documents::text,'UTF8')),'hex');return new;end$$;
create trigger circle_document_hash before insert on public.circle_legal_documents for each row execute function public.circle_document_fingerprint();
create table public.circle_membership_plans (
 plan text primary key check(plan in ('weekly','monthly','quarterly','yearly')),
 amount integer not null check(amount>0),currency text not null check(currency='usd'),
 billing_interval text not null check(billing_interval in ('week','month','year')),
 interval_count integer not null check(interval_count>0),
 stripe_price_id text unique check(stripe_price_id ~ '^price_[A-Za-z0-9]+$'),
 enabled boolean not null default false
);
create table public.circle_membership_launch (
 id boolean primary key default true check(id),
 legal_version text references public.circle_legal_documents(version),
 enrollment_enabled boolean not null default false,
 tax_enabled boolean not null default false,
 portal_configuration text
);
insert into public.circle_membership_launch(id) values(true);
insert into public.circle_membership_plans(plan,amount,currency,billing_interval,interval_count) values
 ('weekly',2800,'usd','week',1),('monthly',11284,'usd','month',1),('quarterly',32760,'usd','month',3),('yearly',116480,'usd','year',1);
create table public.circle_agreement_acceptances (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id),
 legal_version text not null references public.circle_legal_documents(version),
 content_hash text not null,
 accepted_at timestamptz not null default now(),
 scope text not null check(scope in ('account','membership')),
 plan text references public.circle_membership_plans(plan),
 amount integer,currency text,billing_interval text,interval_count integer,
 documents jsonb not null,
 acknowledgement jsonb not null,
 check((scope='account' and plan is null) or (scope='membership' and plan is not null))
);
create function public.circle_immutable_agreement() returns trigger language plpgsql set search_path='' as $$begin raise exception 'Agreement history is immutable'; end$$;
create table public.circle_checkout_receipts (
 stripe_session_id text primary key,agreement_id uuid not null references public.circle_agreement_acceptances(id),
 user_id uuid not null references auth.users(id),stripe_subscription_id text,terms_accepted boolean not null,
 recorded_at timestamptz not null default now(),amount_total integer,currency text
);
alter table public.circle_checkout_receipts enable row level security;
create policy checkout_receipt_owner_admin_read on public.circle_checkout_receipts for select to authenticated using(user_id=(select auth.uid()) or public.circle_is_admin());
grant select on public.circle_checkout_receipts to authenticated;
revoke insert,update,delete on public.circle_checkout_receipts from anon,authenticated;
grant select,insert on public.circle_checkout_receipts to service_role;
create trigger circle_checkout_no_rewrite before update or delete on public.circle_checkout_receipts for each row execute function public.circle_immutable_agreement();
create index circle_agreement_user_history on public.circle_agreement_acceptances(user_id,accepted_at desc);
alter table public.circle_legal_documents enable row level security;
alter table public.circle_membership_plans enable row level security;
alter table public.circle_membership_launch enable row level security;
alter table public.circle_agreement_acceptances enable row level security;
create policy legal_public_read on public.circle_legal_documents for select to anon,authenticated using(true);
create policy plans_public_read on public.circle_membership_plans for select to anon,authenticated using(true);
create policy launch_public_read on public.circle_membership_launch for select to anon,authenticated using(true);
create policy agreements_owner_admin_read on public.circle_agreement_acceptances for select to authenticated using(user_id=(select auth.uid()) or public.circle_is_admin());
grant select on public.circle_legal_documents,public.circle_membership_plans,public.circle_membership_launch to anon,authenticated;
grant select on public.circle_agreement_acceptances to authenticated;
revoke insert,update,delete on public.circle_legal_documents,public.circle_membership_plans,public.circle_membership_launch,public.circle_agreement_acceptances from anon,authenticated;
create trigger circle_agreement_no_rewrite before update or delete on public.circle_agreement_acceptances for each row execute function public.circle_immutable_agreement();
create trigger circle_document_no_rewrite before update or delete on public.circle_legal_documents for each row execute function public.circle_immutable_agreement();
create function public.circle_accept_agreement(p_version text,p_acknowledgement jsonb,p_plan text default null)
returns uuid language plpgsql security definer set search_path='' as $$
declare current_version text; doc public.circle_legal_documents; selected public.circle_membership_plans; accepted uuid;
begin
 if auth.uid() is null then raise exception 'Sign in required' using errcode='42501';end if;
 select legal_version into current_version from public.circle_membership_launch where id=true;
 if current_version is null or p_version is distinct from current_version then raise exception 'Review the current agreement version';end if;
 if coalesce(p_acknowledgement->>'terms','')<>'true' or coalesce(p_acknowledgement->>'privacy','')<>'true' or coalesce(p_acknowledgement->>'risk','')<>'true' or coalesce(p_acknowledgement->>'adult','')<>'true' then raise exception 'All acknowledgements are required';end if;
 select * into strict doc from public.circle_legal_documents where version=current_version;
 if p_plan is not null then
  if coalesce(p_acknowledgement->>'renewal','')<>'true' then raise exception 'Recurring billing acknowledgement required';end if;
  select * into selected from public.circle_membership_plans where plan=p_plan and enabled;
  if not found then raise exception 'Plan unavailable';end if;
 end if;
 -- Serialize retries and reuse a still-current acceptance for the same checkout.
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
 select id into accepted from public.circle_agreement_acceptances where user_id=auth.uid() and legal_version=current_version and plan is not distinct from p_plan and amount is not distinct from selected.amount and accepted_at>now()-interval '24 hours' order by accepted_at desc limit 1;
 if accepted is not null then return accepted;end if;
 insert into public.circle_agreement_acceptances(user_id,legal_version,content_hash,scope,plan,amount,currency,billing_interval,interval_count,documents,acknowledgement)
 values(auth.uid(),current_version,doc.content_hash,case when p_plan is null then 'account' else 'membership' end,p_plan,selected.amount,selected.currency,selected.billing_interval,selected.interval_count,doc.documents,jsonb_build_object('terms',true,'privacy',true,'risk',true,'adult',true,'renewal',p_plan is not null)) returning id into accepted;
 return accepted;
end$$;
revoke all on function public.circle_accept_agreement(text,jsonb,text) from public,anon;
grant execute on function public.circle_accept_agreement(text,jsonb,text) to authenticated;
create function public.circle_admin_agreements(p_user_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if not public.circle_is_admin() then raise exception 'Verified administrator required' using errcode='42501';end if;
 return (select coalesce(jsonb_agg(to_jsonb(a)||jsonb_build_object('checkout_receipts',(select coalesce(jsonb_agg(to_jsonb(c)),'[]'::jsonb) from public.circle_checkout_receipts c where c.agreement_id=a.id)) order by a.accepted_at desc),'[]'::jsonb) from public.circle_agreement_acceptances a where a.user_id=p_user_id);
end$$;
revoke all on function public.circle_admin_agreements(uuid) from public,anon;
grant execute on function public.circle_admin_agreements(uuid) to authenticated;
grant all on public.circle_legal_documents,public.circle_membership_plans,public.circle_membership_launch to service_role;
grant select,insert on public.circle_agreement_acceptances to service_role;
create function public.circle_admin_membership_subscribers(search text default '') returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if not public.circle_is_admin() then raise exception 'Verified administrator required' using errcode='42501';end if;
 return (select coalesce(jsonb_agg(to_jsonb(r) order by r.updated_at desc),'[]'::jsonb) from (
 select s.*,u.email::text,coalesce(initcap(p.plan)||' · USD',case when s.price_id='price_1UEPLOBgi40jMsdm6LlsT3Hr' then 'Yearly · AUD' when s.price_id in ('price_1UEPM2Bgi40jMsdmzaWUy7Vg','price_1UEPLOBgi40jMsdmomaasesX') then 'Monthly · AUD' else 'Unmapped billing plan' end) as plan
 from public.subscriptions s join auth.users u on u.id=s.user_id left join public.circle_membership_plans p on p.stripe_price_id=s.price_id
 where search='' or u.email ilike '%'||search||'%' order by s.updated_at desc limit 200) r);
end$$;
create function public.circle_admin_membership_revenue() returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if not public.circle_is_admin() then raise exception 'Verified administrator required' using errcode='42501';end if;
 return (select coalesce(jsonb_agg(to_jsonb(r)),'[]'::jsonb) from (
 select currency,round(sum(mrr)) as mrr_cents from (
 select p.currency,case p.billing_interval when 'week' then p.amount*52.0/12/p.interval_count when 'month' then p.amount::numeric/p.interval_count when 'year' then p.amount::numeric/12/p.interval_count end as mrr
 from public.subscriptions s join public.circle_membership_plans p on p.stripe_price_id=s.price_id where s.status='active'
 union all select 'aud',case when s.price_id='price_1UEPLOBgi40jMsdm6LlsT3Hr' then 2250 else 2500 end from public.subscriptions s where s.status='active' and s.price_id in ('price_1UEPLOBgi40jMsdm6LlsT3Hr','price_1UEPM2Bgi40jMsdmzaWUy7Vg','price_1UEPLOBgi40jMsdmomaasesX')
 ) amounts group by currency) r);
end$$;
revoke all on function public.circle_admin_membership_subscribers(text),public.circle_admin_membership_revenue() from public,anon;
grant execute on function public.circle_admin_membership_subscribers(text),public.circle_admin_membership_revenue() to authenticated;
-- A new customer mapping has no Stripe event timestamp yet. Accept its first verified event.
create or replace function public.circle_sync_subscription(payload jsonb) returns void language plpgsql set search_path='' as $$
begin
 insert into public.subscriptions(user_id,stripe_customer_id,stripe_subscription_id,status,price_id,current_period_end,cancel_at_period_end,paid_until,stripe_event_created,updated_at)
 values((payload->>'user_id')::uuid,payload->>'stripe_customer_id',payload->>'stripe_subscription_id',payload->>'status',payload->>'price_id',(payload->>'current_period_end')::timestamptz,coalesce((payload->>'cancel_at_period_end')::boolean,false),(payload->>'paid_until')::timestamptz,(payload->>'stripe_event_created')::bigint,now())
 on conflict(user_id) do update set stripe_customer_id=excluded.stripe_customer_id,stripe_subscription_id=excluded.stripe_subscription_id,status=excluded.status,price_id=excluded.price_id,current_period_end=excluded.current_period_end,cancel_at_period_end=excluded.cancel_at_period_end,paid_until=case when excluded.stripe_subscription_id=public.subscriptions.stripe_subscription_id then greatest(excluded.paid_until,public.subscriptions.paid_until) else excluded.paid_until end,stripe_event_created=excluded.stripe_event_created,updated_at=now()
 where excluded.stripe_event_created>=coalesce(public.subscriptions.stripe_event_created,0);
end$$;
revoke all on function public.circle_sync_subscription(jsonb) from public,anon,authenticated;
grant execute on function public.circle_sync_subscription(jsonb) to service_role;
commit;
