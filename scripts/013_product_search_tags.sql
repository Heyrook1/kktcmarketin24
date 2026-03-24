-- 013_product_search_tags.sql
-- Adds tags array + tsvector full-text search to vendor_products

-- 1. tags column
ALTER TABLE vendor_products
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_vendor_products_tags
  ON vendor_products USING GIN(tags);

-- 2. search_vector column
ALTER TABLE vendor_products
  ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- 3. Trigger function to auto-update search_vector
CREATE OR REPLACE FUNCTION update_product_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('simple', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('simple', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('simple', COALESCE(array_to_string(NEW.tags, ' '), '')), 'A');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS vendor_products_search_vector_update ON vendor_products;

CREATE TRIGGER vendor_products_search_vector_update
  BEFORE INSERT OR UPDATE ON vendor_products
  FOR EACH ROW EXECUTE FUNCTION update_product_search_vector();

-- 4. GIN index on search_vector
CREATE INDEX IF NOT EXISTS idx_vendor_products_search
  ON vendor_products USING GIN(search_vector);

-- 5. Back-fill search_vector for existing rows
UPDATE vendor_products SET name = name;
