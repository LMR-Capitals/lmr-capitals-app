-- Pin search_path on the touch_updated_at trigger function added in
-- 20260922120000_design_v2_schema (Supabase advisor: function_search_path_mutable).
-- The function only sets new.updated_at and references no tables, so behavior is
-- unchanged; this just clears the advisory and matches the other pinned functions.
create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path to '' as $$
begin new.updated_at = now(); return new; end $$;
