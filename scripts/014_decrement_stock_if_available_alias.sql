-- =============================================================
-- 014_decrement_stock_if_available_alias.sql
--
-- Creates decrement_stock_if_available() as an alias for the
-- existing decrement_stock() function.
--
-- The saga already calls decrement_stock(); this alias allows new
-- callers (e.g. place-order route) to use the more explicit name
-- while both point to identical logic.
-- =============================================================

CREATE OR REPLACE FUNCTION public.decrement_stock_if_available(
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
  -- Acquire row-level lock; decrement only when stock is sufficient
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

GRANT EXECUTE ON FUNCTION public.decrement_stock_if_available(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decrement_stock_if_available(uuid, integer) TO service_role;

-- =============================================================
-- bulk_decrement_stock_if_available
--
-- Accepts an array of (product_id, quantity) pairs and tries to
-- decrement all of them inside a single transaction.
-- Returns a JSONB array of { product_id, success, stock_remaining }
-- so the caller knows exactly which items failed without doing N
-- round-trips.
-- =============================================================

DO $$ BEGIN
  CREATE TYPE stock_decrement_item AS (
    p_product_id uuid,
    p_quantity   integer
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION public.bulk_decrement_stock_if_available(
  p_items stock_decrement_item[]
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item       stock_decrement_item;
  v_affected   integer;
  v_stock_rem  integer;
  v_results    jsonb := '[]'::jsonb;
BEGIN
  FOREACH v_item IN ARRAY p_items LOOP
    UPDATE vendor_products
    SET    stock      = stock - v_item.p_quantity,
           updated_at = now()
    WHERE  id         = v_item.p_product_id
      AND  stock      >= v_item.p_quantity
      AND  is_active  = true;

    GET DIAGNOSTICS v_affected = ROW_COUNT;

    -- Read remaining stock (0 if the update didn't fire)
    SELECT COALESCE(stock, 0)
    INTO   v_stock_rem
    FROM   vendor_products
    WHERE  id = v_item.p_product_id;

    v_results := v_results || jsonb_build_object(
      'product_id',       v_item.p_product_id,
      'success',          (v_affected = 1),
      'stock_remaining',  v_stock_rem
    );
  END LOOP;

  RETURN v_results;
END;
$$;

GRANT EXECUTE ON FUNCTION public.bulk_decrement_stock_if_available(stock_decrement_item[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bulk_decrement_stock_if_available(stock_decrement_item[]) TO service_role;
