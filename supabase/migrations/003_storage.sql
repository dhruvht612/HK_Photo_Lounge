-- HK Photo Lounge — Phase 1 storage buckets
-- Run after 001_schema.sql (storage schema must exist)

INSERT INTO storage.buckets (id, name, public)
VALUES
  ('portfolio-images', 'portfolio-images', true),
  ('gallery-deliveries', 'gallery-deliveries', true),
  ('contracts', 'contracts', false),
  ('invoices', 'invoices', false),
  ('message-attachments', 'message-attachments', true),
  ('inspiration-images', 'inspiration-images', true)
ON CONFLICT (id) DO NOTHING;

-- Public buckets: anyone can read objects
CREATE POLICY "Public read portfolio images bucket"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'portfolio-images');

CREATE POLICY "Public read message attachments bucket"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'message-attachments');

CREATE POLICY "Public read inspiration images bucket"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'inspiration-images');

-- Authenticated users can upload to public attachment buckets
CREATE POLICY "Auth upload message attachments"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'message-attachments' AND auth.role() = 'authenticated');

CREATE POLICY "Auth upload inspiration images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'inspiration-images' AND auth.role() = 'authenticated');

-- Admin uploads (portfolio, gallery deliveries, contracts, invoices)
CREATE POLICY "Admin upload portfolio images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'portfolio-images' AND public.is_admin());

CREATE POLICY "Admin upload gallery deliveries"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'gallery-deliveries' AND public.is_admin());

CREATE POLICY "Admin upload contracts"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'contracts' AND public.is_admin());

CREATE POLICY "Admin upload invoices"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'invoices' AND public.is_admin());

CREATE POLICY "Admin read private buckets"
  ON storage.objects FOR SELECT
  USING (
    public.is_admin()
    OR (
      bucket_id IN ('gallery-deliveries', 'contracts', 'invoices')
      AND auth.role() = 'authenticated'
    )
  );

CREATE POLICY "Admin manage storage objects"
  ON storage.objects FOR ALL
  USING (public.is_admin());
