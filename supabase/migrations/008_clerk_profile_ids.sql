-- Optional: run if Clerk user ids (user_xxx) fail to insert into profiles (UUID column).
-- Converts profile and client FK ids to TEXT for Clerk third-party auth.

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE profiles ALTER COLUMN id TYPE TEXT USING id::text;

ALTER TABLE bookings ALTER COLUMN client_id TYPE TEXT USING client_id::text;
ALTER TABLE inquiries ALTER COLUMN client_id TYPE TEXT USING client_id::text;
ALTER TABLE messages ALTER COLUMN sender_id TYPE TEXT USING sender_id::text;

-- Recreate ensure_my_profile to use JWT sub when auth.uid() is unavailable
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
  uid := COALESCE(auth.jwt() ->> 'sub', auth.uid()::text);
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
