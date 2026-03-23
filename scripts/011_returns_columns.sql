-- 011_returns_columns.sql
-- Adds missing columns to public.returns and a vendor-update RLS policy.
-- Safe to re-run (all changes use IF NOT EXISTS / IF NOT EXISTS guards).

-- ─── 1. Add columns required by the returns flow ────────────────────────────
ALTER TABLE public.returns
  ADD COLUMN IF NOT EXISTS customer_id       uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS description       text,          -- free-text from customer
  ADD COLUMN IF NOT EXISTS rejection_reason  text,          -- filled by vendor on reject
  ADD COLUMN IF NOT EXISTS updated_at        timestamptz DEFAULT now();

-- Index for vendor query (store_id + status)
CREATE INDEX IF NOT EXISTS idx_returns_store_status ON public.returns (store_id, status);
CREATE INDEX IF NOT EXISTS idx_returns_customer     ON public.returns (customer_id);
CREATE INDEX IF NOT EXISTS idx_returns_order        ON public.returns (order_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_returns_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_returns_updated_at ON public.returns;
CREATE TRIGGER trg_returns_updated_at
  BEFORE UPDATE ON public.returns
  FOR EACH ROW EXECUTE FUNCTION public.set_returns_updated_at();

-- ─── 2. Vendor update policy (approve / reject / complete) ──────────────────
DO $$
BEGIN
  DROP POLICY IF EXISTS ret_update_vendor ON public.returns;
END;
$$;

CREATE POLICY ret_update_vendor ON public.returns
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.vendor_stores vs
      WHERE vs.id = store_id AND vs.owner_id = auth.uid()
    )
  );

COMMENT ON TABLE public.returns IS
  'Customer return requests. Status flow: requested → approved | rejected → completed. '
  'customer_id mirrors orders.customer_id for direct RLS lookup. '
  'rejection_reason is written by vendor when status = rejected.';
