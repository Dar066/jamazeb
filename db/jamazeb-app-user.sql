-- Step 2: a separate database login for the store, allowed to use ONLY the
-- jamazeb tables. Other data in this Supabase project (e.g. another app's
-- tables) stays out of the store's reach, even if its password ever leaked.
--
-- 1. Replace CHANGE-ME below with a long password: letters and numbers only
--    (no @ # / : ? symbols, they break the connection address).
-- 2. Run this in Supabase: SQL Editor -> New query -> paste -> Run.

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'jamazeb_app') then
    create role jamazeb_app login password 'CHANGE-ME';
  else
    alter role jamazeb_app with login password 'CHANGE-ME';
  end if;
end $$;

grant usage on schema jamazeb to jamazeb_app;
grant select, insert, update, delete on all tables in schema jamazeb to jamazeb_app;
alter default privileges in schema jamazeb grant select, insert, update, delete on tables to jamazeb_app;

-- Row level security is on for these tables; this login may use every row.
drop policy if exists jamazeb_app_orders on jamazeb.orders;
create policy jamazeb_app_orders on jamazeb.orders for all to jamazeb_app using (true) with check (true);
drop policy if exists jamazeb_app_returns on jamazeb.returns;
create policy jamazeb_app_returns on jamazeb.returns for all to jamazeb_app using (true) with check (true);
