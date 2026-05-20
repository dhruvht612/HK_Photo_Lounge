# Supabase setup (Phase 1)

Run migrations in order in the **Supabase SQL Editor**:

1. [`migrations/001_schema.sql`](migrations/001_schema.sql) — 14 tables
2. [`migrations/002_rls.sql`](migrations/002_rls.sql) — RLS policies
3. [`migrations/003_storage.sql`](migrations/003_storage.sql) — storage buckets
4. [`migrations/004_link_inquiries.sql`](migrations/004_link_inquiries.sql) — link inquiries to client on register (Phase 2)
5. [`migrations/005_fix_profiles_rls_recursion.sql`](migrations/005_fix_profiles_rls_recursion.sql) — fix admin login “infinite recursion” on profiles
6. [`migrations/006_profile_on_signup_trigger.sql`](migrations/006_profile_on_signup_trigger.sql) — auto-create `profiles` on signup (fixes client registration)
7. [`migrations/007_ensure_profile_rpc.sql`](migrations/007_ensure_profile_rpc.sql) — reliable profile creation on first sign-in (fixes stuck “Signing in…”)
8. [`migrations/008_clerk_profile_ids.sql`](migrations/008_clerk_profile_ids.sql) — **required for Clerk** — drops policies, text user ids, recreates RLS for JWT `sub` (run after 007; one script, do not run 009 separately)

Then:

1. **Authentication** → create user `admin@hkphotolounge.com` (set a secure password)
2. Run [`seed_admin_profile.sql`](seed_admin_profile.sql) to assign the `admin` role

## Clerk + Supabase (client portal)

When `VITE_CLERK_PUBLISHABLE_KEY` is set (prefer `.env.local`), the client portal uses [Clerk](https://clerk.com/docs/react/getting-started/quickstart) for sign-in/sign-up. Supabase accepts Clerk JWTs via **Authentication → Third-Party Auth → Clerk** (already enabled in your project).

- Admin login still uses **Supabase Auth** (`/admin/login`).
- Restart `npm run dev` after changing `.env.local`.
- If the portal dashboard says **Failed to load dashboard** after Clerk sign-in, run migration **008** in the SQL Editor (it drops policies first, then alters columns).

## “Failed to load dashboard” (Clerk signed in)

Run the full **[`008_clerk_profile_ids.sql`](migrations/008_clerk_profile_ids.sql)** once. If you see `cannot alter type of a column used in a policy`, you ran an old version of 008 — use the updated file (it drops policies first).

Hard-refresh the portal after it succeeds.

## App environment

Copy `.env.example` to `.env` or `.env.local` and set:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
VITE_USE_SUPABASE=true
```

Client: [`src/supabase/client.js`](../src/supabase/client.js) (not `utils/supabase.ts` — this app uses the existing `src/supabase/` layout from Phase 1).

With `VITE_USE_SUPABASE=false` (default), the app uses the local mock API for content and mock auth for admin.

## Profiles on sign-in / sign-up

The app **auto-creates** a `profiles` row on first client or admin sign-in if Auth has the user but `profiles` does not.

For new signups, run migration **006** so profiles are created by database trigger as well.

## Password settings (Supabase → Email provider)

If **Password requirements** is set to “lowercase, uppercase, digits and symbols”, every password must include all four (e.g. `PhotoLounge1!`).

For **development**, you can simplify:

| Setting | Dev recommendation |
|--------|---------------------|
| **Prevent use of leaked passwords** | **OFF** (Pro-only; can block common test passwords) |
| **Password requirements** | **No requirements** or letters + numbers only |
| **Minimum password length** | **8** (matches the app) |

Click **Save**, then register or sign in again.

## “email rate limit exceeded” on register

Supabase limits how many auth emails (sign-up, reset, magic link) can be sent per hour on the free tier. After many test registrations you hit this limit.

**Options:**

1. **Wait** ~1 hour, then try again — or use **Sign in** if that email is already in **Authentication → Users**.
2. **Create the user manually:** Supabase → **Authentication** → **Users** → **Add user** → set email `dhruv.thakar@ontariotechu.net` and a password → then sign in on `/portal/login`.
3. **Raise limits (dev):** **Authentication** → **Rate Limits** — increase email sign-up / confirmation limits.
4. **Skip confirmation emails (dev):** **Authentication** → **Providers** → **Email** → turn off **Confirm email**, then register or sign in without waiting for a link.

## Stuck on “Signing in…”

1. Hard-refresh the app (`Ctrl+Shift+R`) on **http://localhost:5175** (or whatever port Vite prints).
2. Run migrations **005** and **007** in the SQL Editor if you have not already.
3. In Supabase **Authentication → Users**, copy the email **exactly** (e.g. `dhruvh1612@gmail.com` — a typo like `dhruvhs012@gmail.com` will fail or hang on profile load).
4. After ~20s the form should show a timeout message if the database is unreachable.

Manual SQL is only needed if auto-create fails (RLS not applied):

```sql
INSERT INTO profiles (id, email, name, role)
SELECT id, email, 'Your Name', 'client'
FROM auth.users
WHERE email = 'your@email.com'
ON CONFLICT (id) DO NOTHING;
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
