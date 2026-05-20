# Phase 5 — Client Galleries & Documents

> **Goal:** Clients can view and download delivered photo galleries, sign contracts digitally, and view invoices.

---

## 1. Files to Create

```
src/pages/portal/
├── PortalGalleries.jsx         # Gallery list
├── PortalGalleryView.jsx       # Single gallery viewer
├── PortalDocuments.jsx         # Contracts & invoices list
├── PortalContractSign.jsx      # Contract viewer + signature
└── PortalInvoices.jsx          # Invoice list

src/components/
├── Lightbox.jsx                # Full-screen image viewer
├── SignaturePad.jsx            # Canvas-based signature input
└── StatusBadge.jsx             # Reusable status badge (paid, pending, etc.)
```

---

## 2. Supabase Queries

Create `src/supabase/queries/galleries.js`:

```js
import { supabase } from '../client'

export async function getClientGalleries(userId) {
  return await supabase
    .from('gallery_deliveries')
    .select('*, bookings(client_id), gallery_images(*)')
    .eq('bookings.client_id', userId)
    .order('created_at', { ascending: false })
}

export async function getGalleryById(galleryId) {
  return await supabase
    .from('gallery_deliveries')
    .select('*, gallery_images(*), bookings(service_id, services(name))')
    .eq('id', galleryId)
    .single()
}
```

Create `src/supabase/queries/documents.js`:

```js
import { supabase } from '../client'

export async function getClientContracts(userId) {
  return await supabase
    .from('contracts')
    .select('*, bookings(client_id, services(name))')
    .eq('bookings.client_id', userId)
    .order('created_at', { ascending: false })
}

export async function getClientInvoices(userId) {
  return await supabase
    .from('invoices')
    .select('*, bookings(client_id, services(name))')
    .eq('bookings.client_id', userId)
    .order('created_at', { ascending: false })
}

export async function signContract(contractId) {
  return await supabase
    .from('contracts')
    .update({ signed_at: new Date().toISOString(), signed_by_client: true })
    .eq('id', contractId)
    .select()
    .single()
}
```

---

## 3. Gallery List Page

`src/pages/portal/PortalGalleries.jsx`:

Route: `/portal/galleries`

**Layout:**
- Grid of album cards (2-3 columns desktop, 1 column mobile)
- Each card:
  - Cover image (first gallery image or placeholder)
  - Album title
  - Photo count
  - Delivery date

```
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│   [cover]   │ │   [cover]   │ │   [cover]   │
│             │ │             │ │             │
│ Wedding     │ │ Engagement  │ │ Maternity   │
│ 45 photos   │ │ 22 photos   │ │ 18 photos   │
│ May 2026    │ │ Apr 2026    │ │ Mar 2026    │
└─────────────┘ └─────────────┘ └─────────────┘
```

**States:**
- **Loading:** Skeleton grid (6 placeholder cards)
- **Empty:** "No galleries delivered yet. Your photos will appear here after your shoot!"
- **Error:** Error message with retry

---

## 4. Gallery Viewer

`src/pages/portal/PortalGalleryView.jsx`:

Route: `/portal/galleries/:id`

**Features:**
- **Header:** Album title, photo count, "Download All" button (triggers ZIP download via Edge Function)
- **Masonry Grid:** Photos in a masonry layout with lazy loading
- **Hover:** Slight zoom overlay with download icon
- **Lightbox:** Click photo to open full-screen viewer

**Lightbox Component (`Lightbox.jsx`):**
- Full-screen overlay
- Navigation arrows (prev/next)
- Image counter ("3 of 45")
- Download button (individual image)
- Close via X button, Escape key, or click outside
- Keyboard navigation (arrow keys)
- Touch swipe support (mobile)

**Download All:**
```js
// Trigger ZIP download (requires Supabase Edge Function — future)
// For now, download each image individually
const downloadImage = async (url, filename) => {
  const response = await fetch(url)
  const blob = await response.blob()
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
  URL.revokeObjectURL(link)
}
```

**States:**
- **Loading:** Skeleton masonry grid
- **Empty:** "No photos in this album yet"
- **Error:** Error message with retry

---

## 5. Documents Page

`src/pages/portal/PortalDocuments.jsx`:

Route: `/portal/documents`

**Two sections (tabs or separate cards):**

### a) Contracts

- List of contracts with:
  - Title (e.g., "Wedding Photography Contract")
  - Booking reference
  - Status: **Signed** (green) or **Pending** (orange)
  - Date
  - Actions: **View** / **Sign**

### b) Invoices

- List of invoices with:
  - Invoice number / title
  - Amount ($)
  - Status badge: **Paid** (green), **Pending** (yellow), **Overdue** (red)
  - Due date
  - Actions: **View PDF** / **Pay** (future Stripe integration)

---

## 6. Contract Viewer & Signature

`src/pages/portal/PortalContractSign.jsx`:

Route: `/portal/documents/contract/:id`

**Sections:**
1. **Contract Preview** — PDF displayed in iframe or using a PDF viewer library
2. **Signature Pad** — Canvas element for drawing signature
   - Clear button to redo
   - Styling: dark ink on light background, matches brand colors
3. **Sign & Accept** — Button that submits:

```js
const handleSign = async () => {
  const signatureDataUrl = signaturePadRef.current.toDataURL()
  // Upload signature image to Supabase Storage
  const { url } = await uploadSignature(signatureDataUrl, contractId)
  // Update contract record
  await signContract(contractId, url)
}
```

4. **Already Signed** — Show signed date and signature image instead of signature pad

---

## 7. Invoice Detail View

`src/pages/portal/PortalInvoices.jsx`:

Route: `/portal/documents/invoices`

**Features:**
- Table or card list of invoices
- Sortable by date, amount, status
- Click to view full invoice (PDF or generated HTML)
- "Pay Now" button (disabled for now — future Stripe integration)

---

## 8. Route Updates

```jsx
<Route path="/portal/galleries" element={<PortalGalleries />} />
<Route path="/portal/galleries/:id" element={<PortalGalleryView />} />
<Route path="/portal/documents" element={<PortalDocuments />} />
<Route path="/portal/documents/contract/:id" element={<PortalContractSign />} />
<Route path="/portal/documents/invoices" element={<PortalInvoices />} />
```

---

## 9. Verification Checklist

- [ ] Gallery list loads delivered albums
- [ ] Gallery viewer renders masonry grid of photos
- [ ] Lightbox opens with keyboard/touch navigation
- [ ] Individual photo download works
- [ ] "Download All" initiates download (or graceful fallback)
- [ ] Documents page shows contracts and invoices
- [ ] Contract viewer renders PDF
- [ ] Signature pad captures and saves signature
- [ ] Signed contract shows signature and date
- [ ] Invoice list shows all invoices with correct statuses
- [ ] Loading/empty/error states for all pages
- [ ] Mobile responsive (galleries stack to single column)
- [ ] RLS enforced (client sees only their own galleries/documents)
