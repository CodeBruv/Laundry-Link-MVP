-- Day 2+3 schema — run once in the Supabase SQL editor

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_id uuid not null,
  customer_name text not null,
  customer_email text,
  business_id text not null default 'cleanpro-abuja',
  business_name text not null default 'CleanPro Laundry Abuja',
  assigned_driver_id uuid,
  assigned_driver_name text,
  pickup_address text not null,
  delivery_address text not null,
  items jsonb not null default '[]'::jsonb,
  total_amount numeric(12, 2) not null default 0,
  delivery_fee numeric(12, 2) not null default 1500,
  status text not null default 'PENDING' check (status in (
    'PENDING','ACCEPTED','PICKED_UP','IN_PROGRESS','READY','OUT_FOR_DELIVERY','DELIVERED','CANCELLED'
  )),
  special_requests text,
  urgent boolean not null default false,
  driver_lat double precision,
  driver_lng double precision,
  is_driver_location_shared boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Safe column additions for existing tables (idempotent)
alter table public.orders add column if not exists delivery_fee numeric(12,2) not null default 1500;
alter table public.orders add column if not exists driver_lat double precision;
alter table public.orders add column if not exists driver_lng double precision;
alter table public.orders add column if not exists is_driver_location_shared boolean not null default false;

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  service_name text not null,
  quantity integer not null default 1,
  price_per_unit numeric(12, 2) not null default 0,
  total numeric(12, 2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  status text not null,
  changed_by uuid,
  note text,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_status_history enable row level security;

-- Customer policies
drop policy if exists orders_select_customer on public.orders;
create policy orders_select_customer on public.orders
for select using (customer_id = auth.uid());

drop policy if exists orders_insert_customer on public.orders;
create policy orders_insert_customer on public.orders
for insert with check (customer_id = auth.uid());

-- Business policies
drop policy if exists orders_select_business on public.orders;
create policy orders_select_business on public.orders
for select using (
  auth.jwt() -> 'user_metadata' ->> 'role' = 'BUSINESS'
  and business_id = coalesce(auth.jwt() -> 'user_metadata' ->> 'business_id', 'cleanpro-abuja')
);

drop policy if exists orders_update_business on public.orders;
create policy orders_update_business on public.orders
for update using (
  auth.jwt() -> 'user_metadata' ->> 'role' = 'BUSINESS'
  and business_id = coalesce(auth.jwt() -> 'user_metadata' ->> 'business_id', 'cleanpro-abuja')
);

-- Dispatcher policies
drop policy if exists orders_select_dispatcher on public.orders;
create policy orders_select_dispatcher on public.orders
for select using (
  auth.jwt() -> 'user_metadata' ->> 'role' = 'DISPATCHER'
  and assigned_driver_id is not null
);

drop policy if exists orders_update_dispatcher on public.orders;
create policy orders_update_dispatcher on public.orders
for update using (
  auth.jwt() -> 'user_metadata' ->> 'role' = 'DISPATCHER'
  and assigned_driver_id = auth.uid()
);

-- Order items policies
drop policy if exists order_items_select_related on public.order_items;
create policy order_items_select_related on public.order_items
for select using (
  exists (
    select 1 from public.orders o
    where o.id = order_items.order_id
    and (
      o.customer_id = auth.uid()
      or (auth.jwt() -> 'user_metadata' ->> 'role' = 'BUSINESS' and o.business_id = coalesce(auth.jwt() -> 'user_metadata' ->> 'business_id', 'cleanpro-abuja'))
      or (auth.jwt() -> 'user_metadata' ->> 'role' = 'DISPATCHER' and o.assigned_driver_id is not null)
    )
  )
);

drop policy if exists order_items_insert_customer on public.order_items;
create policy order_items_insert_customer on public.order_items
for insert with check (
  exists (select 1 from public.orders o where o.id = order_items.order_id and o.customer_id = auth.uid())
);

-- Status history policies
drop policy if exists history_select_related on public.order_status_history;
create policy history_select_related on public.order_status_history
for select using (
  exists (
    select 1 from public.orders o
    where o.id = order_status_history.order_id
    and (
      o.customer_id = auth.uid()
      or (auth.jwt() -> 'user_metadata' ->> 'role' = 'BUSINESS' and o.business_id = coalesce(auth.jwt() -> 'user_metadata' ->> 'business_id', 'cleanpro-abuja'))
      or (auth.jwt() -> 'user_metadata' ->> 'role' = 'DISPATCHER' and o.assigned_driver_id is not null)
    )
  )
);

drop policy if exists history_insert_related on public.order_status_history;
create policy history_insert_related on public.order_status_history
for insert with check (changed_by = auth.uid());

-- Realtime
do $$
begin
  alter publication supabase_realtime add table public.orders;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;
