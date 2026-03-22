-- 010_smart_links.sql
-- Smart Links: vendor-owned short URLs for Instagram/TikTok/social tracking.
-- smart_links  ← new table
-- smart_link_clicks ← already exists; we ADD the missing columns safely.
--
-- NOTE: The submitted schema referenced a "vendors" table which does not exist.
-- This migration uses vendor_stores.id as the vendor foreign key throughout,
-- matching the live schema. All new columns use IF NOT EXISTS guards so this
-- script is safe to re-run.

-- ─── 1. smart_links ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS smart_links (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id      uuid NOT NULL REFERENCES vendor_stores(id) ON DELETE CASCADE,
  link_token    text UNIQUE NOT NULL,          -- e.g. "km-abc123"
  link_type     text NOT NULL
                  CHECK (link_type IN ('store', 'product', 'campaign')),
  product_id    uuid REFERENCES vendor_products(id) ON DELETE SET NULL,
  campaign_name text,
  source        text,                          -- instagram_bio, tiktok, etc.
  short_url     text,                          -- kktc.marketin24.com/r/km-abc123
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_smart_links_store     ON smart_links (store_id);
CREATE INDEX IF NOT EXISTS idx_smart_links_token     ON smart_links (link_token);
CREATE INDEX IF NOT EXISTS idx_smart_links_active    ON smart_links (is_active, store_id);
CREATE INDEX IF NOT EXISTS idx_smart_links_created   ON smart_links (created_at DESC);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION set_smart_links_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_smart_links_updated_at ON smart_links;
CREATE TRIGGER trg_smart_links_updated_at
  BEFORE UPDATE ON smart_links
  FOR EACH ROW EXECUTE FUNCTION set_smart_links_updated_at();

-- RLS
ALTER TABLE smart_links ENABLE ROW LEVEL SECURITY;

-- Vendors manage their own links
CREATE POLICY sl_select_vendor ON smart_links
  FOR SELECT USING (
    store_id IN (
      SELECT id FROM vendor_stores WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY sl_insert_vendor ON smart_links
  FOR INSERT WITH CHECK (
    store_id IN (
      SELECT id FROM vendor_stores WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY sl_update_vendor ON smart_links
  FOR UPDATE USING (
    store_id IN (
      SELECT id FROM vendor_stores WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY sl_delete_vendor ON smart_links
  FOR DELETE USING (
    store_id IN (
      SELECT id FROM vendor_stores WHERE owner_id = auth.uid()
    )
  );

-- Service role full access (API routes use service key)
CREATE POLICY sl_service_all ON smart_links
  FOR ALL USING (true) WITH CHECK (true);

COMMENT ON TABLE smart_links IS
  'Short/trackable URLs generated per vendor for Instagram bio, TikTok, etc. '
  'Each link_token maps to a store, product, or campaign. '
  'Click tracking is recorded in smart_link_clicks.';

-- ─── 2. smart_link_clicks — add missing columns ──────────────────────────────
-- The table already exists with: id, store_id, product_id, converted,
-- session_id, ip_hash, utm_*, order_id, created_at, campaign_name, conversion_type
-- We ADD the columns from the spec that are absent.

ALTER TABLE smart_link_clicks
  ADD COLUMN IF NOT EXISTS link_id          uuid REFERENCES smart_links(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS product_viewed   text[],        -- products seen during session
  ADD COLUMN IF NOT EXISTS session_duration integer,       -- seconds on site
  ADD COLUMN IF NOT EXISTS user_agent       text;

-- Index new FK for analytics joins
CREATE INDEX IF NOT EXISTS idx_slc_link_id ON smart_link_clicks (link_id);

-- Update the existing RLS vendor-select policy comment (no structural change needed)
COMMENT ON TABLE smart_link_clicks IS
  'One row per visit originating from a smart_link. '
  'Anonymised: no raw IP stored (ip_hash only). '
  'Joined to smart_links via link_id for per-campaign analytics.';

-- ─── 3. Helper view for vendor analytics dashboard ───────────────────────────

CREATE OR REPLACE VIEW smart_link_stats AS
SELECT
  sl.id                                    AS link_id,
  sl.store_id,
  sl.link_token,
  sl.link_type,
  sl.campaign_name,
  sl.source,
  sl.short_url,
  sl.is_active,
  sl.created_at,
  COUNT(slc.id)                            AS total_clicks,
  COUNT(slc.id) FILTER (
    WHERE slc.created_at >= now() - interval '7 days'
  )                                        AS clicks_7d,
  COUNT(slc.id) FILTER (
    WHERE slc.converted = true
  )                                        AS conversions,
  ROUND(
    COUNT(slc.id) FILTER (WHERE slc.converted = true)::numeric
    / NULLIF(COUNT(slc.id), 0) * 100, 1
  )                                        AS conversion_rate_pct,
  ROUND(AVG(slc.session_duration))         AS avg_session_seconds
FROM smart_links sl
LEFT JOIN smart_link_clicks slc ON slc.link_id = sl.id
GROUP BY sl.id;

COMMENT ON VIEW smart_link_stats IS
  'Per-link aggregated click/conversion analytics. '
  'Used by the vendor dashboard analytics panel.';
