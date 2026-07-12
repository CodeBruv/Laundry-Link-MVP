-- LaundryLink — Supabase schema with Row Level Security
-- Run this in the Supabase SQL editor for your project:
-- https://tjncjwlizakgzbbefile.supabase.co
--
-- ─────────────────────────────────────────────────────────────────────────────
-- HOW TO APPLY
-- ─────────────────────────────────────────────────────────────────────────────
-- Fresh database (no existing data):
--   Run this entire file top-to-bottom in the Supabase SQL editor.
--
-- Existing database (updating from previous schema):
--   1. Run the "── Migrations" section at the bottom of this file.
--   2. Then run only the missing INSERT / CREATE statements.
--
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Extensions ────────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists "pg_stat_statements";

-- ── Profiles ──────────────────────────────────────────────────────────────────
create table if not exists profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  full_name   text,
  role        text not null default 'CUSTOMER'
                check (role in ('CUSTOMER','BUSINESS','DISPATCHER','ADMIN')),
  phone       text,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "Users can read their own profile"
  on profiles for select using (auth.uid() = id);

create policy "Users can update their own profile"
  on profiles for update using (auth.uid() = id);

create policy "Admins can read all profiles"
  on profiles for select using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'ADMIN')
  );

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'CUSTOMER')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── Businesses ─────────────────────────────────────────────────────────────────
create table if not exists businesses (
  id                      text primary key,
  user_id                 uuid references auth.users(id),
  name                    text not null,
  address                 text,
  city                    text,
  state                   text,
  country                 text default 'Nigeria',
  email                   text,
  phone                   text,
  website                 text,
  description             text,
  logo_url                text,
  service_radius_km       int not null default 50,
  operating_hours         jsonb,
  is_verified             boolean not null default false,
  subscription_tier       text check (subscription_tier in ('STARTER','PRO','ENTERPRISE')),
  subscription_active     boolean not null default false,
  subscription_expires_at timestamptz,
  created_at              timestamptz not null default now()
);

alter table businesses enable row level security;

create policy "Anyone can read businesses"
  on businesses for select using (true);

create policy "Business owners can update their business"
  on businesses for update using (auth.uid() = user_id);

create policy "Admins can manage businesses"
  on businesses for all using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'ADMIN')
  );

-- ── Seed: PurePress Laundry ───────────────────────────────────────────────────
--
-- This is the canonical V1.0 business record.
-- user_id is NULL until the business owner account is created in Supabase Auth
-- and then linked via: UPDATE businesses SET user_id = '<owner-uuid>' WHERE id = 'purepress-jos';
--
-- Replace accountNumber in the operating_hours/payment block once confirmed.

insert into businesses (
  id, name, address, city, state, country,
  email, phone, website, description,
  service_radius_km, operating_hours, is_verified,
  subscription_tier, subscription_active
)
values (
  'purepress-jos',
  'PurePress Laundry',
  'Old Airport Road, Jos',
  'Jos',
  'Plateau State',
  'Nigeria',
  'support@purepresslaundry.com',
  '08024945119',
  'purepresslaundry.com',
  'Professional laundry and dry-cleaning services in Jos, Plateau State.',
  50,
  '{
    "timezone": "Africa/Lagos",
    "monday":    {"isOpen": true,  "open": "09:00", "close": "17:00"},
    "tuesday":   {"isOpen": true,  "open": "09:00", "close": "17:00"},
    "wednesday": {"isOpen": true,  "open": "09:00", "close": "17:00"},
    "thursday":  {"isOpen": true,  "open": "09:00", "close": "17:00"},
    "friday":    {"isOpen": true,  "open": "09:00", "close": "17:00"},
    "saturday":  {"isOpen": true,  "open": "09:00", "close": "17:00"},
    "sunday":    {"isOpen": false, "open": "09:00", "close": "17:00"}
  }'::jsonb,
  true,
  'ENTERPRISE',
  true
)
on conflict (id) do update set
  name = excluded.name,
  address = excluded.address,
  city = excluded.city,
  state = excluded.state,
  email = excluded.email,
  phone = excluded.phone,
  website = excluded.website,
  description = excluded.description,
  service_radius_km = excluded.service_radius_km,
  operating_hours = excluded.operating_hours,
  is_verified = excluded.is_verified;

-- ── Orders ─────────────────────────────────────────────────────────────────────
--
-- status CHECK constraint includes both legacy statuses (for backward compat)
-- and all PurePress production workflow statuses.
-- See: constants/orderStatuses.ts for the canonical status configuration.

create table if not exists orders (
  id                        uuid primary key default uuid_generate_v4(),
  order_number              text not null unique,
  customer_id               uuid not null references auth.users(id),
  customer_name             text not null,
  customer_email            text,
  business_id               text not null,
  business_name             text not null,
  assigned_driver_id        uuid,
  assigned_driver_name      text,
  status                    text not null default 'DRAFT'
                              check (status in (
                                -- Legacy (backward compat)
                                'PENDING','ACCEPTED','PICKED_UP','IN_PROGRESS',
                                'READY','PAID','OUT_FOR_DELIVERY',
                                -- Production workflow
                                'DRAFT','DEPOSIT_PAID',
                                'PICKUP_ASSIGNED','PICKUP_COMPLETED',
                                'RECEIVED_AT_LAUNDRY',
                                'SORTING','WASHING','DRYING','IRONING',
                                'QUALITY_CHECK','PACKAGING','SHELF_LOCATION',
                                'READY_FOR_DELIVERY','BALANCE_PAID',
                                'DELIVERY_ASSIGNED','DELIVERED','COMPLETED',
                                'CANCELLED'
                              )),
  items                     jsonb not null default '[]',
  total_amount              numeric(10,2) not null default 0,
  deposit_amount            numeric(10,2),
  balance_due               numeric(10,2),
  delivery_fee              numeric(10,2) not null default 1500,
  pickup_fee                numeric(10,2) not null default 600,
  surcharges                jsonb,
  pickup_address            text not null,
  delivery_address          text not null,
  shelf_location            text,
  special_requests          text,
  urgent                    boolean not null default false,
  driver_lat                double precision,
  driver_lng                double precision,
  is_driver_location_shared boolean not null default false,
  paystack_ref              text,
  deposit_ref               text,
  paid_at                   timestamptz,
  deposit_paid_at           timestamptz,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

create index if not exists orders_customer_id_idx on orders(customer_id);
create index if not exists orders_business_id_idx on orders(business_id);
create index if not exists orders_status_idx on orders(status);
create index if not exists orders_created_at_idx on orders(created_at desc);

alter table orders enable row level security;

create policy "Customers can read their own orders"
  on orders for select using (auth.uid() = customer_id);

create policy "Customers can create orders"
  on orders for insert with check (auth.uid() = customer_id);

-- Business role: sees all orders (RLS scoped to business_id via application logic)
create policy "Business users can read their business orders"
  on orders for select using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'BUSINESS')
  );

create policy "Business users can update order status"
  on orders for update using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'BUSINESS')
  );

create policy "Dispatchers can read assigned orders"
  on orders for select using (auth.uid() = assigned_driver_id);

create policy "Dispatchers can update their own orders"
  on orders for update using (auth.uid() = assigned_driver_id);

create policy "Admins have full access to orders"
  on orders for all using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'ADMIN')
  );

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists orders_updated_at on orders;
create trigger orders_updated_at
  before update on orders
  for each row execute procedure update_updated_at();

-- ── Order Status History ───────────────────────────────────────────────────────
create table if not exists order_status_history (
  id          uuid primary key default uuid_generate_v4(),
  order_id    uuid not null references orders(id) on delete cascade,
  status      text not null,
  changed_by  uuid references auth.users(id),
  note        text,
  created_at  timestamptz not null default now()
);

create index if not exists order_status_history_order_id_idx on order_status_history(order_id);

alter table order_status_history enable row level security;

create policy "Users can read history for their orders"
  on order_status_history for select using (
    exists (
      select 1 from orders o
      where o.id = order_status_history.order_id
        and (o.customer_id = auth.uid() or o.assigned_driver_id = auth.uid())
    )
  );

create policy "Business can read history for their orders"
  on order_status_history for select using (
    exists (
      select 1 from orders o
      where o.id = order_status_history.order_id
        and exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'BUSINESS')
    )
  );

create policy "Admins can read all history"
  on order_status_history for select using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'ADMIN')
  );

create policy "Authenticated users can insert history"
  on order_status_history for insert with check (auth.uid() is not null);

-- ── Push Tokens ────────────────────────────────────────────────────────────────
create table if not exists push_tokens (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  token       text not null,
  platform    text,
  created_at  timestamptz not null default now(),
  unique (user_id, token)
);

alter table push_tokens enable row level security;

create policy "Users manage their own push tokens"
  on push_tokens for all using (auth.uid() = user_id);

-- ── Realtime ───────────────────────────────────────────────────────────────────
-- Enable realtime for orders in Supabase Dashboard:
-- Database → Replication → enable for the `orders` table.
-- (Cannot be done via SQL in hosted Supabase.)

-- ─────────────────────────────────────────────────────────────────────────────
-- MIGRATIONS — run these if updating an existing database
-- ─────────────────────────────────────────────────────────────────────────────

-- M-001: Remove FK from orders.business_id (was referencing businesses.id)
-- Run if orders table was created with the old FK constraint:
--
--   alter table orders drop constraint if exists orders_business_id_fkey;
--
-- M-002: Extend orders.status check to include production statuses
-- Run if the orders table was created with the old 9-status constraint:
--
--   alter table orders drop constraint if exists orders_status_check;
--   alter table orders add constraint orders_status_check check (status in (
--     'PENDING','ACCEPTED','PICKED_UP','IN_PROGRESS',
--     'READY','PAID','OUT_FOR_DELIVERY',
--     'DRAFT','DEPOSIT_PAID',
--     'PICKUP_ASSIGNED','PICKUP_COMPLETED',
--     'RECEIVED_AT_LAUNDRY',
--     'SORTING','WASHING','DRYING','IRONING',
--     'QUALITY_CHECK','PACKAGING','SHELF_LOCATION',
--     'READY_FOR_DELIVERY','BALANCE_PAID',
--     'DELIVERY_ASSIGNED','DELIVERED','COMPLETED',
--     'CANCELLED'
--   ));
--
-- M-003: Add new columns to businesses table
-- Run if businesses table is missing the new columns:
--
--   alter table businesses add column if not exists city text;
--   alter table businesses add column if not exists state text;
--   alter table businesses add column if not exists country text default 'Nigeria';
--   alter table businesses add column if not exists email text;
--   alter table businesses add column if not exists website text;
--   alter table businesses add column if not exists service_radius_km int not null default 50;
--   alter table businesses add column if not exists operating_hours jsonb;
--
-- M-004: Add new columns to orders table
-- Run if orders table is missing the new columns:
--
--   alter table orders add column if not exists deposit_amount numeric(10,2);
--   alter table orders add column if not exists balance_due numeric(10,2);
--   alter table orders add column if not exists pickup_fee numeric(10,2) not null default 600;
--   alter table orders add column if not exists surcharges jsonb;
--   alter table orders add column if not exists shelf_location text;
--   alter table orders add column if not exists deposit_ref text;
--   alter table orders add column if not exists deposit_paid_at timestamptz;
--
-- M-005: Migrate legacy business seed
-- Run if you have the old 'cleanpro-abuja' seed and want to replace it:
--
--   delete from orders where business_id = 'cleanpro-abuja';
--   delete from businesses where id = 'cleanpro-abuja';
--   -- Then re-run the PurePress seed INSERT above.
