-- 012_fix_reviews_rls.sql
-- Fix: vendor_reviews was only readable by the owning vendor.
-- Customers and unauthenticated visitors must be able to read
-- published reviews on product and vendor store pages.
--
-- Table columns: id, store_id, product_id, reviewer_name, rating,
--                comment, is_published, created_at
-- (No customer_id / vendor_id columns exist)

-- 1. Drop the overly-restrictive owner-only SELECT policy
DROP POLICY IF EXISTS "vr_select_owner" ON public.vendor_reviews;

-- 2. Allow anyone (including anonymous / unauthenticated) to read reviews
--    Optionally filter to only published reviews for the public
CREATE POLICY "vr_select_public"
  ON public.vendor_reviews
  FOR SELECT
  USING (is_published = true);

-- 3. Keep vr_insert_any so customers can submit reviews
--    (no auth column on the table to tighten this further)

-- 4. Keep vendor UPDATE policy (vr_update_owner) as-is — it uses store_id
--    Re-create idempotently in case it is missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'vendor_reviews' AND policyname = 'vr_update_owner'
  ) THEN
    CREATE POLICY "vr_update_owner"
      ON public.vendor_reviews
      FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM public.vendor_stores vs
          WHERE vs.id = vendor_reviews.store_id
            AND vs.owner_id = auth.uid()
        )
      );
  END IF;
END $$;
