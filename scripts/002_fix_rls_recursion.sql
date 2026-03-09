-- ============================================================
-- Fix: Infinite recursion in RLS policies for profiles table
-- ============================================================
-- The original profiles_select_admin policy (and similar policies on
-- user_sessions and audit_logs) queried public.profiles from within
-- an RLS policy on public.profiles itself, causing infinite recursion.
--
-- Fix: Create a SECURITY DEFINER helper function that reads the caller's
-- role name directly from public.profiles bypassing RLS (safe because it
-- only exposes the role_name of the currently-authenticated user), then
-- rewrite all affected policies to call this function instead.
-- ============================================================

-- 1. Helper function: returns the role name of the calling auth.uid()
--    SECURITY DEFINER bypasses RLS so there is no recursive policy check.
create or replace function public.get_my_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select r.name
  from public.profiles p
  join public.roles r on r.id = p.role_id
  where p.id = auth.uid()
$$;

-- ============================================================
-- 2. Rewrite policies on public.profiles
-- ============================================================

-- Drop the recursive admin policy
drop policy if exists "profiles_select_admin" on public.profiles;

-- Recreate using the helper function (no self-reference)
create policy "profiles_select_admin"
  on public.profiles for select
  using (public.get_my_role() in ('admin', 'support'));


-- ============================================================
-- 3. Rewrite policies on public.user_sessions
-- ============================================================

drop policy if exists "sessions_select_admin" on public.user_sessions;

create policy "sessions_select_admin"
  on public.user_sessions for select
  using (public.get_my_role() = 'admin');


-- ============================================================
-- 4. Rewrite policies on public.audit_logs
-- ============================================================

drop policy if exists "audit_logs_select_admin" on public.audit_logs;

create policy "audit_logs_select_admin"
  on public.audit_logs for select
  using (public.get_my_role() in ('admin', 'support'));
