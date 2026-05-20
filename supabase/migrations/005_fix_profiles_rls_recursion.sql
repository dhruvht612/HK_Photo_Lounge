-- Fix: infinite recursion detected in policy for relation "profiles"
-- Cause: is_admin() queried profiles while profiles RLS called is_admin()

DROP POLICY IF EXISTS "Users read own profile" ON profiles;
DROP POLICY IF EXISTS "Users update own profile" ON profiles;
DROP POLICY IF EXISTS "Users insert own profile" ON profiles;
DROP POLICY IF EXISTS "Admin manage profiles" ON profiles;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_role boolean;
BEGIN
  SET LOCAL row_security = off;
  SELECT (role = 'admin')
  INTO admin_role
  FROM public.profiles
  WHERE id = auth.uid();
  RETURN COALESCE(admin_role, false);
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon;

CREATE POLICY "profiles_select_own_or_admin"
  ON profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own_or_admin"
  ON profiles FOR UPDATE
  USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "profiles_delete_admin"
  ON profiles FOR DELETE
  USING (public.is_admin());
