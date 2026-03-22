-- =============================================================
-- 002_schema_roles_auth.sql
-- Full schema: roles seeding, missing tables, triggers, RLS
-- =============================================================

-- ─────────────────────────────────────────
-- 1. SEED ROLES (idempotent)
-- ─────────────────────────────────────────
INSERT INTO public.roles (id, name, description)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'admin',    'Platform yöneticisi — tam yetki'),
  ('00000000-0000-0000-0000-000000000002', 'vendor',   'Mağaza sahibi — kendi mağazasını yönetir'),
  ('00000000-0000-0000-0000-000000000003', 'customer', 'Alıcı — alışveriş yapabilir')
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────
-- 2. SEED PERMISSIONS (idempotent)
-- ─────────────────────────────────────────
INSERT INTO public.permissions (id, module, code, description)
VALUES
  ('10000000-0000-0000-0000-000000000001', 'admin',    'admin.all',             'Tam yönetici erişimi'),
  ('10000000-0000-0000-0000-000000000002', 'vendor',   'vendor.manage_store',   'Kendi mağazasını yönet'),
  ('10000000-0000-0000-0000-000000000003', 'vendor',   'vendor.manage_products','Ürün ekle / düzenle / sil'),
  ('10000000-0000-0000-0000-000000000004', 'vendor',   'vendor.view_orders',    'Siparişleri görüntüle'),
  ('10000000-0000-0000-0000-000000000005', 'vendor',   'vendor.update_order',   'Sipariş durumunu güncelle'),
  ('10000000-0000-0000-0000-000000000006', 'customer', 'customer.place_order',  'Sipariş oluştur'),
  ('10000000-0000-0000-0000-000000000007', 'customer', 'customer.view_orders',  'Kendi siparişlerini gör'),
  ('10000000-0000-0000-0000-000000000008', 'customer', 'customer.use_coupons',  'Kupon kullan')
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────
-- 3. BIND PERMISSIONS TO ROLES (idempotent)
-- ─────────────────────────────────────────
INSERT INTO public.role_permissions (role_id, permission_id)
VALUES
  -- admin gets everything
  ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001'),
  -- vendor
  ('00000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002'),
  ('00000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000003'),
  ('00000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000004'),
  ('00000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000005'),
  -- customer
  ('00000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000006'),
  ('00000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000007'),
  ('00000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000008')
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────
-- 4. MISSING TABLES FROM SQL SPEC
-- ─────────────────────────────────────────

-- order_status_history
CREATE TABLE IF NOT EXISTS public.order_status_history (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  old_status  text,
  new_status  text NOT NULL,
  changed_by  text,   -- 'vendor' | 'customer' | 'system' | 'admin'
  notes       text,
  created_at  timestamptz DEFAULT now()
);

-- smart_link_clicks (analytics)
CREATE TABLE IF NOT EXISTS public.smart_link_clicks (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id         uuid REFERENCES public.vendor_stores(id) ON DELETE SET NULL,
  product_id       uuid REFERENCES public.vendor_products(id) ON DELETE SET NULL,
  campaign_name    text,
  utm_source       text,   -- instagram_bio | instagram_post | tiktok | direct
  utm_medium       text,
  utm_campaign     text,
  ip_hash          text,   -- hashed for privacy (never store raw IP)
  session_id       text,
  converted        boolean DEFAULT false,
  conversion_type  text,   -- add_to_cart | purchase
  order_id         uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  created_at       timestamptz DEFAULT now()
);

-- returns
CREATE TABLE IF NOT EXISTS public.returns (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id   uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  store_id   uuid REFERENCES public.vendor_stores(id) ON DELETE SET NULL,
  reason     text NOT NULL,
  status     text DEFAULT 'pending', -- pending | approved | rejected | completed
  notes      text,
  created_at timestamptz DEFAULT now()
);

-- ─────────────────────────────────────────
-- 5. RLS ON NEW TABLES
-- ─────────────────────────────────────────

ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smart_link_clicks    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.returns              ENABLE ROW LEVEL SECURITY;

-- order_status_history: customers see their own orders' history; service role can do all
CREATE POLICY osh_select_own ON public.order_status_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id
        AND o.customer_id = auth.uid()
    )
  );

CREATE POLICY osh_service_all ON public.order_status_history
  FOR ALL USING (auth.role() = 'service_role');

-- smart_link_clicks: vendors see their own store clicks; service role can do all
CREATE POLICY slc_select_vendor ON public.smart_link_clicks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.vendor_stores vs
      WHERE vs.id = store_id
        AND vs.owner_id = auth.uid()
    )
  );

CREATE POLICY slc_insert_anon ON public.smart_link_clicks
  FOR INSERT WITH CHECK (true);   -- allow anonymous click tracking

CREATE POLICY slc_service_all ON public.smart_link_clicks
  FOR ALL USING (auth.role() = 'service_role');

-- returns: customers see their own returns; vendors see returns for their store
CREATE POLICY ret_select_customer ON public.returns
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id
        AND o.customer_id = auth.uid()
    )
  );

CREATE POLICY ret_select_vendor ON public.returns
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.vendor_stores vs
      WHERE vs.id = store_id
        AND vs.owner_id = auth.uid()
    )
  );

CREATE POLICY ret_insert_customer ON public.returns
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id
        AND o.customer_id = auth.uid()
    )
  );

CREATE POLICY ret_service_all ON public.returns
  FOR ALL USING (auth.role() = 'service_role');

-- ─────────────────────────────────────────
-- 6. HELPER: get_my_role() — used in middleware JWT claim
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
-- 7. TRIGGER: auto-create profile on new auth.users signup
--    Assigns 'customer' role by default.
-- ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _customer_role_id uuid := '00000000-0000-0000-0000-000000000003';
BEGIN
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

-- Drop and recreate to ensure idempotency
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─────────────────────────────────────────
-- 8. TRIGGER: keep profiles.updated_at fresh
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
-- 9. EXPOSE role in JWT via app_metadata hook
--    (custom claim read by middleware)
-- ─────────────────────────────────────────
-- NOTE: After running this migration, enable the
-- "custom_access_token_hook" in Supabase dashboard:
-- Authentication → Hooks → Custom Access Token Hook
-- and point it to public.custom_access_token_hook below.

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role text;
  _claims jsonb;
BEGIN
  SELECT r.name INTO _role
  FROM public.profiles p
  JOIN public.roles r ON r.id = p.role_id
  WHERE p.id = (event->>'user_id')::uuid;

  _claims := event->'claims';
  IF _role IS NOT NULL THEN
    _claims := jsonb_set(_claims, '{user_role}', to_jsonb(_role));
  ELSE
    _claims := jsonb_set(_claims, '{user_role}', '"customer"');
  END IF;

  RETURN jsonb_set(event, '{claims}', _claims);
END;
$$;

GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM anon, authenticated;
