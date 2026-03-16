-- =============================================================================
-- 005_saga_orders.sql
-- Multi-vendor Saga: parent orders, vendor sub-orders, outbox events
-- =============================================================================

-- ── 1. Parent orders ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.orders (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name    text NOT NULL,
  customer_email   text NOT NULL,
  customer_phone   text,
  delivery_address jsonb NOT NULL DEFAULT '{}',

  -- Saga orchestration state
  saga_status      text NOT NULL DEFAULT 'pending'
    CHECK (saga_status IN ('pending','processing','completed','compensating','failed')),

  -- Server-computed financials (client values never trusted)
  subtotal         numeric(12,2) NOT NULL DEFAULT 0,
  discount_amount  numeric(12,2) NOT NULL DEFAULT 0,
  shipping_fee     numeric(12,2) NOT NULL DEFAULT 0,
  total            numeric(12,2) NOT NULL DEFAULT 0,
  coupon_code      text,

  -- Payment
  payment_status   text NOT NULL DEFAULT 'pending'
    CHECK (payment_status IN ('pending','paid','failed','refunded')),
  payment_ref      text,

  cart_id          text,           -- Redis cart key used for reservations
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- ── 2. Vendor sub-orders (one per vendor in the cart) ────────────────────────
CREATE TABLE IF NOT EXISTS public.order_vendor_sub_orders (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  store_id      uuid NOT NULL REFERENCES public.vendor_stores(id),
  store_name    text NOT NULL,

  -- Saga step state
  step_status   text NOT NULL DEFAULT 'pending'
    CHECK (step_status IN ('pending','stock_reserved','completed','compensated','failed')),

  subtotal      numeric(12,2) NOT NULL DEFAULT 0,
  items         jsonb NOT NULL DEFAULT '[]',  -- snapshot of line items
  notes         text,

  -- Compensating action tracking
  compensated_at  timestamptz,
  compensation_reason text,

  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ── 3. Order line items (immutable snapshot at checkout time) ─────────────────
CREATE TABLE IF NOT EXISTS public.order_items (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id       uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  sub_order_id   uuid NOT NULL REFERENCES public.order_vendor_sub_orders(id) ON DELETE CASCADE,
  product_id     uuid,               -- nullable: product may be deleted later
  product_name   text NOT NULL,
  store_id       uuid NOT NULL,
  quantity       integer NOT NULL CHECK (quantity > 0),
  unit_price     numeric(12,2) NOT NULL, -- DB price at time of checkout
  line_total     numeric(12,2) NOT NULL,
  image_url      text,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- ── 4. Outbox table (reliable async vendor notification) ─────────────────────
-- Events are written transactionally with sub-order creation.
-- A worker polls this table and publishes to the vendor queue.
CREATE TABLE IF NOT EXISTS public.outbox_events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aggregate_type  text NOT NULL,           -- 'order' | 'sub_order'
  aggregate_id    uuid NOT NULL,
  event_type      text NOT NULL,           -- 'vendor.order.created' | 'vendor.order.compensated'
  payload         jsonb NOT NULL DEFAULT '{}',
  status          text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','processing','published','failed')),
  attempts        integer NOT NULL DEFAULT 0,
  last_error      text,
  scheduled_at    timestamptz NOT NULL DEFAULT now(),
  published_at    timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_outbox_pending
  ON public.outbox_events (status, scheduled_at)
  WHERE status IN ('pending','failed');

CREATE INDEX IF NOT EXISTS idx_order_items_order   ON public.order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_sub     ON public.order_items (sub_order_id);
CREATE INDEX IF NOT EXISTS idx_sub_orders_order    ON public.order_vendor_sub_orders (order_id);
CREATE INDEX IF NOT EXISTS idx_sub_orders_store    ON public.order_vendor_sub_orders (store_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer     ON public.orders (customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_saga_status  ON public.orders (saga_status);

-- ── 5. Updated_at triggers ───────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS orders_set_updated_at ON public.orders;
CREATE TRIGGER orders_set_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS sub_orders_set_updated_at ON public.order_vendor_sub_orders;
CREATE TRIGGER sub_orders_set_updated_at
  BEFORE UPDATE ON public.order_vendor_sub_orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── 6. RLS ───────────────────────────────────────────────────────────────────
ALTER TABLE public.orders                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_vendor_sub_orders   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outbox_events             ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN

  -- Customers see only their own orders
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'orders_select_own' AND tablename = 'orders') THEN
    CREATE POLICY orders_select_own ON public.orders FOR SELECT
      USING (auth.uid() = customer_id);
  END IF;

  -- Service role full access on orders
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'orders_service_all' AND tablename = 'orders') THEN
    CREATE POLICY orders_service_all ON public.orders FOR ALL TO service_role
      USING (true) WITH CHECK (true);
  END IF;

  -- Vendors see sub-orders for their store
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'sub_orders_select_vendor' AND tablename = 'order_vendor_sub_orders') THEN
    CREATE POLICY sub_orders_select_vendor ON public.order_vendor_sub_orders FOR SELECT
      USING (store_id IN (SELECT id FROM public.vendor_stores WHERE owner_id = auth.uid()));
  END IF;

  -- Service role full access on sub-orders
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'sub_orders_service_all' AND tablename = 'order_vendor_sub_orders') THEN
    CREATE POLICY sub_orders_service_all ON public.order_vendor_sub_orders FOR ALL TO service_role
      USING (true) WITH CHECK (true);
  END IF;

  -- Customers see their own order items
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'order_items_select_own' AND tablename = 'order_items') THEN
    CREATE POLICY order_items_select_own ON public.order_items FOR SELECT
      USING (order_id IN (SELECT id FROM public.orders WHERE customer_id = auth.uid()));
  END IF;

  -- Service role full access on order items
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'order_items_service_all' AND tablename = 'order_items') THEN
    CREATE POLICY order_items_service_all ON public.order_items FOR ALL TO service_role
      USING (true) WITH CHECK (true);
  END IF;

  -- Outbox: service_role only
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'outbox_service_all' AND tablename = 'outbox_events') THEN
    CREATE POLICY outbox_service_all ON public.outbox_events FOR ALL TO service_role
      USING (true) WITH CHECK (true);
  END IF;

END $$;
