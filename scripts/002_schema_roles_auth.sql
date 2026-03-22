-- =============================================================
-- 002_schema_roles_auth.sql  (idempotent — safe to re-run)
-- Roles seeding, missing tables, triggers, RLS, JWT hook
-- =============================================================

-- ─────────────────────────────────────────
-- 1. SEED ROLES — conflict on name (unique)
-- ─────────────────────────────────────────
INSERT INTO public.roles (id, name, description)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'admin',    'Platform yöneticisi — tam yetki'),
  ('00000000-0000-0000-0000-000000000002', 'vendor',   'Mağaza sahibi — kendi mağazasını yönetir'),
  ('00000000-0000-0000-0000-000000000003', 'customer', 'Alıcı — alışveriş yapabilir')
ON CONFLICT (name) DO UPDATE
  SET description = EXCLUDED.description;

-- ─────────────────────────────────────────
-- 2. SEED PERMISSIONS — conflict on code (unique)
-- ─────────────────────────────────────────
INSERT INTO public.permissions (id, module, code, description)
VALUES
  ('10000000-0000-0000-0000-000000000001', 'admin',    'admin.all',              'Tam yönetici erişimi'),
  ('10000000-0000-0000-0000-000000000002', 'vendor',   'vendor.manage_store',    'Kendi mağazasını yönet'),
  ('10000000-0000-0000-0000-000000000003', 'vendor',   'vendor.manage_products', 'Ürün ekle / düzenle / sil'),
  ('10000000-0000-0000-0000-000000000004', 'vendor',   'vendor.view_orders',     'Siparişleri görüntüle'),
  ('10000000-0000-0000-0000-000000000005', 'vendor',   'vendor.update_order',    'Sipariş durumunu güncelle'),
  ('10000000-0000-0000-0000-000000000006', 'customer', 'customer.place_order',   'Sipariş oluştur'),
  ('10000000-0000-0000-0000-000000000007', 'customer', 'customer.view_orders',   'Kendi siparişlerini gör'),
  ('10000000-0000-0000-0000-000000000008', 'customer', 'customer.use_coupons',   'Kupon kullan')
ON CONFLICT (code) DO UPDATE
  SET description = EXCLUDED.description,
      module      = EXCLUDED.module;

-- ─────────────────────────────────────────
-- 3. BIND PERMISSIONS TO ROLES (idempotent)
--    Uses the actual role IDs now in DB (may differ from our seeds above
--    if rows already existed under different UUIDs), so we look them up.
-- ─────────────────────────────────────────
DO $$
DECLARE
  _admin_id    uuid := (SELECT id FROM public.roles WHERE name = 'admin');
  _vendor_id   uuid := (SELECT id FROM public.roles WHERE name = 'vendor');
  _customer_id uuid := (SELECT id FROM public.roles WHERE name = 'customer');
  _p            RECORD;
BEGIN
  -- admin gets all permissions
  FOR _p IN SELECT id FROM public.permissions LOOP
    INSERT INTO public.role_permissions (role_id, permission_id)
    VALUES (_admin_id, _p.id)
    ON CONFLICT DO NOTHING;
  END LOOP;

  -- vendor permissions
  FOR _p IN SELECT id FROM public.permissions
            WHERE code IN ('vendor.manage_store','vendor.manage_products',
                           'vendor.view_orders','vendor.update_order') LOOP
    INSERT INTO public.role_permissions (role_id, permission_id)
    VALUES (_vendor_id, _p.id)
    ON CONFLICT DO NOTHING;
  END LOOP;

  -- customer permissions
  FOR _p IN SELECT id FROM public.permissions
            WHERE code IN ('customer.place_order','customer.view_orders',
                           'customer.use_coupons') LOOP
    INSERT INTO public.role_permissions (role_id, permission_id)
    VALUES (_customer_id, _p.id)
    ON CONFLICT DO NOTHING;
  END LOOP;
END;
$$;

-- ─────────────────────────────────────────
-- 4. MISSING TABLES
-- ─────────────────────────────────────────

-- order_status_history
CREATE TABLE IF NOT EXISTS public.order_status_history (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id   uuid        REFERENCES public.orders(id) ON DELETE CASCADE,
  old_status text,
  new_status text        NOT NULL,
  changed_by text,       -- 'vendor' | 'customer' | 'system' | 'admin'
  notes      text,
  created_at timestamptz DEFAULT now()
);

-- smart_link_clicks (UTM / analytics)
CREATE TABLE IF NOT EXISTS public.smart_link_clicks (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id        uuid        REFERENCES public.vendor_stores(id) ON DELETE SET NULL,
  product_id      uuid        REFERENCES public.vendor_products(id) ON DELETE SET NULL,
  campaign_name   text,
  utm_source      text,       -- instagram_bio | instagram_post | tiktok | direct
  utm_medium      text,
  utm_campaign    text,
  ip_hash         text,       -- SHA-256 of IP — never store raw IP
  session_id      text,
  converted       boolean     DEFAULT false,
  conversion_type text,       -- add_to_cart | purchase
  order_id        uuid        REFERENCES public.orders(id) ON DELETE SET NULL,
  created_at      timestamptz DEFAULT now()
);

-- returns
CREATE TABLE IF NOT EXISTS public.returns (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id   uuid        REFERENCES public.orders(id) ON DELETE SET NULL,
  store_id   uuid        REFERENCES public.vendor_stores(id) ON DELETE SET NULL,
  reason     text        NOT NULL,
  status     text        DEFAULT 'pending', -- pending | approved | rejected | completed
  notes      text,
  created_at timestamptz DEFAULT now()
);

-- ─────────────────────────────────────────
-- 5. RLS ON NEW TABLES
-- ─────────────────────────────────────────

ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smart_link_clicks    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.returns              ENABLE ROW LEVEL SECURITY;

-- Drop then recreate all policies so re-runs are safe
DO $$
BEGIN
  DROP POLICY IF EXISTS osh_select_own   ON public.order_status_history;
  DROP POLICY IF EXISTS osh_service_all  ON public.order_status_history;
  DROP POLICY IF EXISTS slc_select_vendor ON public.smart_link_clicks;
  DROP POLICY IF EXISTS slc_insert_anon  ON public.smart_link_clicks;
  DROP POLICY IF EXISTS slc_service_all  ON public.smart_link_clicks;
  DROP POLICY IF EXISTS ret_select_customer ON public.returns;
  DROP POLICY IF EXISTS ret_select_vendor   ON public.returns;
  DROP POLICY IF EXISTS ret_insert_customer ON public.returns;
  DROP POLICY IF EXISTS ret_service_all     ON public.returns;
END;
$$;

-- order_status_history
CREATE POLICY osh_select_own ON public.order_status_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id AND o.customer_id = auth.uid()
    )
  );

CREATE POLICY osh_service_all ON public.order_status_history
  FOR ALL USING (auth.role() = 'service_role');

-- smart_link_clicks
CREATE POLICY slc_select_vendor ON public.smart_link_clicks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.vendor_stores vs
      WHERE vs.id = store_id AND vs.owner_id = auth.uid()
    )
  );

CREATE POLICY slc_insert_anon ON public.smart_link_clicks
  FOR INSERT WITH CHECK (true); -- allow anonymous tracking

CREATE POLICY slc_service_all ON public.smart_link_clicks
  FOR ALL USING (auth.role() = 'service_role');

-- returns
CREATE POLICY ret_select_customer ON public.returns
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id AND o.customer_id = auth.uid()
    )
  );

CREATE POLICY ret_select_vendor ON public.returns
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.vendor_stores vs
      WHERE vs.id = store_id AND vs.owner_id = auth.uid()
    )
  );

CREATE POLICY ret_insert_customer ON public.returns
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id AND o.customer_id = auth.uid()
    )
  );

CREATE POLICY ret_service_all ON public.returns
  FOR ALL USING (auth.role() = 'service_role');

-- ─────────────────────────────────────────
-- 6. HELPER: get_my_role()
-- ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT r.name
  FROM public.profiles p
  JOIN public.roles r ON r.id = p.role_id
  WHERE p.id = auth.uid();
$$;

-- ─────────────────────────────────────────
-- 7. TRIGGER: auto-create profile for new signups
--    Assigns 'customer' role by default.
-- ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _customer_role_id uuid;
BEGIN
  SELECT id INTO _customer_role_id FROM public.roles WHERE name = 'customer';

  INSERT INTO public.profiles (id, full_name, display_name, role_id, is_active, is_verified)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'display_name', ''),
    _customer_role_id,
    true,
    false
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─────────────────────────────────────────
-- 8. TRIGGER: keep profiles.updated_at current
-- ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ─────────────────────────────────────────
-- 9. JWT HOOK: embed user_role in access token
--    After running, enable in Supabase Dashboard:
--    Authentication → Hooks → Custom Access Token Hook
--    → point to: public.custom_access_token_hook
-- ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role   text;
  _claims jsonb;
BEGIN
  SELECT r.name INTO _role
  FROM public.profiles p
  JOIN public.roles r ON r.id = p.role_id
  WHERE p.id = (event->>'user_id')::uuid;

  _claims := event->'claims';
  _claims := jsonb_set(_claims, '{user_role}', to_jsonb(COALESCE(_role, 'customer')));

  RETURN jsonb_set(event, '{claims}', _claims);
END;
$$;

GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM anon, authenticated;
