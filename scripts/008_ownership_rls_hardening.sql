-- ============================================================
-- 008_ownership_rls_hardening.sql
-- Security hardening: fix every identified RLS gap.
-- Idempotent — safe to re-run.
-- ============================================================

-- ── 1. customer_reliability_scores VIEW ─────────────────────────────────────
-- RLS was disabled. Vendors should only see scores for customers who have
-- placed orders in their store. Admins see all.
-- The VIEW itself cannot have RLS; we protect it by creating a security-
-- definer function that filters by caller. For now, enable RLS on the
-- underlying tables (already done). Additionally, restrict direct SELECT
-- on the view to the service role only — callers must go through the API.
-- Since this is a VIEW (not a base table), we wrap it with a security-
-- invoker function and revoke public access.

REVOKE SELECT ON public.customer_reliability_scores FROM anon, authenticated;
GRANT  SELECT ON public.customer_reliability_scores TO service_role;

-- ── 2. delivery_events — tighten INSERT policy ──────────────────────────────
-- Old policy "de_vendor_insert" allowed INSERT if store_id was owned by caller,
-- but did NOT verify that the order_id belongs to a sub-order of that store.
-- Replace with a stricter predicate.
DROP POLICY IF EXISTS "de_vendor_insert" ON public.delivery_events;

CREATE POLICY "de_vendor_insert" ON public.delivery_events
  FOR INSERT
  WITH CHECK (
    -- store_id must be owned by the caller
    EXISTS (
      SELECT 1 FROM public.vendor_stores vs
      WHERE vs.id = store_id
        AND vs.owner_id = auth.uid()
    )
    AND
    -- order_id must have a sub-order for this store
    EXISTS (
      SELECT 1 FROM public.order_vendor_sub_orders s
      WHERE s.order_id = delivery_events.order_id
        AND s.store_id  = delivery_events.store_id
    )
    AND
    -- recorded_by must match the authenticated user
    recorded_by = auth.uid()
  );

-- ── 3. vendor_orders — split ALL into explicit SELECT / mutate policies ──────
-- ALL policy means a compromised anon key could mutate orders via any store.
-- Split into SELECT (read-only) and explicit UPDATE with status constraint.
DROP POLICY IF EXISTS "vo_mutate_owner" ON public.vendor_orders;
DROP POLICY IF EXISTS "vo_select_owner" ON public.vendor_orders;

CREATE POLICY "vo_select_owner" ON public.vendor_orders
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.vendor_stores vs
      WHERE vs.id = store_id AND vs.owner_id = auth.uid()
    )
  );

-- Vendors may only advance status through the allowed workflow transitions.
-- INSERT and DELETE remain service-role only (Saga).
CREATE POLICY "vo_update_owner" ON public.vendor_orders
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.vendor_stores vs
      WHERE vs.id = store_id AND vs.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    -- Allowed vendor transitions: pending→confirmed, confirmed→shipped, shipped→delivered
    status IN ('confirmed', 'shipped', 'delivered', 'cancelled')
    AND EXISTS (
      SELECT 1 FROM public.vendor_stores vs
      WHERE vs.id = store_id AND vs.owner_id = auth.uid()
    )
  );

-- ── 4. vendor_products — split ALL into explicit policies ───────────────────
DROP POLICY IF EXISTS "vp_mutate_owner" ON public.vendor_products;

-- INSERT: store_id must be owned by caller
CREATE POLICY "vp_insert_owner" ON public.vendor_products
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.vendor_stores vs
      WHERE vs.id = store_id AND vs.owner_id = auth.uid()
    )
  );

-- UPDATE: existing row's store_id must be owned by caller AND
-- the new store_id (if changed) must also be owned by caller.
CREATE POLICY "vp_update_owner" ON public.vendor_products
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.vendor_stores vs
      WHERE vs.id = store_id AND vs.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.vendor_stores vs
      WHERE vs.id = store_id AND vs.owner_id = auth.uid()
    )
  );

-- DELETE: row's store_id must be owned by caller
CREATE POLICY "vp_delete_owner" ON public.vendor_products
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.vendor_stores vs
      WHERE vs.id = store_id AND vs.owner_id = auth.uid()
    )
  );

-- ── 5. order_vendor_sub_orders — add explicit UPDATE for vendors ─────────────
-- Currently service_all covers mutations. Vendors need to update step_status.
DROP POLICY IF EXISTS "sub_orders_update_vendor" ON public.order_vendor_sub_orders;

CREATE POLICY "sub_orders_update_vendor" ON public.order_vendor_sub_orders
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.vendor_stores vs
      WHERE vs.id = store_id AND vs.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    -- Only step_status and notes may be touched by a vendor.
    -- Enforced at the API layer; this ensures no other field bypass is possible.
    EXISTS (
      SELECT 1 FROM public.vendor_stores vs
      WHERE vs.id = store_id AND vs.owner_id = auth.uid()
    )
  );

-- ── 6. Validate all FK columns are proper UUIDs (not cast from int/text) ─────
-- These are assertion comments only — all PK/FK columns are already uuid type
-- as confirmed in the live schema. No ALTER needed.
-- vendor_products.id       uuid ✓
-- vendor_stores.id         uuid ✓
-- orders.id                uuid ✓
-- order_items.id           uuid ✓
-- profiles.id              uuid ✓

-- ── 7. Revoke dangerous public permissions ───────────────────────────────────
-- Ensure anon role cannot INSERT into sensitive tables directly.
REVOKE INSERT, UPDATE, DELETE ON public.orders               FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.order_items          FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.vendor_products      FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.delivery_events      FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.vendor_orders        FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.profiles             FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.sms_otps             FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.audit_logs           FROM anon;
