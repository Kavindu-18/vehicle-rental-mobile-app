-- Row-Level Security for the marketplace.
--  • Anyone can browse approved hosts and their approved listings.
--  • Host members manage only their own host's fleet, bookings and staff.
--  • Customers see only their own bookings, payments, documents.
--  • Marketplace admins (platform_role = 'admin') see and moderate everything.
-- Money-related writes (bookings, payments) only happen in edge functions via the service role.

-- ─── Helpers (security definer → no RLS recursion) ───────────────────────
create function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((select role = 'admin' from public.profiles where id = auth.uid()), false)
$$;

create function public.is_host_member(h uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.host_members where host_id = h and profile_id = auth.uid())
$$;

create function public.is_host_manager(h uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.host_members
    where host_id = h and profile_id = auth.uid() and role in ('owner', 'manager')
  )
$$;

create function public.host_is_live(h uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.hosts where id = h and status = 'approved')
$$;

-- ─── Enable RLS everywhere ───────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.hosts enable row level security;
alter table public.host_members enable row level security;
alter table public.locations enable row level security;
alter table public.vehicles enable row level security;
alter table public.pricing_rules enable row level security;
alter table public.availability_blocks enable row level security;
alter table public.addons enable row level security;
alter table public.promo_codes enable row level security;
alter table public.bookings enable row level security;
alter table public.booking_addons enable row level security;
alter table public.payments enable row level security;
alter table public.inspections enable row level security;
alter table public.documents enable row level security;
alter table public.reviews enable row level security;
alter table public.favorites enable row level security;

-- ─── Profiles ────────────────────────────────────────────────────────────
create policy "read own profile" on public.profiles for select using (id = auth.uid());
create policy "hosts read their renters" on public.profiles for select using (
  exists (select 1 from public.bookings b where b.customer_id = profiles.id and public.is_host_member(b.host_id))
);
create policy "admin reads all" on public.profiles for select using (public.is_admin());
create policy "update own profile" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy "admin updates all" on public.profiles for update using (public.is_admin()) with check (public.is_admin());

-- ─── Hosts ───────────────────────────────────────────────────────────────
create policy "approved hosts are public" on public.hosts for select
  using (status = 'approved' or public.is_host_member(id) or public.is_admin());
create policy "anyone signed in can apply as host" on public.hosts for insert to authenticated
  with check (status = 'pending' and verified = false);
create policy "managers edit own host" on public.hosts for update
  using (public.is_host_manager(id) or public.is_admin())
  with check (public.is_host_manager(id) or public.is_admin());
create policy "admin deletes hosts" on public.hosts for delete using (public.is_admin());

create policy "members see team" on public.host_members for select using (public.is_host_member(host_id) or public.is_admin());
create policy "managers manage team" on public.host_members for all
  using (public.is_host_manager(host_id) or public.is_admin())
  with check (public.is_host_manager(host_id) or public.is_admin());

-- ─── Catalogue ───────────────────────────────────────────────────────────
create policy "public read" on public.locations for select using (public.host_is_live(host_id) or public.is_host_member(host_id) or public.is_admin());
create policy "managers write" on public.locations for all
  using (public.is_host_manager(host_id) or public.is_admin())
  with check (public.is_host_manager(host_id) or public.is_admin());

create policy "public read live listings" on public.vehicles for select
  using ((status = 'available' and public.host_is_live(host_id)) or public.is_host_member(host_id) or public.is_admin());
create policy "managers write listings" on public.vehicles for all
  using (public.is_host_manager(host_id) or public.is_admin())
  with check (public.is_host_manager(host_id) or public.is_admin());

create policy "public read" on public.addons for select using (public.host_is_live(host_id) or public.is_host_member(host_id) or public.is_admin());
create policy "managers write" on public.addons for all
  using (public.is_host_manager(host_id) or public.is_admin())
  with check (public.is_host_manager(host_id) or public.is_admin());

create policy "public read" on public.pricing_rules for select using (public.host_is_live(host_id) or public.is_host_member(host_id) or public.is_admin());
create policy "managers write" on public.pricing_rules for all
  using (public.is_host_manager(host_id) or public.is_admin())
  with check (public.is_host_manager(host_id) or public.is_admin());

create policy "members read" on public.availability_blocks for select using (public.is_host_member(host_id) or public.is_admin());
create policy "managers write" on public.availability_blocks for all
  using (public.is_host_manager(host_id) or public.is_admin())
  with check (public.is_host_manager(host_id) or public.is_admin());

-- promo codes are validated server-side; nobody lists them from the client except owners
create policy "host promos" on public.promo_codes for all
  using ((host_id is not null and public.is_host_manager(host_id)) or public.is_admin())
  with check ((host_id is not null and public.is_host_manager(host_id)) or public.is_admin());

-- ─── Bookings & payments ─────────────────────────────────────────────────
create policy "customer reads own" on public.bookings for select using (customer_id = auth.uid());
create policy "host reads own" on public.bookings for select using (public.is_host_member(host_id) or public.is_admin());
create policy "host updates own" on public.bookings for update
  using (public.is_host_member(host_id) or public.is_admin())
  with check (public.is_host_member(host_id) or public.is_admin());

create policy "read via booking" on public.booking_addons for select using (
  exists (select 1 from public.bookings b where b.id = booking_id
          and (b.customer_id = auth.uid() or public.is_host_member(b.host_id) or public.is_admin()))
);

create policy "customer reads own" on public.payments for select using (
  exists (select 1 from public.bookings b where b.id = booking_id and b.customer_id = auth.uid())
);
create policy "host reads own" on public.payments for select using (public.is_host_member(host_id) or public.is_admin());

-- ─── Operations & trust ──────────────────────────────────────────────────
create policy "host staff manage" on public.inspections for all
  using (public.is_host_member(host_id) or public.is_admin())
  with check (public.is_host_member(host_id) and staff_id = auth.uid());
create policy "customer reads own" on public.inspections for select using (
  exists (select 1 from public.bookings b where b.id = booking_id and b.customer_id = auth.uid())
);

create policy "own documents" on public.documents for select using (profile_id = auth.uid());
create policy "upload own documents" on public.documents for insert with check (
  profile_id = auth.uid() and status = 'pending'
  and (host_id is null or public.is_host_manager(host_id))
);
create policy "admin reviews documents" on public.documents for all using (public.is_admin()) with check (public.is_admin());

create policy "public read" on public.reviews for select using (true);
create policy "review own completed booking" on public.reviews for insert with check (
  customer_id = auth.uid()
  and exists (select 1 from public.bookings b where b.id = booking_id and b.customer_id = auth.uid()
              and b.status = 'completed' and b.vehicle_id = reviews.vehicle_id and b.host_id = reviews.host_id)
);

create policy "own favorites" on public.favorites for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- ─── Column guards (policies can't compare old vs new; triggers can) ─────
-- Users edit name/phone/avatar, never their role, KYC, blacklist or points.
create function public.guard_profile_columns() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or public.is_admin() then return new; end if; -- service role / admin
  if new.role is distinct from old.role
     or new.kyc_status is distinct from old.kyc_status
     or new.blacklisted is distinct from old.blacklisted
     or new.loyalty_points is distinct from old.loyalty_points then
    raise exception 'not allowed to change protected profile fields';
  end if;
  return new;
end;
$$;
create trigger guard_profile_columns before update on public.profiles
  for each row execute function public.guard_profile_columns();

-- Hosts edit their public profile; approval, verification and ratings belong to the marketplace.
create function public.guard_host_columns() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or public.is_admin() then return new; end if;
  if new.status is distinct from old.status
     or new.verified is distinct from old.verified
     or new.rating is distinct from old.rating
     or new.review_count is distinct from old.review_count
     or new.kind is distinct from old.kind then
    raise exception 'only marketplace admins can change status, verification, kind or ratings';
  end if;
  return new;
end;
$$;
create trigger guard_host_columns before update on public.hosts
  for each row execute function public.guard_host_columns();

-- New or edited listings go back to review unless an admin made the change.
create function public.guard_vehicle_status() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or public.is_admin() then return new; end if;
  if tg_op = 'INSERT' then
    new.status := 'pending_review';
    new.rating := 0;
    new.trips := 0;
  else
    -- hosts may toggle available <-> maintenance/retired on approved cars, but not self-approve
    if old.status = 'pending_review' and new.status <> 'pending_review' then
      raise exception 'listing is awaiting marketplace review';
    end if;
    if new.rating is distinct from old.rating or new.trips is distinct from old.trips then
      raise exception 'ratings and trip counts are managed by the marketplace';
    end if;
  end if;
  return new;
end;
$$;
create trigger guard_vehicle_status before insert or update on public.vehicles
  for each row execute function public.guard_vehicle_status();

-- Host members can't escalate themselves to owner, or remove the last owner.
create function public.guard_host_members() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or public.is_admin() then return coalesce(new, old); end if;
  if tg_op in ('INSERT', 'UPDATE') and new.role = 'owner'
     -- the first member of a brand-new host (added by handle_new_host) is allowed
     and exists (select 1 from public.host_members where host_id = new.host_id)
     and not exists (select 1 from public.host_members where host_id = new.host_id and profile_id = auth.uid() and role = 'owner') then
    raise exception 'only an owner can grant owner role';
  end if;
  if tg_op in ('UPDATE', 'DELETE') and old.role = 'owner'
     and (select count(*) from public.host_members where host_id = old.host_id and role = 'owner') <= 1
     and (tg_op = 'DELETE' or new.role <> 'owner') then
    raise exception 'a host must keep at least one owner';
  end if;
  return coalesce(new, old);
end;
$$;
create trigger guard_host_members before insert or update or delete on public.host_members
  for each row execute function public.guard_host_members();
