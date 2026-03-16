-- ─────────────────────────────────────────────────────────────────────────────
-- 006_otp_and_flags.sql
--
-- Adds:
--   1. sms_otps        — per-order OTP codes with expiry + attempt tracking
--   2. phone_logs      — immutable log of every phone number used at checkout
--   3. profiles.no_show_count + profiles.flagged_at — no-show tracking
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. SMS OTP table ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sms_otps (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id     uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES auth.users(id)   ON DELETE CASCADE,
  phone        text NOT NULL,
  code_hash    text NOT NULL,           -- bcrypt hash of 6-digit code
  expires_at   timestamptz NOT NULL,
  verified_at  timestamptz,
  attempts     int NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sms_otps_order ON public.sms_otps(order_id);
CREATE INDEX IF NOT EXISTS idx_sms_otps_user  ON public.sms_otps(user_id);

ALTER TABLE public.sms_otps ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'sms_otps_service_all' AND tablename = 'sms_otps') THEN
    CREATE POLICY sms_otps_service_all ON public.sms_otps FOR ALL TO service_role
      USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'sms_otps_select_own' AND tablename = 'sms_otps') THEN
    CREATE POLICY sms_otps_select_own ON public.sms_otps FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- ── 2. Phone log table ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.phone_logs (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id   uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  phone      text NOT NULL,
  event      text NOT NULL,   -- 'otp_sent' | 'otp_verified' | 'otp_failed' | 'otp_expired'
  ip_address inet,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_phone_logs_user  ON public.phone_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_phone_logs_phone ON public.phone_logs(phone);

ALTER TABLE public.phone_logs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'phone_logs_service_all' AND tablename = 'phone_logs') THEN
    CREATE POLICY phone_logs_service_all ON public.phone_logs FOR ALL TO service_role
      USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'phone_logs_select_own' AND tablename = 'phone_logs') THEN
    CREATE POLICY phone_logs_select_own ON public.phone_logs FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- ── 3. Add no-show columns to profiles ───────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS no_show_count int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS flagged_at    timestamptz;

-- ── 4. orders: add otp_verified_at column ─────────────────────────────────────
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS otp_verified_at timestamptz;
