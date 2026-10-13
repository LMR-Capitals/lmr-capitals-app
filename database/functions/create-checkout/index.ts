import {authenticate,callerOrigin,cors,json,service} from '../_shared/billing.ts';
import {stripeClient} from '../_shared/stripe.ts';
import {membershipCheckout} from '../_shared/membership-checkout.mjs';
Deno.serve(async req=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers:cors});
 if(req.method!=='POST')return json({error:'Method not allowed'},405);
 try{
  const user=await authenticate(req),origin=callerOrigin(req),input=await req.json();
  return json(await membershipCheckout({user,input,origin,admin:service(),stripe:stripeClient()}));
 }catch(error){return json({error:error.message==='unauthorized'?'Sign in to continue.':error.message},error.message==='unauthorized'?401:400);}
});
