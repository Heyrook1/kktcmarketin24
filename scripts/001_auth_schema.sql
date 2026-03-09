-- ============================================================
-- KKTC Marketplace: Auth & User Management Schema
-- ============================================================
-- Table execution order respects foreign-key dependencies.
-- All tables use UUID primary keys and timestamptz for dates.
-- RLS is enabled on every table; policies follow least-privilege.
-- ============================================================

-- ── 1. ROLES ─────────────────────────────────────────────────
-- Defines named roles (e.g. customer, vendor, admin, support).
create table if not exists public.roles (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,           -- 'customer' | 'vendor' | 'admin' | 'support'
  description text,
  created_at  timestamptz not null default now()
);

alter table public.roles enable row level security;

-- Anyone authenticated may read roles (needed for UI permission checks)
create policy "roles_select_authenticated"
  on public.roles for select
  using (auth.role() = 'authenticated');

-- Only service-role (server-side admin operations) may mutate roles
create policy "roles_insert_service"
  on public.roles for insert
  with check (auth.role() = 'service_role');

create policy "roles_update_service"
  on public.roles for update
  using (auth.role() = 'service_role');

create policy "roles_delete_service"
  on public.roles for delete
  using (auth.role() = 'service_role');

-- Seed default roles
insert into public.roles (name, description) values
  ('customer', 'Standard marketplace buyer'),
  ('vendor',   'Marketplace seller / shop owner'),
  ('admin',    'Platform administrator with full access'),
  ('support',  'Customer support agent')
on conflict (name) do nothing;


-- ── 2. PERMISSIONS ───────────────────────────────────────────
-- Granular capability tokens (e.g. 'order:read', 'product:write').
create table if not exists public.permissions (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,           -- machine-readable slug
  description text,
  module      text not null,                  -- grouping: 'orders' | 'products' | 'users' …
  created_at  timestamptz not null default now()
);

alter table public.permissions enable row level security;

create policy "permissions_select_authenticated"
  on public.permissions for select
  using (auth.role() = 'authenticated');

create policy "permissions_mutate_service"
  on public.permissions for all
  using (auth.role() = 'service_role');

-- Seed permissions
insert into public.permissions (code, module, description) values
  ('order:read',         'orders',   'View own orders'),
  ('order:write',        'orders',   'Place and cancel orders'),
  ('order:manage',       'orders',   'Manage all orders (admin/support)'),
  ('product:read',       'products', 'Browse products'),
  ('product:write',      'products', 'Create and edit own product listings'),
  ('product:manage',     'products', 'Manage all product listings (admin)'),
  ('coupon:use',         'coupons',  'Redeem coupons at checkout'),
  ('coupon:manage',      'coupons',  'Create and manage coupons (admin)'),
  ('review:write',       'reviews',  'Submit product reviews'),
  ('review:manage',      'reviews',  'Moderate reviews (admin/support)'),
  ('user:read_own',      'users',    'Read own profile'),
  ('user:update_own',    'users',    'Update own profile'),
  ('user:manage',        'users',    'Manage all user accounts (admin)'),
  ('support:ticket_own', 'support',  'Create and view own support tickets'),
  ('support:ticket_all', 'support',  'View and respond to all tickets (support/admin)')
on conflict (code) do nothing;


-- ── 3. ROLE_PERMISSIONS ──────────────────────────────────────
-- Maps which permissions belong to which role.
create table if not exists public.role_permissions (
  role_id       uuid not null references public.roles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  granted_at    timestamptz not null default now(),
  primary key (role_id, permission_id)
);

alter table public.role_permissions enable row level security;

create policy "role_permissions_select_authenticated"
  on public.role_permissions for select
  using (auth.role() = 'authenticated');

create policy "role_permissions_mutate_service"
  on public.role_permissions for all
  using (auth.role() = 'service_role');

-- Assign permissions to roles
do $$
declare
  r_customer uuid;
  r_vendor   uuid;
  r_admin    uuid;
  r_support  uuid;
begin
  select id into r_customer from public.roles where name = 'customer';
  select id into r_vendor   from public.roles where name = 'vendor';
  select id into r_admin    from public.roles where name = 'admin';
  select id into r_support  from public.roles where name = 'support';

  -- Customer permissions
  insert into public.role_permissions (role_id, permission_id)
  select r_customer, id from public.permissions
  where code in ('order:read','order:write','product:read','coupon:use','review:write','user:read_own','user:update_own','support:ticket_own')
  on conflict do nothing;

  -- Vendor permissions (superset of customer + product management)
  insert into public.role_permissions (role_id, permission_id)
  select r_vendor, id from public.permissions
  where code in ('order:read','order:write','product:read','product:write','coupon:use','review:write','user:read_own','user:update_own','support:ticket_own')
  on conflict do nothing;

  -- Support permissions
  insert into public.role_permissions (role_id, permission_id)
  select r_support, id from public.permissions
  where code in ('order:read','order:manage','product:read','review:manage','user:read_own','user:update_own','support:ticket_own','support:ticket_all')
  on conflict do nothing;

  -- Admin gets all permissions
  insert into public.role_permissions (role_id, permission_id)
  select r_admin, id from public.permissions
  on conflict do nothing;
end $$;


-- ── 4. PROFILES ──────────────────────────────────────────────
-- Extended user data that supplements auth.users.
-- References auth.users(id) so it is deleted when the auth user is deleted.
create table if not exists public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  role_id         uuid not null references public.roles(id) default (
                    select id from public.roles where name = 'customer'
                  ),
  display_name    text,
  full_name       text,
  phone           text,
  avatar_url      text,
  -- Delivery address (auto-filled at checkout)
  address_line1   text,
  address_line2   text,
  city            text,
  district        text,
  postal_code     text,
  country         text not null default 'CY',
  -- Preferences
  language        text not null default 'tr',
  email_marketing boolean not null default false,
  sms_marketing   boolean not null default false,
  -- Account state
  is_active       boolean not null default true,
  is_verified     boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

create policy "profiles_delete_own"
  on public.profiles for delete
  using (auth.uid() = id);

-- Admins and support may read all profiles
create policy "profiles_select_admin"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles p
      join public.roles r on r.id = p.role_id
      where p.id = auth.uid() and r.name in ('admin', 'support')
    )
  );


-- ── 5. SESSIONS ──────────────────────────────────────────────
-- Tracks active user sessions for audit and forced-logout support.
-- Supabase manages its own GoTrue sessions; this table mirrors them
-- for application-level visibility and device management.
create table if not exists public.user_sessions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  device_type   text,                -- 'mobile' | 'desktop' | 'tablet'
  user_agent    text,
  ip_address    inet,
  last_seen_at  timestamptz not null default now(),
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);

create index if not exists user_sessions_user_id_idx on public.user_sessions(user_id);
create index if not exists user_sessions_active_idx  on public.user_sessions(user_id, is_active);

alter table public.user_sessions enable row level security;

create policy "sessions_select_own"
  on public.user_sessions for select
  using (auth.uid() = user_id);

create policy "sessions_insert_own"
  on public.user_sessions for insert
  with check (auth.uid() = user_id);

create policy "sessions_update_own"
  on public.user_sessions for update
  using (auth.uid() = user_id);

create policy "sessions_delete_own"
  on public.user_sessions for delete
  using (auth.uid() = user_id);

create policy "sessions_select_admin"
  on public.user_sessions for select
  using (
    exists (
      select 1 from public.profiles p
      join public.roles r on r.id = p.role_id
      where p.id = auth.uid() and r.name = 'admin'
    )
  );


-- ── 6. AUDIT_LOGS ────────────────────────────────────────────
-- Immutable log of all auth events (login, logout, failed attempt,
-- password reset, email change, role change).
create table if not exists public.audit_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete set null,
  event_type  text not null,             -- 'login_success' | 'login_failed' | 'logout' | 'password_reset' | 'role_change' | 'profile_update'
  ip_address  inet,
  user_agent  text,
  metadata    jsonb,                     -- arbitrary key-value context per event
  created_at  timestamptz not null default now()
);

create index if not exists audit_logs_user_id_idx   on public.audit_logs(user_id);
create index if not exists audit_logs_event_idx     on public.audit_logs(event_type);
create index if not exists audit_logs_created_idx   on public.audit_logs(created_at desc);

alter table public.audit_logs enable row level security;

-- Users may read their own audit logs; only service role may insert
create policy "audit_logs_select_own"
  on public.audit_logs for select
  using (auth.uid() = user_id);

create policy "audit_logs_insert_service"
  on public.audit_logs for insert
  with check (auth.role() = 'service_role');

create policy "audit_logs_select_admin"
  on public.audit_logs for select
  using (
    exists (
      select 1 from public.profiles p
      join public.roles r on r.id = p.role_id
      where p.id = auth.uid() and r.name in ('admin', 'support')
    )
  );


-- ── 7. PASSWORD_RESET_TOKENS ─────────────────────────────────
-- Stores short-lived tokens for password reset flows.
-- Supabase handles its own magic-link tokens; this table is for
-- custom reset flows (e.g. SMS OTP, custom email templates).
create table if not exists public.password_reset_tokens (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  token_hash  text not null unique,      -- bcrypt/sha256 hash of the sent token
  expires_at  timestamptz not null,
  used_at     timestamptz,               -- null = unused; set on redemption
  created_at  timestamptz not null default now()
);

create index if not exists prt_user_id_idx   on public.password_reset_tokens(user_id);
create index if not exists prt_expires_idx   on public.password_reset_tokens(expires_at);

alter table public.password_reset_tokens enable row level security;

create policy "prt_insert_service"
  on public.password_reset_tokens for insert
  with check (auth.role() = 'service_role');

create policy "prt_update_service"
  on public.password_reset_tokens for update
  using (auth.role() = 'service_role');

create policy "prt_select_service"
  on public.password_reset_tokens for select
  using (auth.role() = 'service_role');


-- ── 8. AUTO-CREATE PROFILE TRIGGER ───────────────────────────
-- Whenever a new auth.user row is inserted (sign-up), automatically
-- create a matching public.profiles row with the 'customer' role.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role_id uuid;
begin
  select id into v_role_id from public.roles where name = 'customer';

  insert into public.profiles (
    id,
    role_id,
    display_name,
    full_name,
    language
  ) values (
    new.id,
    v_role_id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'full_name', null),
    coalesce(new.raw_user_meta_data ->> 'language', 'tr')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();


-- ── 9. UPDATED_AT TRIGGER ────────────────────────────────────
-- Keep profiles.updated_at current automatically.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;

create trigger profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();
