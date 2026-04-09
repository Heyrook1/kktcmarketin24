-- 029_support_threads_and_messages.sql
-- Customer <-> Vendor ve Vendor <-> Admin mesajlasma altyapisi

BEGIN;

CREATE TABLE IF NOT EXISTS public.support_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_type text NOT NULL CHECK (thread_type IN ('customer_vendor', 'vendor_admin')),
  subject text,
  order_id uuid NULL REFERENCES public.orders(id) ON DELETE SET NULL,
  vendor_order_id uuid NULL REFERENCES public.vendor_orders(id) ON DELETE CASCADE,
  store_id uuid NULL REFERENCES public.vendor_stores(id) ON DELETE SET NULL,
  customer_id uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  vendor_user_id uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  admin_user_id uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_message_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_support_threads_customer_vendor_vendor_order
  ON public.support_threads(vendor_order_id)
  WHERE thread_type = 'customer_vendor';

CREATE INDEX IF NOT EXISTS idx_support_threads_type_store_last_message
  ON public.support_threads(thread_type, store_id, last_message_at DESC);

CREATE TABLE IF NOT EXISTS public.support_thread_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.support_threads(id) ON DELETE CASCADE,
  sender_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_role text NOT NULL CHECK (sender_role IN ('customer', 'vendor', 'admin', 'super_admin')),
  body text NOT NULL CHECK (char_length(trim(body)) BETWEEN 1 AND 2000),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_support_thread_messages_thread_created
  ON public.support_thread_messages(thread_id, created_at DESC);

ALTER TABLE public.support_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_thread_messages ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- Policies are permissive at DB layer because app routes already enforce ownership
  -- with explicit server-side checks and service-role client.
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'support_threads' AND policyname = 'support_threads_select_authenticated'
  ) THEN
    CREATE POLICY support_threads_select_authenticated
      ON public.support_threads FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'support_thread_messages' AND policyname = 'support_thread_messages_select_authenticated'
  ) THEN
    CREATE POLICY support_thread_messages_select_authenticated
      ON public.support_thread_messages FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'support_threads'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.support_threads;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'support_thread_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.support_thread_messages;
  END IF;
END $$;

COMMIT;
