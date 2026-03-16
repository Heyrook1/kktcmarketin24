-- ── 007_reliability.sql ──────────────────────────────────────────────────────
-- Customer reliability scoring system
-- Tables: delivery_events, secondary_verifications
-- View:   customer_reliability_scores (computed, not stored — always fresh)
-- Column: profiles.secondary_verification_required (boolean)
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. delivery_events — vendor records every meaningful delivery outcome
CREATE TABLE IF NOT EXISTS public.delivery_events (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id       uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  store_id       uuid NOT NULL REFERENCES public.vendor_stores(id),
  customer_id    uuid NOT NULL REFERENCES auth.users(id),
  event_type     text NOT NULL,  -- 'confirmed' | 'delivered' | 'cancelled_after_dispatch' | 'door_refused'
  notes          text,
  recorded_by    uuid REFERENCES auth.users(id),
  created_at     timestamp with time zone DEFAULT now()
);

-- Prevent duplicate event types per order per store
CREATE UNIQUE INDEX IF NOT EXISTS delivery_events_order_store_type
  ON public.delivery_events(order_id, store_id, event_type);

CREATE INDEX IF NOT EXISTS delivery_events_customer ON public.delivery_events(customer_id);
CREATE INDEX IF NOT EXISTS delivery_events_created  ON public.delivery_events(created_at);

-- 2. secondary_verifications — tracks secondary channel verifications
CREATE TABLE IF NOT EXISTS public.secondary_verifications (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  method          text NOT NULL DEFAULT 'email_link',  -- 'email_link' | 'id_document' | 'manual_admin'
  verified_at     timestamp with time zone,
  token_hash      text,
  expires_at      timestamp with time zone,
  created_at      timestamp with time zone DEFAULT now(),
  reviewed_by     uuid REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS secondary_verif_user ON public.secondary_verifications(user_id);

-- 3. Add secondary_verification_required column to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS secondary_verification_required boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS failed_delivery_count           integer NOT NULL DEFAULT 0;

-- 4. customer_reliability_scores view
-- Score = 100 to 0.  Start at 100, subtract per negative event.
-- Penalties: door_refused = -20, cancelled_after_dispatch = -15, no_show = -10
-- Bonus: delivered = +0 (no penalty is reward enough)
-- Tier: Excellent ≥ 80 | Good 60-79 | Fair 40-59 | Poor < 40
CREATE OR REPLACE VIEW public.customer_reliability_scores AS
SELECT
  p.id                                        AS customer_id,
  p.full_name,
  p.phone,
  p.no_show_count,
  p.failed_delivery_count,
  p.flagged_at,
  p.secondary_verification_required,

  -- Raw event counts
  COALESCE(de_counts.confirmed,  0)           AS confirmed_orders,
  COALESCE(de_counts.delivered,  0)           AS successful_deliveries,
  COALESCE(de_counts.door_refused, 0)         AS door_refusals,
  COALESCE(de_counts.cancelled_after_dispatch, 0) AS cancellations_after_dispatch,

  -- Total orders placed (from orders table, OTP-verified only)
  COALESCE(ord_counts.total_orders, 0)        AS total_orders,

  -- Computed score (floored at 0)
  GREATEST(0,
    100
    - (COALESCE(de_counts.door_refused, 0)               * 20)
    - (COALESCE(de_counts.cancelled_after_dispatch, 0)   * 15)
    - (COALESCE(p.no_show_count, 0)                      * 10)
  )                                           AS score,

  -- Tier label
  CASE
    WHEN GREATEST(0,
      100
      - (COALESCE(de_counts.door_refused, 0)             * 20)
      - (COALESCE(de_counts.cancelled_after_dispatch, 0) * 15)
      - (COALESCE(p.no_show_count, 0)                    * 10)
    ) >= 80 THEN 'excellent'
    WHEN GREATEST(0,
      100
      - (COALESCE(de_counts.door_refused, 0)             * 20)
      - (COALESCE(de_counts.cancelled_after_dispatch, 0) * 15)
      - (COALESCE(p.no_show_count, 0)                    * 10)
    ) >= 60 THEN 'good'
    WHEN GREATEST(0,
      100
      - (COALESCE(de_counts.door_refused, 0)             * 20)
      - (COALESCE(de_counts.cancelled_after_dispatch, 0) * 15)
      - (COALESCE(p.no_show_count, 0)                    * 10)
    ) >= 40 THEN 'fair'
    ELSE 'poor'
  END                                         AS tier
FROM public.profiles p
LEFT JOIN (
  SELECT
    customer_id,
    COUNT(*) FILTER (WHERE event_type = 'confirmed')               AS confirmed,
    COUNT(*) FILTER (WHERE event_type = 'delivered')               AS delivered,
    COUNT(*) FILTER (WHERE event_type = 'door_refused')            AS door_refused,
    COUNT(*) FILTER (WHERE event_type = 'cancelled_after_dispatch') AS cancelled_after_dispatch
  FROM public.delivery_events
  GROUP BY customer_id
) de_counts ON de_counts.customer_id = p.id
LEFT JOIN (
  SELECT customer_id, COUNT(*) AS total_orders
  FROM public.orders
  WHERE otp_verified_at IS NOT NULL
  GROUP BY customer_id
) ord_counts ON ord_counts.customer_id = p.id;

-- 5. RLS
ALTER TABLE public.delivery_events           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.secondary_verifications   ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'de_service_all' AND tablename = 'delivery_events') THEN
    CREATE POLICY de_service_all ON public.delivery_events FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'de_vendor_select' AND tablename = 'delivery_events') THEN
    CREATE POLICY de_vendor_select ON public.delivery_events FOR SELECT
      USING (store_id IN (SELECT id FROM public.vendor_stores WHERE owner_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'de_vendor_insert' AND tablename = 'delivery_events') THEN
    CREATE POLICY de_vendor_insert ON public.delivery_events FOR INSERT
      WITH CHECK (store_id IN (SELECT id FROM public.vendor_stores WHERE owner_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'sv_service_all' AND tablename = 'secondary_verifications') THEN
    CREATE POLICY sv_service_all ON public.secondary_verifications FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'sv_select_own' AND tablename = 'secondary_verifications') THEN
    CREATE POLICY sv_select_own ON public.secondary_verifications FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

-- Grant view to authenticated role
GRANT SELECT ON public.customer_reliability_scores TO authenticated;
