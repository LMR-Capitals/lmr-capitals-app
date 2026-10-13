import {authenticate,callerOrigin,cors,json,service} from '../_shared/billing.ts';
import {stripeClient} from '../_shared/stripe.ts';
Deno.serve(async req=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers:cors});
 if(req.method!=='POST')return json({error:'Method not allowed'},405);
 try{
  const user=await authenticate(req),origin=callerOrigin(req),admin=service();
  const {data,error}=await admin.from('subscriptions').select('stripe_customer_id').eq('user_id',user.id).maybeSingle();
  if(error||!data?.stripe_customer_id)return json({error:'No Stripe billing account found.'},404);
  const {data:launch}=await admin.from('circle_membership_launch').select('portal_configuration').eq('id',true).single();
  if(!launch?.portal_configuration)return json({error:'Billing controls are not configured yet. Contact admin@lmrcapitals.com.'},409);
  const session=await stripeClient().billingPortal.sessions.create({customer:data.stripe_customer_id,configuration:launch.portal_configuration,return_url:`${origin}/inner-circle#billing`});
  return json({url:session.url});
 }catch(error){return json({error:error.message==='unauthorized'?'Sign in to continue.':'Could not open billing. Please contact support.'},error.message==='unauthorized'?401:400);}
});
