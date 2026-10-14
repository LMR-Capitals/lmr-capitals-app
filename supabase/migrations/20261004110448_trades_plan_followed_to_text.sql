alter table public.trades
  alter column plan_followed type text using plan_followed::text;
