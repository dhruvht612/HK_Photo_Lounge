-- Link guest inquiries to a client profile after registration (by matching email)

CREATE OR REPLACE FUNCTION link_inquiries_to_client()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email TEXT;
BEGIN
  SELECT email INTO user_email FROM auth.users WHERE id = auth.uid();
  IF user_email IS NULL THEN
    RETURN;
  END IF;

  UPDATE inquiries
  SET client_id = auth.uid()
  WHERE lower(email) = lower(user_email)
    AND client_id IS NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION link_inquiries_to_client() TO authenticated;
