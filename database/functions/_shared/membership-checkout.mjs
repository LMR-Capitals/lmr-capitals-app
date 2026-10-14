export async function membershipCheckout({user,input,origin,admin,stripe,now=new Date()}) {
 if(!['weekly','monthly','quarterly','yearly'].includes(input?.plan))throw new Error('Choose a valid membership interval.');
 const {data:launch,error:launchError}=await admin.from('circle_membership_launch').select('*').eq('id',true).single();
 if(launchError||!launch?.enrollment_enabled||!launch.legal_version)throw new Error('Membership enrollment is not open yet.');
 const {data:plan,error:planError}=await admin.from('circle_membership_plans').select('*').eq('plan',input.plan).single();
 if(planError||!plan?.enabled||!plan.stripe_price_id)throw new Error('This membership interval is not available.');
 const {data:consent,error:consentError}=await admin.from('circle_agreement_acceptances').select('*').eq('id',input.agreement_id).eq('user_id',user.id).single();
 if(consentError||!consent||consent.scope!=='membership'||consent.plan!==plan.plan||consent.legal_version!==launch.legal_version||consent.amount!==plan.amount||consent.currency!==plan.currency||consent.billing_interval!==plan.billing_interval||consent.interval_count!==plan.interval_count||!['terms','privacy','risk','adult','renewal'].every(key=>consent.acknowledgement?.[key]===true))throw new Error('Accept the current membership agreement before checkout.');
 const {data:existing,error:subscriptionError}=await admin.from('subscriptions').select('*').eq('user_id',user.id).maybeSingle();
 if(subscriptionError)throw new Error('Could not verify existing membership.');
 if(existing?.stripe_subscription_id&&['active','trialing','past_due','unpaid','incomplete','paused'].includes(existing.status))throw new Error('Manage your existing subscription instead of creating another.');
 const price=await stripe.prices.retrieve(plan.stripe_price_id);
 if(!price.active||price.type!=='recurring'||price.unit_amount!==plan.amount||price.currency!==plan.currency||price.tax_behavior!=='exclusive'||price.recurring?.interval!==plan.billing_interval||price.recurring?.interval_count!==plan.interval_count)throw new Error('The configured Stripe price does not match this membership.');
 let customer=existing?.stripe_customer_id;
 if(!customer){const created=await stripe.customers.create({email:user.email,metadata:{user_id:user.id}},{idempotencyKey:`lmr-customer-${user.id}`});customer=created.id;}
 const {error:mappingError}=await admin.from('subscriptions').upsert({user_id:user.id,stripe_customer_id:customer},{onConflict:'user_id'});
 if(mappingError)throw new Error('Could not save your billing account.');
 const termsUrl=`${origin}/inner-circle/guide#terms`;
 const params={mode:'subscription',customer,client_reference_id:user.id,line_items:[{price:plan.stripe_price_id,quantity:1}],
  subscription_data:{metadata:{user_id:user.id,legal_version:consent.legal_version,agreement_id:consent.id},billing_mode:{type:'flexible'}},
  metadata:{user_id:user.id,legal_version:consent.legal_version,agreement_id:consent.id,agreement_hash:consent.content_hash,agreement_accepted_at:consent.accepted_at},
  custom_text:{submit:{message:`Your LMR membership renews until cancelled. [Membership terms](${termsUrl}) were accepted in LMR before checkout.`}},
  customer_update:{address:'auto'},billing_address_collection:'required',automatic_tax:{enabled:launch.tax_enabled===true},
  managed_payments:{enabled:false},success_url:`${origin}/inner-circle?checkout=success#billing`,cancel_url:`${origin}/inner-circle?checkout=cancel#billing`,
  integration_identifier:'lmr_membership_osptvrax'};
 const session=await stripe.checkout.sessions.create(params,{idempotencyKey:`lmr-membership-${user.id}-${consent.id}-v1`});
 return {url:session.url};
}
