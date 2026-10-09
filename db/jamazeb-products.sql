-- Step 3 (Phase 6B): the product catalogue in the database.
-- Run once in Supabase: SQL Editor -> New query -> paste -> Run. Safe to run again.
-- The store fills this table with its built-in catalogue the first time it starts;
-- after that, products are managed in the admin dashboard.

create table if not exists jamazeb.products (
  slug        text primary key,
  status      text not null default 'active' check (status in ('active', 'draft')),
  stock       integer not null default 0 check (stock >= 0),
  updated_at  timestamptz not null default now(),
  -- Everything else about the product (name, prices, colours, sizes, description...).
  data        jsonb not null
);

alter table jamazeb.products enable row level security;

-- Same lock-down as the other tables: no access for Supabase's public API keys...
do $$
declare r text;
begin
  foreach r in array array['anon', 'authenticated'] loop
    if exists (select 1 from pg_roles where rolname = r) then
      execute format('revoke all on jamazeb.products from %I', r);
    end if;
  end loop;
end $$;

-- ...and full use for the store's own login (created in jamazeb-app-user.sql).
grant select, insert, update, delete on jamazeb.products to jamazeb_app;
drop policy if exists jamazeb_app_products on jamazeb.products;
create policy jamazeb_app_products on jamazeb.products for all to jamazeb_app using (true) with check (true);
