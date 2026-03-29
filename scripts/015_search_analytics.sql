-- 015_search_analytics.sql
-- Stores every user search event for analytics (trending queries, zero-result
-- tracking, language breakdown, conversion attribution).

CREATE TABLE IF NOT EXISTS search_analytics (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    timestamptz NOT NULL    DEFAULT now(),

  -- The raw query string as typed by the user
  query         text        NOT NULL,

  -- Detected language: 'tr' | 'en' | 'cy' | 'unknown'
  language      text        NOT NULL    DEFAULT 'unknown',

  -- Parsed intent fields
  category      text,
  subcategory   text,
  brand         text,

  -- Result metadata
  result_count  integer     NOT NULL    DEFAULT 0,
  -- true when result_count = 0 (useful for "zero-result" dashboards)
  no_results    boolean     GENERATED ALWAYS AS (result_count = 0) STORED,

  -- Pagination
  page          integer     NOT NULL    DEFAULT 1,

  -- Optional context
  user_id       uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id    text,
  ip_hash       text,       -- hashed, never raw IP
  user_agent    text,

  -- Source: 'navbar' | 'hero' | 'products_page' | 'api'
  source        text        NOT NULL    DEFAULT 'api',

  -- Was a product clicked after this search?
  converted     boolean     NOT NULL    DEFAULT false,
  product_id    uuid        REFERENCES vendor_products(id) ON DELETE SET NULL
);

-- Indexes for the most common analytics queries
CREATE INDEX IF NOT EXISTS sa_query_idx        ON search_analytics (lower(query));
CREATE INDEX IF NOT EXISTS sa_created_idx      ON search_analytics (created_at DESC);
CREATE INDEX IF NOT EXISTS sa_category_idx     ON search_analytics (category) WHERE category IS NOT NULL;
CREATE INDEX IF NOT EXISTS sa_no_results_idx   ON search_analytics (no_results, created_at DESC);
CREATE INDEX IF NOT EXISTS sa_language_idx     ON search_analytics (language, created_at DESC);
CREATE INDEX IF NOT EXISTS sa_user_idx         ON search_analytics (user_id)  WHERE user_id IS NOT NULL;

-- RLS: service role can write; authenticated admins can read all;
-- users can read their own rows.
ALTER TABLE search_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY sa_insert_service ON search_analytics
  FOR INSERT WITH CHECK (true);   -- API route uses service role

CREATE POLICY sa_select_admin ON search_analytics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN roles r ON r.id = p.role_id
      WHERE p.id = auth.uid()
        AND r.name IN ('admin', 'super_admin')
    )
  );

CREATE POLICY sa_select_own ON search_analytics
  FOR SELECT USING (user_id = auth.uid());

-- Convenience view: trending queries over the last 7 days
CREATE OR REPLACE VIEW trending_searches_7d AS
SELECT
  lower(query)        AS query,
  count(*)            AS search_count,
  sum(result_count)   AS total_results,
  count(*) FILTER (WHERE no_results) AS zero_result_count,
  count(*) FILTER (WHERE converted)  AS conversions,
  round(
    count(*) FILTER (WHERE converted)::numeric / nullif(count(*), 0) * 100,
    1
  )                   AS conversion_rate_pct,
  max(created_at)     AS last_searched_at
FROM search_analytics
WHERE created_at >= now() - interval '7 days'
  AND length(query) >= 2
GROUP BY lower(query)
ORDER BY search_count DESC;
