-- ============================================================
-- Atomic stock decrement function
-- Returns TRUE if the decrement succeeded (stock was available),
-- FALSE if the product was out of stock or not found.
-- Uses FOR UPDATE row lock to prevent race conditions.
-- ============================================================

CREATE OR REPLACE FUNCTION public.decrement_stock(
  p_product_id uuid,
  p_quantity    integer DEFAULT 1
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_affected integer;
BEGIN
  -- Lock the row and decrement only if enough stock exists
  UPDATE vendor_products
  SET    stock      = stock - p_quantity,
         updated_at = now()
  WHERE  id         = p_product_id
    AND  stock      >= p_quantity
    AND  is_active  = true;

  GET DIAGNOSTICS v_affected = ROW_COUNT;
  RETURN v_affected = 1;
END;
$$;

-- Allow authenticated users (checkout) and service role to call it
GRANT EXECUTE ON FUNCTION public.decrement_stock(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decrement_stock(uuid, integer) TO service_role;

-- ============================================================
-- Restore stock (used when an order is cancelled / item removed
-- before the order is confirmed).
-- ============================================================

CREATE OR REPLACE FUNCTION public.restore_stock(
  p_product_id uuid,
  p_quantity    integer DEFAULT 1
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE vendor_products
  SET    stock      = stock + p_quantity,
         updated_at = now()
  WHERE  id         = p_product_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.restore_stock(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.restore_stock(uuid, integer) TO service_role;
