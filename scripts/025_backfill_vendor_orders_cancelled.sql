-- 025_backfill_vendor_orders_cancelled.sql
-- Müşteri iptali sonrası vendor_orders hâlâ pending kalan satırları düzeltir (order_id dolu ise).

UPDATE public.vendor_orders vo
SET status = 'cancelled',
    updated_at = now()
WHERE vo.status = 'pending'
  AND vo.order_id IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.order_status_history h
    WHERE h.order_id = vo.order_id
      AND h.new_status = 'cancelled'
      AND h.changed_by = 'customer'
  );
