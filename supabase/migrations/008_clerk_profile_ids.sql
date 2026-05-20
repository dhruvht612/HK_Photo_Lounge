-- Clerk: text user ids + RLS for JWT "sub" (user_xxx).
-- Run once in Supabase SQL Editor. Drops policies first (required before ALTER COLUMN).

-- 1) Drop policies that reference columns we are about to change
DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own_or_admin" ON profiles;
DROP POLICY IF EXISTS "profiles_delete_admin" ON profiles;
DROP POLICY IF EXISTS "Users read own profile" ON profiles;
DROP POLICY IF EXISTS "Users update own profile" ON profiles;
DROP POLICY IF EXISTS "Users insert own profile" ON profiles;
DROP POLICY IF EXISTS "Admin manage profiles" ON profiles;

DROP POLICY IF EXISTS "Client read own inquiries" ON inquiries;

DROP POLICY IF EXISTS "Client access own bookings" ON bookings;

DROP POLICY IF EXISTS "Participants read messages" ON messages;
DROP POLICY IF EXISTS "Participants send messages" ON messages;

DROP POLICY IF EXISTS "Client access own contracts" ON contracts;
DROP POLICY IF EXISTS "Client access own invoices" ON invoices;
DROP POLICY IF EXISTS "Client access own gallery deliveries" ON gallery_deliveries;
DROP POLICY IF EXISTS "Client access own gallery images" ON gallery_images;

-- 2) Drop FKs to profiles.id (must happen before type change)
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_client_id_fkey;
ALTER TABLE inquiries DROP CONSTRAINT IF EXISTS inquiries_client_id_fkey;
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_sender_id_fkey;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- 3) Change UUID user ids → TEXT (Clerk user_xxx)
ALTER TABLE profiles ALTER COLUMN id TYPE TEXT USING id::text;

ALTER TABLE bookings ALTER COLUMN client_id TYPE TEXT USING client_id::text;
ALTER TABLE inquiries ALTER COLUMN client_id TYPE TEXT USING client_id::text;
ALTER TABLE messages ALTER COLUMN sender_id TYPE TEXT USING sender_id::text;

-- 4) Restore FKs (text → text)
ALTER TABLE bookings
  ADD CONSTRAINT bookings_client_id_fkey
  FOREIGN KEY (client_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE inquiries
  ADD CONSTRAINT inquiries_client_id_fkey
  FOREIGN KEY (client_id) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE messages
  ADD CONSTRAINT messages_sender_id_fkey
  FOREIGN KEY (sender_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- 5) Helpers for Clerk + legacy Supabase Auth
CREATE OR REPLACE FUNCTION public.requesting_user_id()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    NULLIF(TRIM(auth.jwt() ->> 'sub'), ''),
    NULLIF(auth.uid()::text, '')
  );
$$;

GRANT EXECUTE ON FUNCTION public.requesting_user_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.requesting_user_id() TO anon;

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
  WHERE id = public.requesting_user_id();
  RETURN COALESCE(admin_role, false);
END;
$$;

CREATE OR REPLACE FUNCTION public.ensure_my_profile(p_role text DEFAULT 'client')
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid text;
  uemail text;
  uname text;
  row profiles;
BEGIN
  uid := public.requesting_user_id();
  IF uid IS NULL OR uid = '' THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT
    COALESCE(auth.jwt() ->> 'email', ''),
    NULLIF(TRIM(COALESCE(auth.jwt() ->> 'name', '')), '')
  INTO uemail, uname;

  IF uemail = '' THEN
    uemail := uid || '@clerk.local';
  END IF;

  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    uid,
    uemail,
    uname,
    CASE WHEN p_role = 'admin' THEN 'admin' ELSE 'client' END
  )
  ON CONFLICT (id) DO NOTHING;

  SELECT * INTO row FROM public.profiles WHERE id = uid;
  RETURN row_to_json(row);
END;
$$;

-- 6) Recreate client RLS policies (Clerk JWT sub + admin)
CREATE POLICY "profiles_select_own_or_admin"
  ON profiles FOR SELECT
  USING (id = public.requesting_user_id() OR public.is_admin());

CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT
  WITH CHECK (id = public.requesting_user_id());

CREATE POLICY "profiles_update_own_or_admin"
  ON profiles FOR UPDATE
  USING (id = public.requesting_user_id() OR public.is_admin());

CREATE POLICY "profiles_delete_admin"
  ON profiles FOR DELETE
  USING (public.is_admin());

CREATE POLICY "Client read own inquiries"
  ON inquiries FOR SELECT
  USING (client_id = public.requesting_user_id() OR public.is_admin());

CREATE POLICY "Client access own bookings"
  ON bookings FOR SELECT
  USING (client_id = public.requesting_user_id() OR public.is_admin());

CREATE POLICY "Participants read messages"
  ON messages FOR SELECT
  USING (
    sender_id = public.requesting_user_id()
    OR public.is_admin()
    OR EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = booking_id AND b.client_id = public.requesting_user_id()
    )
  );

CREATE POLICY "Participants send messages"
  ON messages FOR INSERT
  WITH CHECK (
    sender_id = public.requesting_user_id()
    AND (
      public.is_admin()
      OR EXISTS (
        SELECT 1 FROM bookings b
        WHERE b.id = booking_id AND b.client_id = public.requesting_user_id()
      )
    )
  );

CREATE POLICY "Client access own contracts"
  ON contracts FOR SELECT
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = booking_id AND b.client_id = public.requesting_user_id()
    )
  );

CREATE POLICY "Client access own invoices"
  ON invoices FOR SELECT
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = booking_id AND b.client_id = public.requesting_user_id()
    )
  );

CREATE POLICY "Client access own gallery deliveries"
  ON gallery_deliveries FOR SELECT
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = booking_id AND b.client_id = public.requesting_user_id()
    )
  );

CREATE POLICY "Client access own gallery images"
  ON gallery_images FOR SELECT
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM gallery_deliveries gd
      JOIN bookings b ON b.id = gd.booking_id
      WHERE gd.id = delivery_id AND b.client_id = public.requesting_user_id()
    )
  );
