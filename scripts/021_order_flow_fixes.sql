-- 021_order_flow_fixes.sql
-- Links vendor_orders to parent orders, tracking, order numbers; customer RLS for vendor_orders.

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_number text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_order_number_unique
  ON public.orders (order_number)
  WHERE order_number IS NOT NULL;

ALTER TABLE public.vendor_orders ADD COLUMN IF NOT EXISTS order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE;
ALTER TABLE public.vendor_orders ADD COLUMN IF NOT EXISTS sub_order_id uuid REFERENCES public.order_vendor_sub_orders(id) ON DELETE SET NULL;
ALTER TABLE public.vendor_orders ADD COLUMN IF NOT EXISTS tracking_number text;

CREATE INDEX IF NOT EXISTS idx_vendor_orders_order_id ON public.vendor_orders(order_id);

DROP POLICY IF EXISTS "vendor_orders_select_customer" ON public.vendor_orders;
CREATE POLICY "vendor_orders_select_customer" ON public.vendor_orders
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = vendor_orders.order_id AND o.customer_id = auth.uid()
    )
  );
