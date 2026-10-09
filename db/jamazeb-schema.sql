-- Jamazeb database setup. Run once in Supabase: SQL Editor -> New query -> paste -> Run.
-- Everything lives in its own "jamazeb" schema, so it never touches other tables
-- in the same project. Safe to run again: it only creates what is missing.

create schema if not exists jamazeb;

-- Orders. The full order is kept in "data"; the other columns are copies used for searching.
create table if not exists jamazeb.orders (
  id          text primary key,
  created_at  timestamptz not null,
  updated_at  timestamptz not null default now(),
  status      text not null,
  payment     text not null,
  phone       text not null,
  sample      boolean not null default false,
  data        jsonb not null
);
create index if not exists orders_phone_idx on jamazeb.orders (phone);
create index if not exists orders_created_idx on jamazeb.orders (created_at desc);

-- Exchange and refund requests.
create table if not exists jamazeb.returns (
  id          text primary key,
  order_id    text not null references jamazeb.orders (id) on delete cascade,
  created_at  timestamptz not null,
  updated_at  timestamptz not null default now(),
  status      text not null,
  sample      boolean not null default false,
  data        jsonb not null
);
create index if not exists returns_order_idx on jamazeb.returns (order_id);

-- Lock the schema away from Supabase's public API keys (anon / authenticated).
-- The store reaches these tables only from its own server, with the database password.
alter table jamazeb.orders enable row level security;
alter table jamazeb.returns enable row level security;

do $$
declare r text;
begin
  foreach r in array array['anon', 'authenticated'] loop
    if exists (select 1 from pg_roles where rolname = r) then
      execute format('revoke all on schema jamazeb from %I', r);
      execute format('revoke all on all tables in schema jamazeb from %I', r);
    end if;
  end loop;
end $$;
