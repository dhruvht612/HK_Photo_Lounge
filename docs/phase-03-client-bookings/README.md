# Phase 3 — Client Bookings & Status Tracking

> **Goal:** Clients can view their booking history, see status updates, and track their inquiry-to-completion pipeline.

---

## 1. Files to Create

```
src/pages/portal/
├── PortalBookings.jsx        # Bookings list
└── PortalBookingDetail.jsx   # Single booking view
```

---

## 2. Supabase Queries

Create `src/supabase/queries/bookings.js`:

```js
import { supabase } from '../client'

export async function getClientBookings(userId) {
  return await supabase
    .from('bookings')
    .select('*, services(name, slug), inquiries(message)')
    .eq('client_id', userId)
    .order('created_at', { ascending: false })
}

export async function getClientBookingById(bookingId, userId) {
  return await supabase
    .from('bookings')
    .select('*, services(*), inquiries(*), contracts(*), invoices(*)')
    .eq('id', bookingId)
    .eq('client_id', userId)
    .single()
}

export async function getClientInquiries(userId) {
  // Inquiries that haven't been converted to bookings yet
  return await supabase
    .from('inquiries')
    .select('*, services(name)')
    .eq('client_id', userId)
    .in('status', ['pending', 'contacted'])
    .order('created_at', { ascending: false })
}
```

---

## 3. Bookings List Page

`src/pages/portal/PortalBookings.jsx`:

**Layout:**
- Page title: "My Bookings"
- Tabs/filters: **All** | **Upcoming** | **Past** | **Cancelled**
- Each booking displayed as a card:

```
┌──────────────────────────────────────────┐
│ [Status Badge]                            │
│                                          │
│ Wedding Photography                       │
│ 📅 May 15, 2026 · Brampton, ON           │
│                                          │
│ ┌──────┐ ┌────────┐ ┌───────────┐       │
│ │ View  │ │Message │ │ Gallery   │       │
│ └──────┘ └────────┘ └───────────┘       │
└──────────────────────────────────────────┘
```

**Status Badges:**
- `confirmed` → **Confirmed** (blue)
- `completed` → **Completed** (green)
- `cancelled` → **Cancelled** (red)

**States:**
- **Loading:** Skeleton cards (3 placeholder cards)
- **Empty:** "No bookings yet. Have you submitted an inquiry?" + link to /contact
- **Error:** "Something went loading your bookings. Try again." + retry button

**Data:**
```js
const { data: bookings, error, isLoading } = useQuery(
  ['bookings', userId],
  () => getClientBookings(userId)
)
```

---

## 4. Booking Detail Page

`src/pages/portal/PortalBookingDetail.jsx`:

Route: `/portal/bookings/:id`

**Sections:**

**a) Header:**
- Service name, event date, location
- Status badge (large)
- Booking ID (reference number)

**b) Status Timeline:**

A vertical timeline showing key milestones with dates:

```
✅ Inquiry Submitted        — Jan 10, 2026
✅ Booking Confirmed        — Jan 12, 2026
⏳ Photo Session            — May 15, 2026
⬜ Gallery Delivered
⬜ Contract Signed
```

**c) Quick Actions:**
- "Send a Message" → links to messaging for this booking
- "View Gallery" → links to gallery (if completed)
- "View Contract" → links to documents (if contract exists)
- "Upload Inspiration" → links to inspiration board

**d) Booking Details Card:**
- Service
- Event date
- Location
- Photographer notes (admin only → shown as read-only to client)

**e) Links to Related Items:**
- Contract status (signed/unsigned)
- Invoice status (pending/paid)
- Gallery (if delivered)

**States:**
- **Loading:** Skeleton detail layout
- **Error:** "Booking not found" or error message
- **Not Found:** "This booking doesn't exist" with link back to bookings list

---

## 5. Route Updates in App.jsx

```jsx
<Route path="/portal/bookings" element={<PortalBookings />} />
<Route path="/portal/bookings/:id" element={<PortalBookingDetail />} />
```

---

## 6. Status Tracking Logic

The status flow:

```
pending (inquiry)
   ↓
contacted (inquiry)
   ↓
booked (inquiry) → confirmed (booking)
                      ↓
                 completed (booking)
                      ↓
                 [gallery delivered]
```

- `inquiries.status` captures the pre-booking pipeline
- `bookings.status` captures the post-booking pipeline
- The timeline component reads both tables

---

## 7. Linking Inquiries to Bookings

When admin converts an inquiry to a booking, the `inquiry_id` FK links them. The client sees both pending inquiries and confirmed bookings in the same list (or separate sections).

---

## 8. Verification Checklist

- [ ] Bookings list shows all client bookings
- [ ] Filter tabs work (All, Upcoming, Past, Cancelled)
- [ ] Empty state shown when no bookings exist
- [ ] Loading skeleton visible during fetch
- [ ] Error state with retry button
- [ ] Booking detail page loads correct booking
- [ ] Status timeline renders with correct milestones
- [ ] Quick action buttons link to correct pages
- [ ] 404 handled for invalid booking IDs
- [ ] Mobile responsive (card layout stacks)
