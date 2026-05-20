# Phase 8 — Email Notifications & Polish

> **Goal:** Add automated email notifications via Supabase Edge Functions, then polish the entire application with loading states, error handling, empty states, and responsive testing.

---

## Part A: Email Notifications

### 1. Trigger Events

| Event | Recipient | Template |
|---|---|---|
| New inquiry submitted | Admin | "New inquiry from {name} — {service}" |
| Booking confirmed | Client | "Your booking is confirmed! — {service} on {date}" |
| Gallery delivered | Client | "Your gallery is ready! — {title}" |
| New message received | Recipient | "New message from {sender} about {booking}" |
| Contract ready for signature | Client | "Your contract is ready to sign — {booking}" |
| Invoice generated | Client | "New invoice — ${amount} due by {date}" |

### 2. Supabase Edge Functions

Create `supabase/functions/notify/index.ts`:

```ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from 'https://esm.sh/resend@1.0.0'

const resend = new Resend(Deno.env.get('RESEND_API_KEY'))
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

serve(async (req) => {
  const { type, table, record } = await req.json()

  // Handle different events
  switch (`${table}.${type}`) {
    case 'inquiries.INSERT':
      await sendNewInquiryNotification(record)
      break
    case 'bookings.UPDATE':
      if (record.status === 'confirmed') {
        await sendBookingConfirmation(record)
      }
      break
    // ... other cases
  }

  return new Response('ok', { status: 200 })
})
```

**Deploy:**
```bash
npx supabase functions deploy notify
```

### 3. Database Webhook

In Supabase Dashboard → Database → Webhooks:

Create a webhook that triggers the Edge Function on:
- `inquiries` → `INSERT`
- `bookings` → `UPDATE` (where status = 'confirmed')
- `gallery_deliveries` → `INSERT`
- `messages` → `INSERT`
- `contracts` → `UPDATE` (where signed_by_client = true)

### 4. Email Templates

Create `src/emails/` directory with HTML email templates (or use Resend's React Email):

- `new-inquiry.html`
- `booking-confirmed.html`
- `gallery-ready.html`
- `new-message.html`
- `contract-ready.html`
- `invoice-generated.html`

Each template should include:
- HK Photo Lounge branding (logo, colors)
- Client name
- Relevant details (date, links)
- CTA button (e.g., "View Booking", "View Gallery", "Sign Contract")
- Footer with contact info

### 5. Local Testing

For local development without deploying Edge Functions:
- Use Supabase local development (`supabase start`)
- Or test email sending directly from the app using Resend's API:

```js
// Only for testing — not for production
const response = await fetch('/api/send-email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    to: email,
    subject: 'Test email from HK Photo Lounge',
    html: '<h1>Hello!</h1>',
  }),
})
```

---

## Part B: Polish & QA

### 1. Loading States

Every page that fetches data must show a loading state:

| Component | Loading Pattern |
|---|---|
| Lists (bookings, clients, galleries) | Skeleton rows/cards (3-6 placeholders) |
| Detail pages | Skeleton layout (matching the content structure) |
| Tables | Skeleton rows with shimmer animation |
| Charts | Pulsing placeholder with chart outline |
| Images | Low-res blur placeholder (blur-up technique) |

**Skeleton Component:**
Create `src/components/Skeleton.jsx`:

```jsx
export function Skeleton({ className }) {
  return (
    <div
      className={`animate-pulse bg-ink-200/20 rounded ${className}`}
    />
  )
}
```

Use Tailwind `animate-pulse` for shimmer effect.

### 2. Empty States

Every list/dashboard page should have a meaningful empty state:

| Page | Empty State Message | Action |
|---|---|---|
| Bookings | "No bookings yet. Submit an inquiry to get started!" | Link to /contact |
| Galleries | "No galleries delivered yet. Your photos will appear here after your shoot!" | — |
| Messages | "No messages yet. Send a message to your photographer about an active booking." | — |
| Documents | "No documents yet. Contracts and invoices will appear here." | — |
| Inspiration | "No inspiration images yet. Upload reference photos for your upcoming shoot!" | Upload button |
| Admin: Bookings | "No bookings found matching your filters." | Clear filters |
| Admin: Clients | "No clients registered yet." | — |
| Admin: Deliveries | "No gallery deliveries yet. Create one from a completed booking." | "Create Delivery" button |

### 3. Error States

Every data-fetching component must handle errors:

**Error UI Pattern:**
```
┌─────────────────────────┐
│  ⚠️ Something went wrong│
│                         │
│  We couldn't load your  │
│  bookings. Please try   │
│  again.                 │
│                         │
│  [Try Again]            │
└─────────────────────────┘
```

Implementation:
```jsx
if (error) {
  return (
    <div className="text-center py-12">
      <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
      <h3 className="mt-4 text-lg font-semibold">Something went wrong</h3>
      <p className="mt-2 text-sand-400">{error.message || 'Please try again.'}</p>
      <button onClick={refetch} className="mt-4 btn-primary">
        Try Again
      </button>
    </div>
  )
}
```

### 4. Global Error Boundary

Create `src/components/ErrorBoundary.jsx` to catch unhandled React errors:

- Logs error to console
- Shows a fallback UI with "Something went wrong" message
- "Refresh Page" button

Wrap the app or each portal layout:
```jsx
<ErrorBoundary fallback={<ErrorFallback />}>
  <PortalLayout />
</ErrorBoundary>
```

### 5. 404 Pages

| Scenario | Behavior |
|---|---|
| Invalid URL path | App's 404 page (or SPA fallback) |
| Invalid booking/gallery/document ID | Specific "not found" message with back link |
| API returns 404 | Handled by error state (same as above) |

### 6. Responsive Testing Checklist

- [ ] PortalLayout nav collapses to hamburger on mobile (< 768px)
- [ ] Booking cards stack to single column on mobile
- [ ] Gallery masonry grid reflows to single column
- [ ] Lightbox is full-screen on mobile
- [ ] Message input is usable on mobile keyboard
- [ ] Tables scroll horizontally on small screens
- [ ] Forms are full-width on mobile
- [ ] Buttons have adequate touch targets (min 44px)
- [ ] Admin sidebar collapses to icons-only or hamburger
- [ ] Charts resize to container width
- [ ] File upload drag zone works on touch devices

### 7. Accessibility Checklist

- [ ] All form inputs have labels
- [ ] Color contrast meets WCAG AA standards
- [ ] Focus indicators visible on all interactive elements
- [ ] Alt text on images
- [ ] ARIA labels on icon buttons
- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] Loading states announced by screen readers (aria-live)
- [ ] Error messages linked to inputs (aria-describedby)

### 8. Performance Checklist

- [ ] Lazy load routes (React.lazy + Suspense)
- [ ] Image lazy loading (loading="lazy")
- [ ] Debounce search inputs
- [ ] Paginate long lists (Supabase .range())
- [ ] Optimize Recharts (use lightweight components)
- [ ] Bundle analysis (npm run build && npx vite-bundle-analyzer)

---

## Verification Checklist

- [ ] Edge Functions deployed and linked to DB webhooks
- [ ] Email sent on new inquiry
- [ ] Email sent on booking confirmation
- [ ] Email sent on gallery delivery
- [ ] Email sent on new message
- [ ] Email templates render with correct branding
- [ ] All pages have loading skeletons
- [ ] All lists have empty states
- [ ] All data fetches have error handling with retry
- [ ] Global error boundary catches crashes
- [ ] Mobile responsive (tested at 375px, 768px, 1024px, 1440px)
- [ ] Focus indicators visible
- [ ] Keyboard navigation works end-to-end
- [ ] Routes are lazy loaded
- [ ] Build succeeds (`npm run build`)
