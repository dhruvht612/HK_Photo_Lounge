# Phase 6 — Client Inspiration Board

> **Goal:** Clients can upload reference/inspiration images per booking, organized in a mood board layout. Both client and admin can view and manage these.

---

## 1. Files to Create

```
src/pages/portal/
└── PortalInspiration.jsx     # Inspiration board per booking
```

---

## 2. Supabase Queries

Create `src/supabase/queries/inspiration.js`:

```js
import { supabase } from '../client'

export async function getInspirationImages(bookingId) {
  return await supabase
    .from('inspiration_images')
    .select('*')
    .eq('booking_id', bookingId)
    .order('sort_order', { ascending: true })
}

export async function uploadInspirationImage(bookingId, file, userId) {
  const fileExt = file.name.split('.').pop()
  const fileName = `${userId}/${bookingId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`
  const filePath = `inspiration-images/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('inspiration-images')
    .upload(filePath, file)

  if (uploadError) return { error: uploadError }

  const { data: { publicUrl } } = supabase.storage
    .from('inspiration-images')
    .getPublicUrl(filePath)

  const { data, error } = await supabase
    .from('inspiration_images')
    .insert({
      booking_id: bookingId,
      url: publicUrl,
      filename: file.name,
      uploaded_by: userId,
    })
    .select()
    .single()

  return { data, error }
}

export async function deleteInspirationImage(imageId) {
  return await supabase
    .from('inspiration_images')
    .delete()
    .eq('id', imageId)
}

export async function reorderInspirationImages(images) {
  // images = [{ id, sort_order }, ...]
  const updates = images.map(img => ({
    id: img.id,
    sort_order: img.sort_order,
  }))
  // Supabase doesn't support bulk update easily; loop or use upsert
  for (const update of updates) {
    await supabase
      .from('inspiration_images')
      .update({ sort_order: update.sort_order })
      .eq('id', update.id)
  }
}
```

---

## 3. DB Table

Add this table to Supabase (if not created in Phase 1):

```sql
CREATE TABLE inspiration_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  filename TEXT,
  uploaded_by UUID REFERENCES profiles(id),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

Enable RLS:
```sql
ALTER TABLE inspiration_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Client and admin access inspiration"
  ON inspiration_images FOR ALL
  USING (
    booking_id IN (
      SELECT id FROM bookings WHERE client_id = auth.uid()
    )
    OR auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );
```

---

## 4. Inspiration Board Page

`src/pages/portal/PortalInspiration.jsx`:

Route: `/portal/inspiration?booking=:bookingId`

**Layout:**

```
┌─────────────────────────────────────────────┐
│ Inspiration Board — Wedding Photography      │
│ [Add Photos] [← Back to Bookings]           │
├─────────────────────────────────────────────┤
│                                             │
│  ┌──────┐ ┌──────┐ ┌──────┐                │
│  │ img  │ │ img  │ │ img  │                │
│  │  ✕   │ │  ✕   │ │  ✕   │                │
│  └──────┘ └──────┘ └──────┘                │
│  ┌──────┐ ┌──────┐ ┌──────┐                │
│  │  +   │ │ img  │ │ img  │                │
│  │Upload│ │  ✕   │ │  ✕   │                │
│  └──────┘ └──────┘ └──────┘                │
│                                             │
└─────────────────────────────────────────────┘
```

**Features:**

**a) Upload:**
- "Add Photos" button opens file picker (multiple files allowed)
- Drag-and-drop zone
- Upload progress bar (per file or batch)
- Accepted formats: JPG, PNG, WebP, HEIC
- Max file size: 15MB per image

**b) Grid Layout:**
- Masonry or uniform grid of uploaded reference images
- Each image card:
  - Thumbnail preview
  - Delete button (X) on hover
  - Filename tooltip

**c) Delete:**
- Confirmation dialog before delete ("Remove this inspiration image?")
- Instant removal from grid after confirmation

**d) Reorder (Optional):**
- Drag-and-drop reordering using `@dnd-kit/core` or similar
- Sort order saved to DB on drop

---

## 5. Booking Selector

Since the page shows inspiration for one booking at a time, add a dropdown/selector at the top to switch between the client's bookings:

```jsx
<select onChange={(e) => setSelectedBooking(e.target.value)}>
  {bookings.map(b => (
    <option key={b.id} value={b.id}>
      {b.services?.name} — {new Date(b.event_date).toLocaleDateString()}
    </option>
  ))}
</select>
```

---

## 6. Route Update

```jsx
<Route path="/portal/inspiration" element={<PortalInspiration />} />
```

---

## 7. Verification Checklist

- [ ] Inspiration page shows correct images for selected booking
- [ ] Upload works (single and multiple files)
- [ ] Upload progress indicator visible
- [ ] Images appear in grid immediately after upload
- [ ] Delete works with confirmation dialog
- [ ] Drag-and-drop upload zone works
- [ ] Booking selector switches between bookings
- [ ] Image grid is responsive (reflows on resize)
- [ ] Empty state: "No inspiration images yet. Start by uploading some!"
- [ ] Loading skeleton while images fetch
- [ ] Error state with retry
- [ ] Admin can also view inspiration images (in admin portal)
- [ ] RLS enforced: client sees only their own bookings
