-- 024_vendor_order_status_workflow.sql
-- Satıcı sipariş durumları: preparing, exchange_requested

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

ALTER TABLE public.vendor_orders ADD CONSTRAINT vendor_orders_status_check
  CHECK (status IN (
    'pending',
    'confirmed',
    'preparing',
    'shipped',
    'exchange_requested',
    'delivered',
    'cancelled',
    'refunded'
  ));
