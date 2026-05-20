-- HK Photo Lounge — Phase 1 RLS policies
-- Run after 001_schema.sql

-- Helper: true when current user is admin (bypasses RLS to avoid recursion on profiles)
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

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_images ENABLE ROW LEVEL SECURITY;

-- PROFILES
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

-- CATEGORIES (public read; admin write)
CREATE POLICY "Public read categories"
  ON categories FOR SELECT
  USING (true);

CREATE POLICY "Admin manage categories"
  ON categories FOR ALL
  USING (public.is_admin());

-- PORTFOLIO
CREATE POLICY "Public read published portfolio"
  ON portfolio FOR SELECT
  USING (published = TRUE OR public.is_admin());

CREATE POLICY "Admin manage portfolio"
  ON portfolio FOR ALL
  USING (public.is_admin());

-- PORTFOLIO IMAGES
CREATE POLICY "Public read portfolio images"
  ON portfolio_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM portfolio p
      WHERE p.id = portfolio_id AND (p.published = TRUE OR public.is_admin())
    )
  );

CREATE POLICY "Admin manage portfolio images"
  ON portfolio_images FOR ALL
  USING (public.is_admin());

-- SERVICES
CREATE POLICY "Public read published services"
  ON services FOR SELECT
  USING (published = TRUE OR public.is_admin());

CREATE POLICY "Admin manage services"
  ON services FOR ALL
  USING (public.is_admin());

-- TESTIMONIALS
CREATE POLICY "Public read published testimonials"
  ON testimonials FOR SELECT
  USING (published = TRUE OR public.is_admin());

CREATE POLICY "Admin manage testimonials"
  ON testimonials FOR ALL
  USING (public.is_admin());

-- SETTINGS
CREATE POLICY "Public read settings"
  ON settings FOR SELECT
  USING (true);

CREATE POLICY "Admin manage settings"
  ON settings FOR ALL
  USING (public.is_admin());

-- INQUIRIES
CREATE POLICY "Anyone can create inquiry"
  ON inquiries FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Client read own inquiries"
  ON inquiries FOR SELECT
  USING (client_id = auth.uid() OR public.is_admin());

CREATE POLICY "Admin manage inquiries"
  ON inquiries FOR ALL
  USING (public.is_admin());

-- BOOKINGS
CREATE POLICY "Client access own bookings"
  ON bookings FOR SELECT
  USING (client_id = auth.uid() OR public.is_admin());

CREATE POLICY "Admin manage bookings"
  ON bookings FOR ALL
  USING (public.is_admin());

-- MESSAGES
CREATE POLICY "Participants read messages"
  ON messages FOR SELECT
  USING (
    sender_id = auth.uid()
    OR public.is_admin()
    OR EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = booking_id AND b.client_id = auth.uid()
    )
  );

CREATE POLICY "Participants send messages"
  ON messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND (
      public.is_admin()
      OR EXISTS (
        SELECT 1 FROM bookings b
        WHERE b.id = booking_id AND b.client_id = auth.uid()
      )
    )
  );

CREATE POLICY "Admin manage messages"
  ON messages FOR ALL
  USING (public.is_admin());

-- CONTRACTS
CREATE POLICY "Client access own contracts"
  ON contracts FOR SELECT
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = booking_id AND b.client_id = auth.uid()
    )
  );

CREATE POLICY "Admin manage contracts"
  ON contracts FOR ALL
  USING (public.is_admin());

-- INVOICES
CREATE POLICY "Client access own invoices"
  ON invoices FOR SELECT
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = booking_id AND b.client_id = auth.uid()
    )
  );

CREATE POLICY "Admin manage invoices"
  ON invoices FOR ALL
  USING (public.is_admin());

-- GALLERY DELIVERIES
CREATE POLICY "Client access own gallery deliveries"
  ON gallery_deliveries FOR SELECT
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = booking_id AND b.client_id = auth.uid()
    )
  );

CREATE POLICY "Admin manage gallery deliveries"
  ON gallery_deliveries FOR ALL
  USING (public.is_admin());

-- GALLERY IMAGES
CREATE POLICY "Client access own gallery images"
  ON gallery_images FOR SELECT
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM gallery_deliveries gd
      JOIN bookings b ON b.id = gd.booking_id
      WHERE gd.id = delivery_id AND b.client_id = auth.uid()
    )
  );

CREATE POLICY "Admin manage gallery images"
  ON gallery_images FOR ALL
  USING (public.is_admin());
