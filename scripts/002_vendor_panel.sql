-- ============================================================
-- Vendor Panel Tables  (idempotent — safe to re-run)
-- ============================================================

-- vendor_stores: one store per vendor user
CREATE TABLE IF NOT EXISTS public.vendor_stores (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name          text NOT NULL,
  slug          text UNIQUE NOT NULL,
  description   text,
  logo_url      text,
  cover_url     text,
  location      text,
  is_active     boolean NOT NULL DEFAULT true,
  is_verified   boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.vendor_stores ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='vendor_stores' AND policyname='vendor_stores_select_all') THEN
    CREATE POLICY "vendor_stores_select_all"  ON public.vendor_stores FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='vendor_stores' AND policyname='vendor_stores_insert_own') THEN
    CREATE POLICY "vendor_stores_insert_own"  ON public.vendor_stores FOR INSERT WITH CHECK (auth.uid() = owner_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='vendor_stores' AND policyname='vendor_stores_update_own') THEN
    CREATE POLICY "vendor_stores_update_own"  ON public.vendor_stores FOR UPDATE USING (auth.uid() = owner_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='vendor_stores' AND policyname='vendor_stores_delete_own') THEN
    CREATE POLICY "vendor_stores_delete_own"  ON public.vendor_stores FOR DELETE USING (auth.uid() = owner_id);
  END IF;
END $$;

-- vendor_products
CREATE TABLE IF NOT EXISTS public.vendor_products (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id      uuid NOT NULL REFERENCES public.vendor_stores(id) ON DELETE CASCADE,
  name          text NOT NULL,
  description   text,
  price         numeric(10,2) NOT NULL,
  compare_price numeric(10,2),
  category      text,
  image_url     text,
  stock         integer NOT NULL DEFAULT 0,
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.vendor_products ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='vendor_products' AND policyname='vp_select_all') THEN
    CREATE POLICY "vp_select_all"   ON public.vendor_products FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='vendor_products' AND policyname='vp_mutate_owner') THEN
    CREATE POLICY "vp_mutate_owner" ON public.vendor_products FOR ALL USING (
      EXISTS (SELECT 1 FROM public.vendor_stores vs WHERE vs.id = store_id AND vs.owner_id = auth.uid())
    );
  END IF;
END $$;

-- vendor_orders
CREATE TABLE IF NOT EXISTS public.vendor_orders (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id        uuid NOT NULL REFERENCES public.vendor_stores(id) ON DELETE CASCADE,
  customer_name   text NOT NULL,
  customer_email  text NOT NULL,
  status          text NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','confirmed','shipped','delivered','cancelled','refunded')),
  total           numeric(10,2) NOT NULL,
  items_count     integer NOT NULL DEFAULT 1,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.vendor_orders ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='vendor_orders' AND policyname='vo_select_owner') THEN
    CREATE POLICY "vo_select_owner" ON public.vendor_orders FOR SELECT USING (
      EXISTS (SELECT 1 FROM public.vendor_stores vs WHERE vs.id = store_id AND vs.owner_id = auth.uid())
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='vendor_orders' AND policyname='vo_mutate_owner') THEN
    CREATE POLICY "vo_mutate_owner" ON public.vendor_orders FOR ALL USING (
      EXISTS (SELECT 1 FROM public.vendor_stores vs WHERE vs.id = store_id AND vs.owner_id = auth.uid())
    );
  END IF;
END $$;

-- vendor_reviews
CREATE TABLE IF NOT EXISTS public.vendor_reviews (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id      uuid NOT NULL REFERENCES public.vendor_stores(id) ON DELETE CASCADE,
  product_id    uuid REFERENCES public.vendor_products(id) ON DELETE SET NULL,
  reviewer_name text NOT NULL,
  rating        integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment       text,
  is_published  boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.vendor_reviews ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='vendor_reviews' AND policyname='vr_select_owner') THEN
    CREATE POLICY "vr_select_owner" ON public.vendor_reviews FOR SELECT USING (
      EXISTS (SELECT 1 FROM public.vendor_stores vs WHERE vs.id = store_id AND vs.owner_id = auth.uid())
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='vendor_reviews' AND policyname='vr_insert_any') THEN
    CREATE POLICY "vr_insert_any"   ON public.vendor_reviews FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='vendor_reviews' AND policyname='vr_update_owner') THEN
    CREATE POLICY "vr_update_owner" ON public.vendor_reviews FOR UPDATE USING (
      EXISTS (SELECT 1 FROM public.vendor_stores vs WHERE vs.id = store_id AND vs.owner_id = auth.uid())
    );
  END IF;
END $$;

-- vendor_traffic: daily page-view snapshots
CREATE TABLE IF NOT EXISTS public.vendor_traffic (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id        uuid NOT NULL REFERENCES public.vendor_stores(id) ON DELETE CASCADE,
  date            date NOT NULL,
  page_views      integer NOT NULL DEFAULT 0,
  unique_visitors integer NOT NULL DEFAULT 0,
  UNIQUE (store_id, date)
);

ALTER TABLE public.vendor_traffic ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='vendor_traffic' AND policyname='vt_select_owner') THEN
    CREATE POLICY "vt_select_owner" ON public.vendor_traffic FOR SELECT USING (
      EXISTS (SELECT 1 FROM public.vendor_stores vs WHERE vs.id = store_id AND vs.owner_id = auth.uid())
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='vendor_traffic' AND policyname='vt_mutate_owner') THEN
    CREATE POLICY "vt_mutate_owner" ON public.vendor_traffic FOR ALL USING (
      EXISTS (SELECT 1 FROM public.vendor_stores vs WHERE vs.id = store_id AND vs.owner_id = auth.uid())
    );
  END IF;
END $$;
