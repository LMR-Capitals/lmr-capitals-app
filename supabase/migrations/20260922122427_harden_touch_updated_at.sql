-- Pin search_path on the touch_updated_at trigger function (advisor: mutable
-- search_path). Behavior unchanged.
create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path to '' as $$
begin new.updated_at = now(); return new; end $$;
