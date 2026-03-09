-- ── 003_fix_missing_profiles.sql ───────────────────────────────────────
-- Fixes two issues:
--  1. Existing auth.users who never got a profiles row (trigger failed or
--     ran before roles were seeded) are back-filled now.
--  2. The handle_new_user trigger is replaced with a more robust version
--     that uses EXCEPTION handling so it never silently fails.
-- ────────────────────────────────────────────────────────────────────────

-- Step 1: Back-fill missing profile rows for any existing users
do $$
declare
  v_customer_role_id uuid;
begin
  select id into v_customer_role_id from public.roles where name = 'customer';

  if v_customer_role_id is null then
    raise exception 'customer role not found – run 001_auth_schema.sql first';
  end if;

  insert into public.profiles (
    id,
    role_id,
    full_name,
    display_name,
    is_active,
    is_verified,
    country,
    language
  )
  select
    u.id,
    v_customer_role_id,
    coalesce(u.raw_user_meta_data ->> 'full_name',    null),
    coalesce(u.raw_user_meta_data ->> 'display_name', null),
    true,
    (u.email_confirmed_at is not null),
    'TR',
    'tr'
  from auth.users u
  where not exists (
    select 1 from public.profiles p where p.id = u.id
  );

  raise notice 'Back-filled % profile row(s)', found;
end;
$$;


-- Step 2: Replace the trigger function with a robust version that
--         uses exception handling and explicit SECURITY DEFINER.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role_id uuid;
begin
  -- Look up the customer role ID at runtime
  select id into v_role_id from public.roles where name = 'customer';

  if v_role_id is null then
    -- Roles not seeded yet – insert without role (will be fixed by back-fill)
    raise warning 'handle_new_user: customer role not found, profile inserted without role_id';
    return new;
  end if;

  insert into public.profiles (
    id,
    role_id,
    full_name,
    display_name,
    is_active,
    is_verified,
    country,
    language
  )
  values (
    new.id,
    v_role_id,
    coalesce(new.raw_user_meta_data ->> 'full_name',    null),
    coalesce(new.raw_user_meta_data ->> 'display_name', null),
    true,
    (new.email_confirmed_at is not null),
    'TR',
    'tr'
  )
  on conflict (id) do nothing;

  return new;
exception
  when others then
    -- Log and continue – never block sign-up
    raise warning 'handle_new_user failed for user %: %', new.id, sqlerrm;
    return new;
end;
$$;

-- Re-attach trigger (drop + create is idempotent)
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
