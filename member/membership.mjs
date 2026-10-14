export const membershipVersion='2026-10-13-v1';
export const membershipPlans=[
 {id:'weekly',title:'Weekly',amount:2800,currency:'usd',interval:'week',interval_count:1,discount:0},
 {id:'monthly',title:'Monthly',amount:11284,currency:'usd',interval:'month',interval_count:1,discount:7},
 {id:'quarterly',title:'Quarterly',amount:32760,currency:'usd',interval:'month',interval_count:3,discount:10},
 {id:'yearly',title:'Yearly',amount:116480,currency:'usd',interval:'year',interval_count:1,discount:20},
];
export const membershipPrice=plan=>new Intl.NumberFormat('en-US',{style:'currency',currency:plan.currency}).format(plan.amount/100);
export const membershipInterval=plan=>({weekly:'week',monthly:'month',quarterly:'3 months',yearly:'year'}[plan.id]);
export const membershipTaxNotice='Prices are in USD. No GST is currently charged. Any future legally applicable tax will be disclosed before you agree to a charge.';
