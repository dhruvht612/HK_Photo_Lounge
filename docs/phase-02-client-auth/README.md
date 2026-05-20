# Phase 2 — Client Authentication & Profile

> **Goal:** Allow clients to register, log in, reset passwords, and view a dashboard. Create the portal layout shell.

---

## 1. Files to Create

```
src/
├── supabase/
│   └── auth.js                  # Auth helper functions
├── pages/portal/
│   ├── PortalLogin.jsx          # Login page
│   ├── PortalRegister.jsx       # Registration page
│   ├── PortalDashboard.jsx      # Client dashboard
│   └── PortalResetPassword.jsx  # Password reset
├── layouts/
│   └── PortalLayout.jsx         # Portal shell (nav + content)
└── components/
    └── ProtectedRoute.jsx       # Updated: supports role-based guard
```

---

## 2. Auth Helpers

Create `src/supabase/auth.js`:

```js
import { supabase } from './client'

export async function signUp(email, password, name, phone) {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  })
  if (authError) return { error: authError }

  // Create profile
  const { error: profileError } = await supabase.from('profiles').insert({
    id: authData.user.id,
    email,
    name,
    phone,
    role: 'client',
  })
  if (profileError) return { error: profileError }

  return { data: authData }
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  if (error) return { error }
  return { data }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export async function resetPassword(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/portal/login`,
  })
  return { error }
}

export async function getCurrentUser() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single()

  return { ...session.user, profile }
}
```

---

## 3. Portal Login Page

`src/pages/portal/PortalLogin.jsx`:

- Email + password form
- "Forgot password?" link → PortalResetPassword
- "Don't have an account? Register" link
- After login → redirect to `/portal/dashboard`
- Error states (invalid credentials, network error)
- Loading state during auth call
- If already authenticated → redirect to dashboard

**Validation:**
- Email: valid email format
- Password: required, min 6 chars

**Styling:** Match the dark theme (ink backgrounds, accent buttons, sand text). Keep it minimal — centered card layout reminiscent of AdminLogin but with client branding.

---

## 4. Portal Register Page

`src/pages/portal/PortalRegister.jsx`:

- Name, email, phone (optional), password, confirm password
- After registration → auto-login → redirect to dashboard
- Optionally link any existing inquiry by email (match on `inquiries.email`)

**Validation:**
- Name: required
- Email: valid format, not already registered
- Password: min 8 chars, confirm matches
- Phone: optional, valid format if provided

**Linking Inquiries:**
When a user registers with an email that matches an existing inquiry:
```sql
UPDATE inquiries SET client_id = $userId WHERE email = $email AND client_id IS NULL
```

---

## 5. Portal Reset Password

`src/pages/portal/PortalResetPassword.jsx`:

- Email input
- "Send reset link" button
- Confirmation screen after email sent
- Back to login link

Supabase handles the actual reset flow via magic link — no custom token handling needed.

---

## 6. Portal Layout

`src/layouts/PortalLayout.jsx`:

A clean client-facing shell:

```
┌──────────────────────────────────────┐
│  [Logo]   Dashboard | Bookings |     │
│           Galleries | Messages |     │
│           Documents | Logout    [👤] │
├──────────────────────────────────────┤
│                                      │
│        {children} (page content)     │
│                                      │
└──────────────────────────────────────┘
```

**Nav items (client):**
- Dashboard
- My Bookings
- Galleries
- Messages (with unread badge count)
- Documents
- Inspiration Board

**Responsive:**
- Desktop: horizontal top nav or sidebar (match admin layout style)
- Mobile: hamburger menu

**Design:** Use the same Tailwind tokens. Nav can be a dark sidebar like AdminLayout but visually distinct (e.g., slightly different accent color or logo treatment).

---

## 7. Dashboard Page

`src/pages/portal/PortalDashboard.jsx`:

Sections:
1. **Welcome** — "Welcome back, {name}!"
2. **Upcoming Booking** — Card showing next booking's service, date, status, location
3. **Quick Stats** — 3 small cards: Active Bookings, Unread Messages, Pending Documents
4. **Recent Activity** — Timeline of recent events (inquiry submitted, booking confirmed, gallery delivered, etc.)
5. **Quick Actions** — Buttons: "View My Bookings", "Check Galleries", "Send a Message"

**Data queries:**
```js
// Upcoming booking
const { data: upcoming } = await supabase
  .from('bookings')
  .select('*, services(name)')
  .eq('client_id', userId)
  .in('status', ['confirmed'])
  .order('event_date', { ascending: true })
  .limit(1)
  .single()

// Unread messages count
const { count } = await supabase
  .from('messages')
  .select('*', { count: 'exact', head: true })
  .eq('booking_id', bookingIds) // subquery
  .eq('read', false)
  .neq('sender_id', userId)
```

---

## 8. Update App.jsx Routes

Add to existing routes:

```jsx
import PortalLayout from './layouts/PortalLayout'
import ProtectedRoute from './components/ProtectedRoute'
import PortalLogin from './pages/portal/PortalLogin'
import PortalRegister from './pages/portal/PortalRegister'
import PortalDashboard from './pages/portal/PortalDashboard'
import PortalResetPassword from './pages/portal/PortalResetPassword'

// Outside any layout (public)
<Route path="/portal/login" element={<PortalLogin />} />
<Route path="/portal/register" element={<PortalRegister />} />
<Route path="/portal/reset-password" element={<PortalResetPassword />} />

// Protected client routes
<Route element={<ProtectedRoute role="client" />}>
  <Route element={<PortalLayout />}>
    <Route path="/portal" element={<PortalDashboard />} />
    <Route path="/portal/dashboard" element={<PortalDashboard />} />
  </Route>
</Route>
```

---

## 9. Update ProtectedRoute Component

`src/components/ProtectedRoute.jsx`:

- Accept `role` prop ('admin' | 'client' | undefined)
- Check `isAuthenticated` from AuthContext
- If `role` specified, also check `user.profile.role === role`
- Redirect to appropriate login page if not authenticated
- Redirect to appropriate dashboard if wrong role

---

## 10. Verification Checklist

- [ ] Registration creates auth user + profile row
- [ ] Login redirects to dashboard
- [ ] Invalid credentials show error message
- [ ] Password reset email sends (check Supabase logs)
- [ ] Already-logged-in user redirected away from login
- [ ] PortalLayout renders nav with all links
- [ ] Unauthenticated user redirected from `/portal/*` to login
- [ ] Admin user cannot access client portal routes
- [ ] Mobile nav works
- [ ] Dashboard loads real data (or empty states)
- [ ] Loading skeletons show while data fetches
- [ ] Error states handled gracefully
