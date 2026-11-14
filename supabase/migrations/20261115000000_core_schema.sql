-- Core schema for the car-rental marketplace (Airbnb-for-cars).
-- One platform brand. Hosts (rental companies or individual owners) list vehicles;
-- customers browse and book across all approved hosts.
-- Host billing (registration fee / subscription / commission) is a later phase.

create extension if not exists btree_gist;

-- ─── Enums ───────────────────────────────────────────────────────────────
create type public.platform_role as enum ('customer', 'admin');      -- admin = marketplace staff (you)
create type public.host_kind as enum ('company', 'individual');
create type public.host_status as enum ('pending', 'approved', 'suspended');
create type public.host_member_role as enum ('owner', 'manager', 'staff');
create type public.vehicle_status as enum ('pending_review', 'available', 'maintenance', 'retired');
create type public.booking_status as enum ('pending', 'confirmed', 'active', 'completed', 'cancelled');
create type public.payment_status as enum ('pending', 'paid', 'failed', 'refunded');
create type public.kyc_status as enum ('none', 'pending', 'verified', 'rejected');
create type public.inspection_kind as enum ('pickup', 'return');

-- ─── Users ───────────────────────────────────────────────────────────────
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.platform_role not null default 'customer',
  full_name text,
  phone text,
  avatar_url text,
  kyc_status public.kyc_status not null default 'none',
  blacklisted boolean not null default false,
  loyalty_points int not null default 0,
  created_at timestamptz not null default now()
);

-- ─── Hosts ───────────────────────────────────────────────────────────────
create table public.hosts (
  id uuid primary key default gen_random_uuid(),
  kind public.host_kind not null,
  name text not null,
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  status public.host_status not null default 'pending',
  verified boolean not null default false,          -- business registration / NIC checked by admin
  bio text,
  logo_url text,
  city text,
  phone text,
  business_reg_no text,                             -- companies only
  rating numeric(3, 2) not null default 0,
  review_count int not null default 0,
  response_minutes int,                             -- "usually responds in N min"
  created_at timestamptz not null default now()
);
create index on public.hosts (status, kind);

-- people who can manage a host (an individual host has just its owner)
create table public.host_members (
  host_id uuid not null references public.hosts (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  role public.host_member_role not null default 'staff',
  primary key (host_id, profile_id)
);
create index on public.host_members (profile_id);

create table public.locations (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.hosts (id) on delete cascade,
  name text not null,
  address text,
  lat double precision,
  lng double precision,
  opening_hours jsonb not null default '{}'::jsonb
);
create index on public.locations (host_id);

-- ─── Listings ────────────────────────────────────────────────────────────
create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.hosts (id) on delete cascade,
  location_id uuid references public.locations (id) on delete set null,
  make text not null,
  model text not null,
  year int not null check (year between 1990 and 2100),
  plate text not null unique,
  category text not null check (category in ('Luxury', 'SUV', 'Sedan', 'Electric', 'Sport', 'Van')),
  body_style text not null check (body_style in ('sedan', 'suv', 'sport', 'van')),
  seats int not null check (seats > 0),
  transmission text not null check (transmission in ('Auto', 'Manual')),
  fuel text not null check (fuel in ('Petrol', 'Diesel', 'Hybrid', 'Electric')),
  daily_rate numeric(12, 2) not null check (daily_rate > 0),
  deposit numeric(12, 2) not null default 0,
  rating numeric(3, 2) not null default 0,
  trips int not null default 0,
  colors text[] not null default '{}',
  model_url text,                                   -- optional GLB for the 3D viewer
  images text[] not null default '{}',
  specs jsonb not null default '{}'::jsonb,
  features text[] not null default '{}',
  with_driver_only boolean not null default false,
  instant_book boolean not null default true,       -- false = host must accept the request
  status public.vehicle_status not null default 'pending_review',
  created_at timestamptz not null default now()
);
create index on public.vehicles (status, category);
create index on public.vehicles (host_id);

create table public.pricing_rules (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.hosts (id) on delete cascade,
  vehicle_id uuid references public.vehicles (id) on delete cascade, -- null = all of this host's vehicles
  name text not null,
  valid_from date,
  valid_to date,
  weekdays int[],                                   -- 0=Sun..6=Sat, null = every day
  multiplier numeric(5, 3) not null default 1.0,
  min_days int
);

create table public.availability_blocks (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.hosts (id) on delete cascade,
  vehicle_id uuid not null references public.vehicles (id) on delete cascade,
  period tstzrange not null,
  reason text
);

create table public.addons (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.hosts (id) on delete cascade,
  name text not null,
  description text,
  price_per_day numeric(12, 2) not null check (price_per_day >= 0),
  icon text
);

-- host_id null = platform-wide promo funded by the marketplace
create table public.promo_codes (
  id uuid primary key default gen_random_uuid(),
  host_id uuid references public.hosts (id) on delete cascade,
  code text not null unique,
  percent_off numeric(5, 2) not null check (percent_off > 0 and percent_off <= 100),
  min_days int not null default 1,
  valid_until timestamptz,
  max_uses int,
  uses int not null default 0
);

-- ─── Bookings ────────────────────────────────────────────────────────────
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique default ('BK-' || upper(substr(md5(gen_random_uuid()::text), 1, 8))),
  host_id uuid not null references public.hosts (id),
  customer_id uuid not null references public.profiles (id),
  vehicle_id uuid not null references public.vehicles (id),
  period tstzrange not null,
  status public.booking_status not null default 'pending',
  hold_expires_at timestamptz,                      -- unpaid pending bookings release the car after this
  delivery boolean not null default false,
  pickup_address text,
  color text,
  promo_code text,
  subtotal numeric(12, 2) not null,
  extras numeric(12, 2) not null default 0,
  discount numeric(12, 2) not null default 0,
  total numeric(12, 2) not null,
  deposit numeric(12, 2) not null default 0,
  assigned_staff_id uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  -- The core guarantee: a vehicle can never be double-booked.
  constraint no_double_booking exclude using gist (vehicle_id with =, period with &&)
    where (status in ('pending', 'confirmed', 'active'))
);
create index on public.bookings (host_id, status);
create index on public.bookings (customer_id);

create table public.booking_addons (
  booking_id uuid not null references public.bookings (id) on delete cascade,
  addon_id uuid not null references public.addons (id),
  price_per_day numeric(12, 2) not null,
  primary key (booking_id, addon_id)
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete cascade,
  host_id uuid not null references public.hosts (id),
  provider text not null default 'payhere',
  provider_ref text,
  amount numeric(12, 2) not null,
  currency text not null default 'LKR',
  status public.payment_status not null default 'pending',
  raw jsonb,
  created_at timestamptz not null default now()
);
create index on public.payments (booking_id);

-- ─── Operations & trust ──────────────────────────────────────────────────
create table public.inspections (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete cascade,
  host_id uuid not null references public.hosts (id),
  staff_id uuid not null references public.profiles (id),
  kind public.inspection_kind not null,
  odometer int,
  fuel_level int check (fuel_level between 0 and 100),
  damages jsonb not null default '[]'::jsonb,       -- [{panel, note, photo_path, x, y}]
  photos text[] not null default '{}',
  customer_signature_path text,
  created_at timestamptz not null default now()
);

-- KYC for renters (licence/NIC) and verification docs for hosts (business reg, NIC, vehicle papers)
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  host_id uuid references public.hosts (id) on delete cascade,
  kind text not null check (kind in ('licence', 'nic', 'passport', 'business_reg', 'vehicle_registration', 'insurance')),
  storage_path text not null,
  status public.kyc_status not null default 'pending',
  reviewed_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings (id) on delete cascade,
  host_id uuid not null references public.hosts (id),
  vehicle_id uuid not null references public.vehicles (id),
  customer_id uuid not null references public.profiles (id),
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

create table public.favorites (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  vehicle_id uuid not null references public.vehicles (id) on delete cascade,
  primary key (profile_id, vehicle_id)
);

-- ─── Every new auth user gets a customer profile ─────────────────────────
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (new.id, new.raw_user_meta_data ->> 'full_name', new.phone);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── Whoever registers a host becomes its owner ──────────────────────────
create function public.handle_new_host() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is not null then
    insert into public.host_members (host_id, profile_id, role) values (new.id, auth.uid(), 'owner');
  end if;
  return new;
end;
$$;

create trigger on_host_created
  after insert on public.hosts
  for each row execute function public.handle_new_host();
