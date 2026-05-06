-- 030_structured_tag_prefixes.sql
-- Adds filter_tags TEXT[] column with GIN index for smart client-side filtering.
-- Prefix convention: gender:erkek | size:M | color:kırmızı | brand:nike | type:tişört | subtype:slim-fit
-- Existing tags column is kept untouched.

ALTER TABLE vendor_products ADD COLUMN IF NOT EXISTS filter_tags TEXT[] DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_vendor_products_filter_tags
  ON vendor_products USING GIN (filter_tags);

-- Backfill: convert flat tags into prefixed filter_tags.
-- Runs once; skip rows that already have non-empty filter_tags.
UPDATE vendor_products
SET filter_tags = ARRAY(
  SELECT
    CASE
      -- Known brands → brand:slug
      WHEN lower(t) = ANY(ARRAY[
        'nike','adidas','puma','reebok','zara','mango','lc-waikiki','bershka',
        'samsung','apple','xiaomi','huawei','oppo','nokia','sony','lg',
        'clinique','mac-cosmetics','loreal','philips','bosch','dyson'
      ]) THEN 'brand:' || lower(t)

      -- Gender signals → gender:value
      WHEN lower(t) IN ('erkek','erkek-giyim','men','bay','male')        THEN 'gender:erkek'
      WHEN lower(t) IN ('kadin','kadın','kadın-giyim','women','bayan','female') THEN 'gender:kadın'
      WHEN lower(t) IN ('unisex')                                         THEN 'gender:unisex'

      -- Letter sizes → size:UPPER
      WHEN lower(t) IN ('xs','s','m','l','xl','xxl','xxxl')              THEN 'size:' || upper(t)

      -- Numeric shoe/clothing sizes
      WHEN t ~ '^[3-5][0-9]$'                                            THEN 'size:' || t

      -- Pass other tags through unchanged
      ELSE t
    END
  FROM unnest(COALESCE(tags, '{}')) AS t
  WHERE t IS NOT NULL AND t <> ''
)
WHERE (filter_tags IS NULL OR filter_tags = '{}')
  AND array_length(tags, 1) > 0;
