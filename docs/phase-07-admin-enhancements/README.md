# Phase 7 — Admin Portal Enhancements

> **Goal:** Add booking management, client management, analytics dashboard, and gallery delivery upload tool to the admin portal.

---

## 1. Files to Create

```
src/pages/admin/
├── AdminBookings.jsx           # Booking list & management
├── AdminBookingDetail.jsx      # Single booking view
├── AdminClients.jsx            # Client list
├── AdminClientDetail.jsx       # Client profile + history
├── AdminAnalytics.jsx          # Charts & metrics
├── AdminDeliveries.jsx         # Gallery delivery list
└── AdminDeliveryEdit.jsx       # Create/edit gallery delivery

src/components/
├── DataTable.jsx               # Reusable sortable table
├── StatusDropdown.jsx          # Inline status changer
└── StatCard.jsx                # Dashboard metric card
```

---

## 2. Supabase Queries

Create `src/supabase/queries/admin.js`:

```js
import { supabase } from '../client'

// --- BOOKINGS ---

export async function getAllBookings() {
  return await supabase
    .from('bookings')
    .select('*, profiles(name, email, phone), services(name)')
    .order('created_at', { ascending: false })
}

export async function getBookingById(id) {
  return await supabase
    .from('bookings')
    .select('*, profiles(*), services(*), inquiries(*), contracts(*), invoices(*), gallery_deliveries(*)')
    .eq('id', id)
    .single()
}

export async function updateBookingStatus(id, status) {
  return await supabase
    .from('bookings')
    .update({ status })
    .eq('id', id)
    .select()
    .single()
}

export async function createBooking(data) {
  return await supabase
    .from('bookings')
    .insert(data)
    .select()
    .single()
}

// --- CLIENTS ---

export async function getAllClients() {
  return await supabase
    .from('profiles')
    .select('*, bookings(count), inquiries(count)')
    .eq('role', 'client')
    .order('created_at', { ascending: false })
}

export async function getClientById(id) {
  return await supabase
    .from('profiles')
    .select('*, bookings(*, services(name)), inquiries(*, services(name))')
    .eq('id', id)
    .single()
}

// --- ANALYTICS ---

export async function getMonthlyBookings(year) {
  return await supabase
    .from('bookings')
    .select('created_at, status')
    .gte('created_at', `${year}-01-01`)
    .lte('created_at', `${year}-12-31`)
}

export async function getServicePopularity() {
  return await supabase
    .from('bookings')
    .select('services(name)')
}

export async function getInquiryConversionRate() {
  const { count: total } = await supabase
    .from('inquiries')
    .select('*', { count: 'exact', head: true })

  const { count: converted } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })

  return { total, converted, rate: total > 0 ? (converted / total) * 100 : 0 }
}

// --- GALLERY DELIVERY ---

export async function createGalleryDelivery(data) {
  return await supabase
    .from('gallery_deliveries')
    .insert(data)
    .select()
    .single()
}

export async function uploadGalleryImage(deliveryId, file, adminId) {
  const fileExt = file.name.split('.').pop()
  const fileName = `deliveries/${deliveryId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`
  const filePath = `gallery-deliveries/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('gallery-deliveries')
    .upload(filePath, file)

  if (uploadError) return { error: uploadError }

  const { data: { publicUrl } } = supabase.storage
    .from('gallery-deliveries')
    .getPublicUrl(filePath)

  const { data, error } = await supabase
    .from('gallery_images')
    .insert({
      delivery_id: deliveryId,
      url: publicUrl,
      filename: file.name,
    })
    .select()
    .single()

  return { data, error }
}

export async function deleteGalleryImage(imageId) {
  return await supabase
    .from('gallery_images')
    .delete()
    .eq('id', imageId)
}
```

---

## 3. Booking Management

### List Page (`AdminBookings.jsx`)

Route: `/admin/bookings`

**Features:**
- Table with columns: Client, Service, Date, Status, Created
- Status filter tabs: **All | Confirmed | Completed | Cancelled**
- Search by client name or email
- Click row → booking detail page
- Inline status dropdown to quickly update status

**DataTable Component:**
Reusable table with:
- Sortable columns (click header to sort)
- Search/filter input
- Pagination (10/25/50 per page)
- Loading skeleton rows
- Empty state

### Detail Page (`AdminBookingDetail.jsx`)

Route: `/admin/bookings/:id`

**Sections:**
1. **Client Info Card** — name, email, phone, link to client detail
2. **Booking Details** — service, date, location, notes (editable)
3. **Status Timeline** — full history of status changes
4. **Inquiry Reference** — original inquiry message
5. **Linked Items** — contracts, invoices, gallery deliveries
6. **Actions:**
   - Change status dropdown
   - "Send Message" → opens messaging for this booking (in admin or redirect to client thread)
   - "Create Gallery Delivery" → link to delivery creation
   - "Add Contract" → upload contract PDF
   - "Add Invoice" → create invoice record

---

## 4. Client Management

### List Page (`AdminClients.jsx`)

Route: `/admin/clients`

**Features:**
- Table: Name, Email, Phone, Bookings Count, Last Activity, Joined Date
- Search by name/email
- Click row → client detail page

### Detail Page (`AdminClientDetail.jsx`)

Route: `/admin/clients/:id`

**Sections:**
1. **Profile Card** — name, email, phone, avatar, member since
2. **Booking History** — list of all client bookings with statuses
3. **Inquiry History** — past inquiries submitted
4. **Message History** — recent messages (link to full thread)

---

## 5. Analytics Dashboard

`src/pages/admin/AdminAnalytics.jsx`:

Route: `/admin/analytics`

**Charts (using Recharts):**

**a) Monthly Bookings Trend (Line Chart)**
- X-axis: Months (Jan–Dec)
- Y-axis: Count
- Lines: Confirmed, Completed, Cancelled
- Year selector

**b) Service Popularity (Bar Chart or Pie Chart)**
- Shows count of bookings per service
- Helps identify most popular offerings

**c) Inquiry Conversion Funnel**
- Total Inquiries → Contacted → Booked → Completed
- Visual funnel with counts and percentages

**d) Quick Stats Cards**
- Total clients
- Total bookings (this year)
- Conversion rate (%)
- Average bookings per client

**Install Recharts:**
```bash
npm install recharts
```

---

## 6. Gallery Delivery

See the dedicated implementation doc: [`docs/admin-gallery-delivery/README.md`](../admin-gallery-delivery/README.md)

This covers the full implementation — seed data, mock API routes, list page, create/edit page with bulk image upload, route updates, nav link, and all UI states.

---

## 7. Admin Nav Update

Add to `AdminLayout.jsx` sidebar:

```
📊 Overview        (/admin)
🖼 Portfolio       (/admin/portfolio)
🏷 Categories      (/admin/categories)
📸 Services        (/admin/services)
💬 Testimonials    (/admin/testimonials)
📨 Inquiries       (/admin/inquiries)
📅 Bookings        (/admin/bookings)        ← NEW
👥 Clients         (/admin/clients)         ← NEW
📦 Gallery Deliveries  (/admin/deliveries)  ← NEW
📈 Analytics       (/admin/analytics)       ← NEW
⚙ Settings        (/admin/settings)
```

---

## 8. Route Updates

```jsx
<Route path="/admin/bookings" element={<AdminBookings />} />
<Route path="/admin/bookings/:id" element={<AdminBookingDetail />} />
<Route path="/admin/clients" element={<AdminClients />} />
<Route path="/admin/clients/:id" element={<AdminClientDetail />} />
<Route path="/admin/analytics" element={<AdminAnalytics />} />
<Route path="/admin/deliveries" element={<AdminDeliveries />} />
<Route path="/admin/deliveries/new" element={<AdminDeliveryEdit />} />
<Route path="/admin/deliveries/:id" element={<AdminDeliveryEdit />} />
```

---

## 9. Verification Checklist

- [ ] Bookings list loads with all bookings
- [ ] Status filter tabs work correctly
- [ ] Inline status update saves to DB
- [ ] Booking detail shows all linked data
- [ ] Client list shows all registered clients
- [ ] Client detail shows booking/inquiry history
- [ ] Analytics renders charts with real data
- [ ] Gallery delivery creation works with file upload
- [ ] Bulk image upload shows progress
- [ ] Uploaded images appear in gallery view (client side)
- [ ] Delete image from delivery works
- [ ] All new nav items appear in sidebar
- [ ] Loading/empty/error states for all pages
- [ ] Admin routes protected against client role access
