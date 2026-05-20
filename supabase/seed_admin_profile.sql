-- Run AFTER creating the user in Supabase Auth (Authentication → Users)
-- Works for admin@hkphotolounge.com OR your own email (edit below)

INSERT INTO profiles (id, email, name, role)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'admin@hkphotolounge.com' LIMIT 1),
  'admin@hkphotolounge.com',
  'Harris',
  'admin'
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  role = 'admin';

-- Fix missing profile for any existing Auth user (edit email and role):
-- INSERT INTO profiles (id, email, name, role)
-- SELECT id, email, 'Your Name', 'client'
-- FROM auth.users
-- WHERE email = 'your@email.com'
-- LIMIT 1
-- ON CONFLICT (id) DO UPDATE SET
--   email = EXCLUDED.email,
--   name = EXCLUDED.name,
--   role = EXCLUDED.role;
