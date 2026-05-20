-- Reliable profile creation on first sign-in (bypasses RLS edge cases)

CREATE OR REPLACE FUNCTION public.ensure_my_profile(p_role text DEFAULT 'client')
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid;
  uemail text;
  uname text;
  row profiles;
BEGIN
  uid := auth.uid();
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT email, NULLIF(TRIM(raw_user_meta_data->>'name'), '')
  INTO uemail, uname
  FROM auth.users
  WHERE id = uid;

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

GRANT EXECUTE ON FUNCTION public.ensure_my_profile(text) TO authenticated;
