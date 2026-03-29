-- ============================================================
-- Migration 018 (v2): Create demo vendor user with full privileges
-- ============================================================
-- Credentials: vendor@marketin24.com / Vendor2024!
-- ============================================================

DO $$
DECLARE
  v_user_id uuid := '22222222-0000-0000-0000-000000000002';
  v_role_id uuid;
BEGIN
  -- Get existing vendor role id
  SELECT id INTO v_role_id FROM public.roles WHERE name = 'vendor' LIMIT 1;

  -- Fallback: use any role if vendor doesn't exist yet
  IF v_role_id IS NULL THEN
    SELECT id INTO v_role_id FROM public.roles LIMIT 1;
  END IF;

  -- 1. Create the Supabase Auth user
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    aud,
    role,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change
  )
  VALUES (
    v_user_id,
    '00000000-0000-0000-0000-000000000000',
    'vendor@marketin24.com',
    crypt('Vendor2024!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Demo Satıcı","role":"vendor"}',
    'authenticated',
    'authenticated',
    now(),
    now(),
    '', '', '', ''
  )
  ON CONFLICT (id) DO UPDATE SET
    email              = EXCLUDED.email,
    encrypted_password = EXCLUDED.encrypted_password,
    email_confirmed_at = now(),
    updated_at         = now();

  -- 2. Create identity record
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    created_at,
    updated_at,
    last_sign_in_at
  )
  VALUES (
    v_user_id,
    v_user_id,
    jsonb_build_object('sub', v_user_id::text, 'email', 'vendor@marketin24.com'),
    'email',
    'vendor@marketin24.com',
    now(),
    now(),
    now()
  )
  ON CONFLICT (provider, provider_id) DO NOTHING;

  -- 3. Create profile with vendor role
  INSERT INTO public.profiles (
    id, full_name, display_name, is_active, is_verified,
    role_id, created_at, updated_at
  )
  VALUES (
    v_user_id,
    'Demo Satıcı',
    'DemoStore',
    true, true,
    v_role_id,
    now(), now()
  )
  ON CONFLICT (id) DO UPDATE SET
    role_id     = EXCLUDED.role_id,
    is_active   = true,
    is_verified = true,
    updated_at  = now();

  -- 4. Create vendor store
  INSERT INTO public.vendor_stores (
    id, owner_id, name, slug, description,
    is_active, is_verified, created_at, updated_at
  )
  VALUES (
    '33333333-0000-0000-0000-000000000003',
    v_user_id,
    'Demo Mağaza',
    'demo-magaza',
    'Marketin24 demo satıcı mağazası',
    true, true,
    now(), now()
  )
  ON CONFLICT (id) DO UPDATE SET
    owner_id   = EXCLUDED.owner_id,
    is_active  = true,
    updated_at = now();

END $$;
