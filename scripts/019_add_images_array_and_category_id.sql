-- 019: Add images array column to vendor_products
-- Stores multiple uploaded blob URLs per product.
-- image_url remains as the primary/first image for backwards compatibility.

ALTER TABLE vendor_products
  ADD COLUMN IF NOT EXISTS images text[] NOT NULL DEFAULT '{}';

-- Backfill: copy existing image_url into images[0] where images is empty
UPDATE vendor_products
  SET images = ARRAY[image_url]
  WHERE image_url IS NOT NULL
    AND (images IS NULL OR array_length(images, 1) IS NULL);

-- Add category column alias so both old (category) and new (category_id) work
-- The "category" column was the old name; vendor_products already has "category" text.
-- We just add category_id as a generated column alias if it doesn't exist already.
DO $$
BEGIN
  -- Only add category_id if it doesn't already exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendor_products' AND column_name = 'category_id'
  ) THEN
    ALTER TABLE vendor_products ADD COLUMN category_id text;
    UPDATE vendor_products SET category_id = category WHERE category_id IS NULL;
  END IF;
END $$;

-- Keep category and category_id in sync via trigger
CREATE OR REPLACE FUNCTION sync_category_id()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.category_id IS NOT NULL AND (NEW.category IS NULL OR NEW.category <> NEW.category_id) THEN
    NEW.category := NEW.category_id;
  END IF;
  IF NEW.category IS NOT NULL AND (NEW.category_id IS NULL OR NEW.category_id <> NEW.category) THEN
    NEW.category_id := NEW.category;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_category_id ON vendor_products;
CREATE TRIGGER trg_sync_category_id
  BEFORE INSERT OR UPDATE ON vendor_products
  FOR EACH ROW EXECUTE FUNCTION sync_category_id();
