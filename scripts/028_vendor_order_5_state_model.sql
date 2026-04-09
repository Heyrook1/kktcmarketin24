-- 028_vendor_order_5_state_model.sql
-- Vendor order status model is reduced to 5 canonical states:
-- confirmed, shipped, exchange_requested, delivered, cancelled

BEGIN;

-- Backfill legacy statuses to canonical set.
UPDATE public.vendor_orders
SET status = CASE
  WHEN status IN ('pending', 'preparing') THEN 'confirmed'
  WHEN status = 'refunded' THEN 'exchange_requested'
  ELSE status
END
WHERE status IN ('pending', 'preparing', 'refunded');

-- Keep status history aligned for UI timelines.
UPDATE public.order_status_history
SET new_status = CASE
  WHEN new_status IN ('pending', 'preparing') THEN 'confirmed'
  WHEN new_status = 'refunded' THEN 'exchange_requested'
  ELSE new_status
END
WHERE new_status IN ('pending', 'preparing', 'refunded');

UPDATE public.order_status_history
SET old_status = CASE
  WHEN old_status IN ('pending', 'preparing') THEN 'confirmed'
  WHEN old_status = 'refunded' THEN 'exchange_requested'
  ELSE old_status
END
WHERE old_status IN ('pending', 'preparing', 'refunded');

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN (
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'vendor_orders'
      AND c.contype = 'c'
      AND pg_get_constraintdef(c.oid) ILIKE '%status%'
  ) LOOP
    EXECUTE format('ALTER TABLE public.vendor_orders DROP CONSTRAINT %I', r.conname);
  END LOOP;
END $$;

ALTER TABLE public.vendor_orders
  ADD CONSTRAINT vendor_orders_status_check
  CHECK (status IN ('confirmed', 'shipped', 'exchange_requested', 'delivered', 'cancelled'));

COMMIT;
