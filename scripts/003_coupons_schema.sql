-- ─── 003: Coupons + User Coupons ────────────────────────────────────────────
-- Global coupon definitions (managed by admins / service role)
create table if not exists public.coupons (
  id              uuid primary key default gen_random_uuid(),
  code            text not null unique,
  type            text not null check (type in ('percent', 'fixed', 'free_shipping')),
  value           numeric(10,2) not null default 0,
  min_order_amount numeric(10,2) not null default 0,
  max_uses        integer,                        -- null = unlimited
  current_uses    integer not null default 0,
  is_active       boolean not null default true,
  description     text not null default '',
  expires_at      timestamptz not null,
  created_at      timestamptz not null default now()
);

alter table public.coupons enable row level security;

-- Everyone who is authenticated can read active coupons
create policy "coupons_select_authenticated" on public.coupons
  for select to authenticated
  using (is_active = true);

-- Only service role can mutate
create policy "coupons_mutate_service" on public.coupons
  for all to service_role using (true) with check (true);

-- ─── User ↔ Coupon assignment ─────────────────────────────────────────────────
create table if not exists public.user_coupons (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  coupon_id   uuid not null references public.coupons(id) on delete cascade,
  assigned_at timestamptz not null default now(),
  used_at     timestamptz,
  unique (user_id, coupon_id)
);

alter table public.user_coupons enable row level security;

create policy "user_coupons_select_own" on public.user_coupons
  for select using (auth.uid() = user_id);

create policy "user_coupons_insert_own" on public.user_coupons
  for insert with check (auth.uid() = user_id);

create policy "user_coupons_update_own" on public.user_coupons
  for update using (auth.uid() = user_id);

create policy "user_coupons_delete_own" on public.user_coupons
  for delete using (auth.uid() = user_id);

-- Service role can manage all rows (needed for admin assignment flows)
create policy "user_coupons_service" on public.user_coupons
  for all to service_role using (true) with check (true);

-- ─── Seed: pre-defined test coupons ──────────────────────────────────────────
insert into public.coupons (code, type, value, min_order_amount, max_uses, description, expires_at)
values
  ('TEST20',    'percent',      20,  0,    100, 'Test kuponu — tüm siparişlerde %20 indirim',      now() + interval '30 days'),
  ('TEST50TL',  'fixed',        50,  150,  50,  'Test kuponu — 150 ₺ üzeri siparişlerde 50 ₺ indirim', now() + interval '30 days'),
  ('TESTKARGO', 'free_shipping', 0,  0,    200, 'Test kuponu — ücretsiz kargo',                    now() + interval '30 days')
on conflict (code) do nothing;
