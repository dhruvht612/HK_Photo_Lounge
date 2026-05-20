# Supabase setup (Phase 1)

Run migrations in order in the **Supabase SQL Editor**:

1. [`migrations/001_schema.sql`](migrations/001_schema.sql) — 14 tables
2. [`migrations/002_rls.sql`](migrations/002_rls.sql) — RLS policies
3. [`migrations/003_storage.sql`](migrations/003_storage.sql) — storage buckets
4. [`migrations/004_link_inquiries.sql`](migrations/004_link_inquiries.sql) — link inquiries to client on register (Phase 2)
5. [`migrations/005_fix_profiles_rls_recursion.sql`](migrations/005_fix_profiles_rls_recursion.sql) — fix admin login “infinite recursion” on profiles
6. [`migrations/006_profile_on_signup_trigger.sql`](migrations/006_profile_on_signup_trigger.sql) — auto-create `profiles` on signup (fixes client registration)

Then:

1. **Authentication** → create user `admin@hkphotolounge.com` (set a secure password)
2. Run [`seed_admin_profile.sql`](seed_admin_profile.sql) to assign the `admin` role

## App environment

Copy `.env.example` to `.env` and set:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
VITE_USE_SUPABASE=true
```

Client: [`src/supabase/client.js`](../src/supabase/client.js) (not `utils/supabase.ts` — this app uses the existing `src/supabase/` layout from Phase 1).

With `VITE_USE_SUPABASE=false` (default), the app uses the local mock API for content and mock auth for admin.

## Missing profile on sign-in

If Auth has the user but sign-in says “No profile found”, run in SQL Editor (use your email; `client` for portal, `admin` for dashboard):

```sql
INSERT INTO profiles (id, email, name, role)
SELECT id, email, 'Your Name', 'client'
FROM auth.users
WHERE email = 'dhruvht612@gmail.com'
LIMIT 1
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  role = EXCLUDED.role;
```

## Buckets

| Bucket | Public |
|--------|--------|
| `portfolio-images` | Yes |
| `gallery-deliveries` | Yes |
| `contracts` | No |
| `invoices` | No |
| `message-attachments` | Yes |
| `inspiration-images` | Yes |

If `003_storage.sql` fails on bucket inserts, create buckets manually in **Storage** with the same names and public flags.
