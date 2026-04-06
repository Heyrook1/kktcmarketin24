-- 027_super_admin_role.sql
-- Adds super_admin role and helper function to promote an account by email.

INSERT INTO public.roles (name, description)
VALUES ('super_admin', 'Geliştirme için tüm sistem erişimi: admin + vendor + customer süreçleri')
ON CONFLICT (name) DO UPDATE
SET description = EXCLUDED.description;

DO $$
DECLARE
  _super_id uuid := (SELECT id FROM public.roles WHERE name = 'super_admin');
  _perm RECORD;
BEGIN
  -- super_admin gets all permissions currently in permissions table
  FOR _perm IN SELECT id FROM public.permissions LOOP
    INSERT INTO public.role_permissions (role_id, permission_id)
    VALUES (_super_id, _perm.id)
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.promote_super_admin(target_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _uid uuid;
  _super_id uuid;
BEGIN
  SELECT id INTO _uid
  FROM auth.users
  WHERE lower(email) = lower(target_email)
  LIMIT 1;

  IF _uid IS NULL THEN
    RAISE EXCEPTION 'No auth.users row found for email: %', target_email;
  END IF;

  SELECT id INTO _super_id
  FROM public.roles
  WHERE name = 'super_admin'
  LIMIT 1;

  IF _super_id IS NULL THEN
    RAISE EXCEPTION 'Role super_admin not found';
  END IF;

  -- Ensure profile row exists (some older users may miss a profile).
  INSERT INTO public.profiles (id, role_id, is_active, is_verified)
  VALUES (_uid, _super_id, true, true)
  ON CONFLICT (id) DO NOTHING;

  UPDATE public.profiles
  SET role_id = _super_id
  WHERE id = _uid;
END;
$$;

-- Usage example (run manually in SQL editor):
-- SELECT public.promote_super_admin('you@example.com');
