-- 017_fix_categories_and_search_tags.sql
-- Definitively normalizes vendor_products.category to canonical slugs,
-- adds a search_tags text column for multilingual matching, and rebuilds
-- the search_vector tsvector to include all searchable fields.

-- ── Step 1: Normalize category to canonical slug ──────────────────────────
UPDATE vendor_products SET category = CASE
  WHEN lower(trim(category)) IN ('elektronik','electro','electronic','electronics','teknoloji','technology','tech','ηλεκτρονικά','τεχνολογία') THEN 'electronics'
  WHEN lower(trim(category)) IN ('moda','fashion','giyim','kıyafet','kiyafet','clothing','apparel','ρούχα','ενδύματα','μόδα') THEN 'fashion'
  WHEN lower(trim(category)) IN ('güzellik','guzellik','beauty','kozmetik','cosmetics','ομορφιά','καλλυντικά') THEN 'beauty'
  WHEN lower(trim(category)) IN ('spor','sports','sport','fitness','outdoor','αθλητισμός','αθλητικά') THEN 'sports'
  WHEN lower(trim(category)) IN ('ev','ev & bahçe','ev & bahce','ev-bahce','ev-bahçe','home','home-garden','garden','bahçe','bahce','mobilya','furniture','σπίτι','κήπος') THEN 'home-garden'
  WHEN lower(trim(category)) IN ('çocuk','cocuk','bebek','kids','baby','kids-baby','children','παιδιά','βρέφος') THEN 'kids-baby'
  WHEN lower(trim(category)) IN ('market','gıda','gida','food','grocery','groceries','τρόφιμα','αγορά') THEN 'groceries'
  WHEN lower(trim(category)) IN ('sağlık','saglik','health','wellness','υγεία') THEN 'health'
  WHEN lower(trim(category)) IN ('kitap','book','books','βιβλίο','βιβλία','kırtasiye','kirtasiye') THEN 'books'
  WHEN lower(trim(category)) IN ('takı','taki','mücevher','mucevher','jewelry','jewellery','aksesuar','κοσμήματα') THEN 'jewelry'
  ELSE category  -- leave as-is if already canonical or unknown
END
WHERE category IS NOT NULL
  AND lower(trim(category)) NOT IN (
    'electronics','fashion','beauty','sports','home-garden',
    'kids-baby','groceries','health','books','jewelry'
  );

-- ── Step 2: Add search_tags column for multilingual full-text matching ─────
-- This column stores a flat string of TR + EN + CY aliases so the search
-- vector covers all three languages without changing the product name/desc.
ALTER TABLE vendor_products ADD COLUMN IF NOT EXISTS search_tags text GENERATED ALWAYS AS (
  CASE category
    WHEN 'electronics'  THEN 'elektronik teknoloji electronic technology ηλεκτρονικά τεχνολογία'
    WHEN 'fashion'      THEN 'moda giyim kıyafet fashion clothing ρούχα ενδύματα μόδα'
    WHEN 'beauty'       THEN 'güzellik kozmetik beauty cosmetics ομορφιά καλλυντικά'
    WHEN 'sports'       THEN 'spor fitness outdoor sports αθλητισμός αθλητικά'
    WHEN 'home-garden'  THEN 'ev bahçe mobilya home garden furniture σπίτι κήπος'
    WHEN 'kids-baby'    THEN 'çocuk bebek kids baby children παιδιά βρέφος'
    WHEN 'groceries'    THEN 'market gıda yiyecek food grocery τρόφιμα αγορά'
    WHEN 'health'       THEN 'sağlık wellness health υγεία'
    WHEN 'books'        THEN 'kitap kırtasiye book books βιβλίο βιβλία'
    WHEN 'jewelry'      THEN 'takı mücevher jewelry jewellery κοσμήματα'
    ELSE ''
  END
) STORED;

-- ── Step 3: Rebuild search_vector to include search_tags ──────────────────
-- Drop the existing trigger if any, recreate with search_tags included.
CREATE OR REPLACE FUNCTION update_vendor_product_search_vector()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('simple', coalesce(NEW.name, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(NEW.category, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(NEW.description, '')), 'C') ||
    setweight(to_tsvector('simple', coalesce(array_to_string(NEW.tags, ' '), '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(NEW.search_tags, '')), 'C');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_vendor_product_search_vector ON vendor_products;
CREATE TRIGGER trg_vendor_product_search_vector
  BEFORE INSERT OR UPDATE ON vendor_products
  FOR EACH ROW EXECUTE FUNCTION update_vendor_product_search_vector();

-- Backfill search_vector for all existing rows
UPDATE vendor_products SET updated_at = now()
WHERE id IN (SELECT id FROM vendor_products LIMIT 10000);

-- ── Step 4: Index for fast category filtering ─────────────────────────────
DROP INDEX IF EXISTS idx_vendor_products_category_active;
CREATE INDEX idx_vendor_products_category_active
  ON vendor_products (category, is_active)
  WHERE is_active = true;

-- ── Step 5: Verify results ────────────────────────────────────────────────
SELECT category, count(*) as product_count
FROM vendor_products
WHERE is_active = true
GROUP BY category
ORDER BY product_count DESC;
