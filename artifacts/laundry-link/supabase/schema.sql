-- LaundryLink — Supabase schema with Row Level Security
-- Run this in the Supabase SQL editor for your project:
-- https://tjncjwlizakgzbbefile.supabase.co

-- ── Extensions ───────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists "pg_stat_statements";

-- ── Profiles ─────────────────────────────────────────────────────────────────
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

-- ── Businesses ────────────────────────────────────────────────────────────────
create table if not exists businesses (
  id                  text primary key default 'cleanpro-abuja',
  user_id             uuid references auth.users(id),
  name                text not null,
  address             text,
  phone               text,
  description         text,
  logo_url            text,
  is_verified         boolean not null default false,
  subscription_tier   text check (subscription_tier in ('STARTER','PRO','ENTERPRISE')),
  subscription_active boolean not null default false,
  subscription_expires_at timestamptz,
  created_at          timestamptz not null default now()
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

-- Seed default business
insert into businesses (id, name, address, phone, description, is_verified)
values (
  'cleanpro-abuja',
  'CleanPro Laundry Abuja',
  'Plot 12, Wuse Zone 4, Abuja, FCT',
  '+234 800 000 0001',
  'Professional laundry services in Abuja.',
  true
) on conflict (id) do nothing;

-- ── Orders ────────────────────────────────────────────────────────────────────
create table if not exists orders (
  id                       uuid primary key default uuid_generate_v4(),
  order_number             text not null unique,
  customer_id              uuid not null references auth.users(id),
  customer_name            text not null,
  customer_email           text,
  business_id              text not null,
  business_name            text not null,
  assigned_driver_id       uuid,
  assigned_driver_name     text,
  status                   text not null default 'PENDING'
                             check (status in ('PENDING','ACCEPTED','PICKED_UP','IN_PROGRESS',
                                               'READY','PAID','OUT_FOR_DELIVERY','DELIVERED','CANCELLED')),
  items                    jsonb not null default '[]',
  total_amount             numeric(10,2) not null default 0,
  delivery_fee             numeric(10,2) not null default 1500,
  pickup_address           text not null,
  delivery_address         text not null,
  special_requests         text,
  urgent                   boolean not null default false,
  driver_lat               double precision,
  driver_lng               double precision,
  is_driver_location_shared boolean not null default false,
  paystack_ref             text,
  paid_at                  timestamptz,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create index if not exists orders_customer_id_idx on orders(customer_id);
create index if not exists orders_business_id_idx on orders(business_id);
create index if not exists orders_status_idx on orders(status);
create index if not exists orders_created_at_idx on orders(created_at desc);

alter table orders enable row level security;

-- Customers see only their own orders
create policy "Customers can read their own orders"
  on orders for select using (auth.uid() = customer_id);

-- Customers can create orders
create policy "Customers can create orders"
  on orders for insert with check (auth.uid() = customer_id);

-- Business role users can read all orders (role checked via profiles)
-- In production you would scope this to the specific business_id the user owns.
create policy "Business users can read their business orders"
  on orders for select using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'BUSINESS')
  );

-- Business role users can update order status
create policy "Business users can update order status"
  on orders for update using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'BUSINESS')
  );

-- Dispatchers can read orders assigned to them
create policy "Dispatchers can read assigned orders"
  on orders for select using (auth.uid() = assigned_driver_id);

-- Dispatchers can update their location on assigned orders
create policy "Dispatchers can update their own orders"
  on orders for update using (auth.uid() = assigned_driver_id);

-- Admins can do everything
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

-- ── Order Status History ──────────────────────────────────────────────────────
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
      join businesses b on b.id = o.business_id
      where o.id = order_status_history.order_id and b.user_id = auth.uid()
    )
  );

create policy "Admins can read all history"
  on order_status_history for select using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'ADMIN')
  );

create policy "Authenticated users can insert history"
  on order_status_history for insert with check (auth.uid() is not null);

-- ── Push Tokens ───────────────────────────────────────────────────────────────
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

-- ── Realtime ──────────────────────────────────────────────────────────────────
-- Enable realtime for orders table in Supabase Dashboard:
-- Database → Replication → enable for `orders` table
-- (Cannot be done via SQL directly in hosted Supabase)
