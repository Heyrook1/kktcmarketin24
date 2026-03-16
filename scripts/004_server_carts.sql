-- ============================================================
-- server_carts: server-side cart storage keyed to user session
-- ============================================================

CREATE TABLE IF NOT EXISTS public.server_carts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cart_id     text NOT NULL,           -- matches client cartId (Zustand persist key)
  items       jsonb NOT NULL DEFAULT '[]',
  coupon_code text,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)                     -- one server cart per user
);

ALTER TABLE public.server_carts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'server_carts' AND policyname = 'sc_select_own'
  ) THEN
    CREATE POLICY "sc_select_own" ON public.server_carts
      FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'server_carts' AND policyname = 'sc_insert_own'
  ) THEN
    CREATE POLICY "sc_insert_own" ON public.server_carts
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'server_carts' AND policyname = 'sc_update_own'
  ) THEN
    CREATE POLICY "sc_update_own" ON public.server_carts
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'server_carts' AND policyname = 'sc_delete_own'
  ) THEN
    CREATE POLICY "sc_delete_own" ON public.server_carts
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Index for fast lookup by user
CREATE INDEX IF NOT EXISTS idx_server_carts_user ON public.server_carts (user_id);
