-- Fix trade sync failure: trades.plan_followed must be text, not boolean.
-- The app stores the "Plan followed?" field as a string ("Followed" / "Unfollowed" / ""),
-- but the column was boolean, so pushing a trade failed with
--   invalid input syntax for type boolean: "Followed"
-- blocking all trade sync. All existing rows are null, so the cast is a no-op.
alter table public.trades
  alter column plan_followed type text using plan_followed::text;
