-- 016_normalize_product_categories.sql
-- Normalizes the `category` column on vendor_products to canonical slug values
-- so the products-content.tsx filter (which compares against URL slugs like
-- "electronics", "fashion", etc.) always finds a match.

UPDATE vendor_products SET category = 'electronics'
WHERE LOWER(TRIM(category)) IN (
  'elektronik','electronic','electronics','teknoloji','technology',
  'tech','ηλεκτρονικά','τεχνολογία'
);

UPDATE vendor_products SET category = 'fashion'
WHERE LOWER(TRIM(category)) IN (
  'moda','giyim','kıyafet','kiyafet','fashion','clothing','apparel',
  'μόδα','ρούχα','ενδύματα'
);

UPDATE vendor_products SET category = 'home-garden'
WHERE LOWER(TRIM(category)) IN (
  'ev','ev & bahçe','ev & bahce','ev ve bahçe','ev ve bahce',
  'bahçe','bahce','mobilya','furniture','home','garden','home-garden',
  'σπίτι','κήπος'
);

UPDATE vendor_products SET category = 'beauty'
WHERE LOWER(TRIM(category)) IN (
  'güzellik','guzellik','kozmetik','beauty','cosmetics',
  'ομορφιά','καλλυντικά'
);

UPDATE vendor_products SET category = 'sports'
WHERE LOWER(TRIM(category)) IN (
  'spor','spor & outdoor','spor ve outdoor','fitness','sport','sports',
  'athletics','αθλητισμός','αθλητικά'
);

UPDATE vendor_products SET category = 'kids-baby'
WHERE LOWER(TRIM(category)) IN (
  'çocuk','cocuk','çocuk & bebek','cocuk & bebek','bebek','kids',
  'baby','children','kids-baby','παιδιά','βρέφος'
);

UPDATE vendor_products SET category = 'jewelry'
WHERE LOWER(TRIM(category)) IN (
  'takı','taki','takı & aksesuar','taki & aksesuar','aksesuar',
  'mücevher','mucevher','jewelry','jewellery','κοσμήματα'
);

UPDATE vendor_products SET category = 'groceries'
WHERE LOWER(TRIM(category)) IN (
  'market','market & gıda','market & gida','gıda','gida',
  'yiyecek','food','grocery','groceries','τρόφιμα','αγορά'
);

UPDATE vendor_products SET category = 'health'
WHERE LOWER(TRIM(category)) IN (
  'sağlık','saglik','sağlık & wellness','saglik & wellness',
  'wellness','health','υγεία'
);

UPDATE vendor_products SET category = 'books'
WHERE LOWER(TRIM(category)) IN (
  'kitap','kitap & kırtasiye','kitap & kirtasiye','kırtasiye','kirtasiye',
  'book','books','βιβλίο','βιβλία'
);

-- Add a DB-level check constraint so future inserts can only use canonical slugs
-- (uses ALTER TABLE ... ADD CONSTRAINT with IF NOT EXISTS via DO block)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'vendor_products_category_slug_check'
  ) THEN
    ALTER TABLE vendor_products
      ADD CONSTRAINT vendor_products_category_slug_check
      CHECK (category IN (
        'electronics','fashion','home-garden','beauty','sports',
        'kids-baby','jewelry','groceries','health','books'
      ) OR category IS NULL);
  END IF;
END $$;

-- Create an index on category for fast sidebar filter queries
CREATE INDEX IF NOT EXISTS vendor_products_category_idx
  ON vendor_products (category)
  WHERE is_active = true;
