export function paidSubscriptionState(sub) {
 const item=sub.items?.data?.[0];
 const periodEnd=item?.current_period_end ?? sub.current_period_end;
 const invoice=typeof sub.latest_invoice==='object'?sub.latest_invoice:null;
 const paidLines=invoice?.lines?.data?.filter(line=>(line.parent?.subscription_item_details?.subscription_item===item?.id || line.subscription_item===item?.id || line.parent?.subscription_item_details?.subscription===sub.id) && line.period?.end>0) || [];
 const invoiceEnd=paidLines.length?Math.max(...paidLines.map(l=>l.period.end)):null;
 return {price_id:item?.price?.id||null,current_period_end:periodEnd?new Date(periodEnd*1000).toISOString():null,paid_until:invoice?.status==='paid'&&invoice.amount_paid>0&&invoiceEnd&&periodEnd?new Date(Math.min(invoiceEnd,periodEnd)*1000).toISOString():null};
}
