-- Migration 020: product view tracking
-- Creates product_views table and increment_product_views RPC

-- 1. views table (one row per anonymous view event)
CREATE TABLE IF NOT EXISTS product_views (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid        NOT NULL REFERENCES vendor_products(id) ON DELETE CASCADE,
  store_id   uuid        NOT NULL,
  viewed_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_views_product ON product_views(product_id);
CREATE INDEX IF NOT EXISTS idx_product_views_store   ON product_views(store_id);
CREATE INDEX IF NOT EXISTS idx_product_views_date    ON product_views(viewed_at);

-- 2. view_count denorm column on vendor_products for fast card display
ALTER TABLE vendor_products ADD COLUMN IF NOT EXISTS view_count integer NOT NULL DEFAULT 0;

-- 3. RPC to atomically increment — called server-side on each product page load
CREATE OR REPLACE FUNCTION increment_product_views(product_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE vendor_products
  SET    view_count = view_count + 1
  WHERE  id = product_id;
END;
$$;

-- 4. RLS: anyone can insert a view, only the store owner can read them
ALTER TABLE product_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "insert_product_view" ON product_views;
CREATE POLICY "insert_product_view"
  ON product_views FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "store_reads_own_views" ON product_views;
CREATE POLICY "store_reads_own_views"
  ON product_views FOR SELECT
  USING (
    store_id IN (
      SELECT id FROM vendor_stores WHERE owner_id = auth.uid()
    )
  );
