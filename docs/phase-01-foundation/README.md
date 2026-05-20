# Phase 1 — Foundation

> **Goal:** Set up Supabase project, database schema, storage, auth config, and integrate the Supabase client into the app so all future phases have a backbone.

---

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note the **Project URL** and **`anon` public API key** from Settings → API
3. Store these in a new `.env` file:

```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

---

## 2. Install Supabase SDK

```bash
npm install @supabase/supabase-js
```

---

## 3. Create Supabase Client

Create `src/supabase/client.js`:

```js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials missing. Falling back to mock API.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

---

## 4. Database Schema

Run the following SQL in Supabase SQL Editor (or via migration file):

```sql
-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- PROFILES
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  phone TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('admin', 'client')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CATEGORIES
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- PORTFOLIO
CREATE TABLE portfolio (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  cover_url TEXT,
  published BOOLEAN NOT NULL DEFAULT FALSE,
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- PORTFOLIO IMAGES
CREATE TABLE portfolio_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  portfolio_id UUID NOT NULL REFERENCES portfolio(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- SERVICES
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  price_hint TEXT,
  published BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TESTIMONIALS
CREATE TABLE testimonials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_name TEXT NOT NULL,
  content TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  avatar_url TEXT,
  published BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- SETTINGS
CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL
);

-- INQUIRIES
CREATE TABLE inquiries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  event_date DATE,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'booked', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- BOOKINGS
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inquiry_id UUID REFERENCES inquiries(id) ON DELETE SET NULL,
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  event_date DATE,
  location TEXT,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- MESSAGES
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  attachments JSONB,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CONTRACTS
CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  file_url TEXT,
  signed_at TIMESTAMPTZ,
  signed_by_client BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- INVOICES
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
  due_date DATE,
  paid_at TIMESTAMPTZ,
  file_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- GALLERY DELIVERIES
CREATE TABLE gallery_deliveries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- GALLERY IMAGES
CREATE TABLE gallery_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  delivery_id UUID NOT NULL REFERENCES gallery_deliveries(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  filename TEXT NOT NULL,
  width INTEGER,
  height INTEGER,
  file_size INTEGER,
  download_count INTEGER NOT NULL DEFAULT 0
);
```

---

## 5. Create Seed Data (Optional)

Insert an admin profile (run after creating the admin user via Auth):

```sql
INSERT INTO profiles (id, email, name, role)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'admin@hkphotolounge.com' LIMIT 1),
  'admin@hkphotolounge.com',
  'Harris',
  'admin'
);
```

---

## 6. Configure Storage Buckets

Create buckets via Supabase Dashboard → Storage:

| Bucket Name | Public | Purpose |
|---|---|---|
| `portfolio-images` | Yes | Public portfolio gallery images |
| `gallery-deliveries` | Yes | Client gallery photos (access controlled via RLS) |
| `contracts` | No | PDF contracts |
| `invoices` | No | PDF invoices |
| `message-attachments` | Yes | File attachments in messages |
| `inspiration-images` | Yes | Client mood board uploads |

---

## 7. Set Up Row Level Security (RLS)

Enable RLS on all tables, then create policies.

Key policy patterns:

**Profiles:**
```sql
-- Users can read own profile; admin can read all
CREATE POLICY "Users read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id OR auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
  ));
```

**Bookings / Messages / Inquiries / Contracts / Invoices / Galleries:**
```sql
-- Clients see only their own; admin sees all
CREATE POLICY "Client access own bookings"
  ON bookings FOR SELECT
  USING (client_id = auth.uid() OR auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
  ));
```

**Portfolio / Services / Testimonials (public read):**
```sql
CREATE POLICY "Public read published"
  ON portfolio FOR SELECT
  USING (published = TRUE);
```

**Insert policies for inquiries (public):**
```sql
CREATE POLICY "Anyone can create inquiry"
  ON inquiries FOR INSERT
  WITH CHECK (true);
```

---

## 8. Update AuthContext

Modify `src/contexts/AuthContext.jsx` to support both Supabase and mock auth.

Add a feature flag check:

```js
const useSupabase = import.meta.env.VITE_USE_SUPABASE === 'true'
```

When `VITE_USE_SUPABASE=true`:
- `login()` calls `supabase.auth.signInWithPassword()`
- `register()` calls `supabase.auth.signUp()`
- `logout()` calls `supabase.auth.signOut()`
- `fetchUser()` gets session from `supabase.auth.getSession()`

When `VITE_USE_SUPABASE=false` (default):
- Keep existing localStorage mock auth untouched

---

## 9. Update ProtectedRoute

Create a reusable `ProtectedRoute` that checks both role and auth:

- Admin routes require `role === 'admin'`
- Client portal routes require `role === 'client'`

---

## 10. Verification Checklist

- [ ] Supabase project created and credentials in `.env`
- [ ] `@supabase/supabase-js` installed
- [ ] All 14 tables created in PostgreSQL
- [ ] Storage buckets created
- [ ] RLS policies written (not yet enabled — enable phase by phase)
- [ ] Supabase client initializes without errors
- [ ] `AuthContext` can toggle between mock and Supabase
- [ ] `VITE_USE_SUPABASE=true` env var read correctly
- [ ] `npm run dev` starts without errors

---

## Migration Strategy (localStorage → Supabase)

The mock API in `src/api/` stays untouched. All new Supabase queries live in `src/supabase/queries/`. Existing admin pages continue using the mock API until explicitly migrated. The `VITE_USE_SUPABASE` flag activates Supabase paths in AuthContext and future API calls.
