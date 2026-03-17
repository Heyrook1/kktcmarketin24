-- 009_form_submissions.sql
-- Queues all seller application submissions server-side.
-- The API never writes directly to email — the queue is the single sink.
-- An admin worker or cron reads pending rows and sends notifications.

CREATE TABLE IF NOT EXISTS form_submissions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_type     text NOT NULL DEFAULT 'seller_application',
  status        text NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'reviewed', 'approved', 'rejected', 'spam')),

  -- Applicant fields (structured for easy querying)
  full_name     text,
  email         text,
  phone         text,
  store_name    text,
  category      text,
  city          text,
  description   text,

  -- Raw payload stored as fallback / audit trail
  payload       jsonb NOT NULL DEFAULT '{}',

  -- Security / audit metadata — always populated by the API, never by the client
  ip_address    text,
  user_agent    text,
  turnstile_ok  boolean NOT NULL DEFAULT false,

  created_at    timestamptz NOT NULL DEFAULT now(),
  reviewed_at   timestamptz,
  reviewed_by   uuid REFERENCES auth.users(id)
);

-- Index for admin queries
CREATE INDEX IF NOT EXISTS idx_form_submissions_status    ON form_submissions (status);
CREATE INDEX IF NOT EXISTS idx_form_submissions_email     ON form_submissions (email);
CREATE INDEX IF NOT EXISTS idx_form_submissions_created   ON form_submissions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_form_submissions_ip        ON form_submissions (ip_address, created_at DESC);

-- RLS: only service_role can INSERT (the API uses service_role key).
-- Admins read via service_role as well; no public SELECT.
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;

-- No policies for authenticated/anon — only service_role bypasses RLS.
-- This ensures no client-side SDK can read or write this table.

COMMENT ON TABLE form_submissions IS
  'Queue for all public-facing form submissions (seller applications, contact, etc.). '
  'Written exclusively by edge API routes using the service-role key. '
  'Never exposed directly to the client. '
  'A background worker (cron) processes pending rows and sends notifications.';
