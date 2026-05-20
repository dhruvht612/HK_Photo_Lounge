# Admin — Gallery Delivery

> **Goal:** Allow the admin to upload and deliver photo galleries to clients. Client views and downloads them in their portal.

---

## 1. Overview

This feature spans two sides:

| Side | Page | Purpose |
|---|---|---|
| **Admin** | `/admin/deliveries` | List all gallery deliveries |
| **Admin** | `/admin/deliveries/new` | Create a delivery (select booking, upload photos) |
| **Admin** | `/admin/deliveries/:id` | Edit delivery (change title, add/remove images) |
| **Client** | `/portal/galleries` | View delivered albums |
| **Client** | `/portal/galleries/:id` | View photos + download |

This doc covers the **admin side only**. See `docs/phase-05-client-galleries-documents/README.md` for the client side.

---

## 2. Data Structures

### Store (localStorage / mock API)

**`galleryDeliveries`** — the delivery album itself:
```js
{
  id: 1,
  booking_id: 2,
  booking_label: "Wedding — Priya & Raj — May 15, 2026",
  title: "Wedding — Priya & Raj",
  created_at: "2026-05-20T12:00:00.000Z"
}
```

**`galleryImages`** — individual photos within a delivery:
```js
{
  id: 1,
  delivery_id: 1,
  image_path: "data:image/jpeg;base64,...",
  filename: "DSC_001.jpg",
  created_at: "2026-05-20T12:00:00.000Z"
}
```

### Supabase Tables (future)

See `docs/PRD.md` §5 for the PostgreSQL schema — `gallery_deliveries` and `gallery_images` tables.

---

## 3. Files to Create / Modify

| File | Action |
|---|---|
| `src/api/seedData.js` | Add empty arrays + `nextId` entries |
| `src/api/mockServer.js` | Add 7 new API routes |
| `src/pages/admin/AdminDeliveries.jsx` | **New** — list page |
| `src/pages/admin/AdminDeliveryEdit.jsx` | **New** — create/edit page |
| `src/App.jsx` | Add import + 3 routes |
| `src/layouts/AdminLayout.jsx` | Add nav link |

---

## 4. Seed Data Changes

**`src/api/seedData.js`** — inside the returned object, add:

```js
galleryDeliveries: [],
galleryImages: [],
```

Inside `nextId`, add:
```js
galleryDelivery: 1,
galleryImage: 1,
```

---

## 5. Mock API Routes

Add to **`src/api/mockServer.js`** (after the inquiries section, before the final `err(404)`).

### GET `/api/deliveries` — List all deliveries

```js
if (method === 'GET' && segments[0] === 'deliveries' && segments.length === 1) {
  requireAuth(authHeader);
  return store.galleryDeliveries
    .map((d) => ({
      ...d,
      image_count: store.galleryImages.filter((img) => img.delivery_id === d.id).length,
      cover_thumbnail: (() => {
        const first = store.galleryImages.find((img) => img.delivery_id === d.id);
        return first ? first.image_path : null;
      })(),
    }))
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}
```

### POST `/api/deliveries` — Create delivery

```js
if (method === 'POST' && segments[0] === 'deliveries' && segments.length === 1) {
  requireAuth(authHeader);
  const { booking_id, booking_label, title } = body || {};
  if (!booking_id || !title?.trim()) err(400, 'booking_id and title are required');
  const row = {
    id: nextId(store, 'galleryDelivery'),
    booking_id: Number(booking_id),
    booking_label: booking_label?.trim() || null,
    title: title.trim(),
    created_at: now,
  };
  store.galleryDeliveries.push(row);
  save();
  return row;
}
```

### GET `/api/deliveries/:id` — Get single delivery with images

```js
if (method === 'GET' && segments[0] === 'deliveries' && segments.length === 2) {
  requireAuth(authHeader);
  const id = Number(segments[1]);
  const delivery = store.galleryDeliveries.find((d) => d.id === id);
  if (!delivery) err(404, 'Delivery not found');
  const images = store.galleryImages
    .filter((img) => img.delivery_id === id)
    .sort((a, b) => a.id - b.id);
  return { ...delivery, images };
}
```

### PUT `/api/deliveries/:id` — Update delivery

```js
if (method === 'PUT' && segments[0] === 'deliveries' && segments.length === 2) {
  requireAuth(authHeader);
  const id = Number(segments[1]);
  const existing = store.galleryDeliveries.find((d) => d.id === id);
  if (!existing) err(404, 'Delivery not found');
  const { title } = body || {};
  if (title?.trim()) existing.title = title.trim();
  save();
  return existing;
}
```

### DELETE `/api/deliveries/:id` — Delete delivery + its images

```js
if (method === 'DELETE' && segments[0] === 'deliveries' && segments.length === 2) {
  requireAuth(authHeader);
  const id = Number(segments[1]);
  const existing = store.galleryDeliveries.find((d) => d.id === id);
  if (!existing) err(404, 'Delivery not found');
  store.galleryDeliveries = store.galleryDeliveries.filter((d) => d.id !== id);
  store.galleryImages = store.galleryImages.filter((img) => img.delivery_id !== id);
  save();
  return null;
}
```

### POST `/api/deliveries/:id/images` — Add image to delivery

```js
if (method === 'POST' && segments[0] === 'deliveries' && segments[2] === 'images' && segments.length === 3) {
  requireAuth(authHeader);
  const deliveryId = Number(segments[1]);
  if (!store.galleryDeliveries.some((d) => d.id === deliveryId)) err(404, 'Delivery not found');
  const { image_path, filename } = body || {};
  if (!image_path) err(400, 'image_path is required');
  const img = {
    id: nextId(store, 'galleryImage'),
    delivery_id: deliveryId,
    image_path,
    filename: filename || 'photo.jpg',
    created_at: now,
  };
  store.galleryImages.push(img);
  save();
  return img;
}
```

### DELETE `/api/deliveries/images/:imageId` — Remove image

```js
if (segments[0] === 'deliveries' && segments[1] === 'images' && segments.length === 3 && method === 'DELETE') {
  requireAuth(authHeader);
  const imageId = Number(segments[2]);
  const before = store.galleryImages.length;
  store.galleryImages = store.galleryImages.filter((img) => img.id !== imageId);
  if (store.galleryImages.length === before) err(404, 'Image not found');
  save();
  return null;
}
```

---

## 6. List Page — `AdminDeliveries.jsx`

Location: `src/pages/admin/AdminDeliveries.jsx`

Pattern follows `AdminPortfolio.jsx` exactly — same table structure, same loading/data flow, same delete pattern.

```jsx
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { ImagePlaceholder } from '../../components/ImagePlaceholder.jsx';

export function AdminDeliveries() {
  const { token } = useAuth();
  const [items, setItems] = useState([]);

  function load() {
    api.get('/api/deliveries', { token }).then(setItems);
  }

  useEffect(() => { load(); }, [token]);

  async function remove(id) {
    if (!confirm('Delete this gallery delivery and all its photos?')) return;
    await api.delete(`/api/deliveries/${id}`, { token });
    load();
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-sand-50">Deliveries</h1>
          <p className="mt-1 text-sm text-sand-200/50">Manage photo galleries delivered to clients.</p>
        </div>
        <Link
          to="/admin/deliveries/new"
          className="rounded-full bg-accent px-5 py-2 text-sm font-medium text-ink-950 hover:bg-accent/90"
        >
          Create Delivery
        </Link>
      </div>
      <div className="mt-8 overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-white/10 bg-ink-900/80 text-sand-200/60">
            <tr>
              <th className="px-4 py-3">Cover</th>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Photos</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-sand-200/40">
                  No deliveries yet. Create one from a completed booking.
                </td>
              </tr>
            )}
            {items.map((d) => (
              <tr key={d.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                <td className="px-4 py-3">
                  <div className="h-12 w-16 overflow-hidden rounded-md">
                    {d.cover_thumbnail ? (
                      <img src={d.cover_thumbnail} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <ImagePlaceholder className="h-full w-full" />
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 font-medium text-sand-100">{d.title}</td>
                <td className="px-4 py-3 text-sand-200/70">{d.booking_label || '—'}</td>
                <td className="px-4 py-3 text-sand-200/70">{d.image_count}</td>
                <td className="px-4 py-3 text-right">
                  <Link to={`/admin/deliveries/${d.id}`} className="text-accent hover:underline">Edit</Link>
                  <button type="button" onClick={() => remove(d.id)} className="ml-3 text-red-400/80 hover:underline">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

---

## 7. Create/Edit Page — `AdminDeliveryEdit.jsx`

Location: `src/pages/admin/AdminDeliveryEdit.jsx`

Pattern follows `AdminPortfolioEdit.jsx` — same form layout, upload pattern, save/reload cycle.

**States to handle:**
- **Loading:** Fetching existing delivery data for edit mode (skeleton text)
- **Editing existing:** Pre-populate form + show existing images
- **New:** Empty form with booking dropdown

```jsx
import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { ImagePlaceholder } from '../../components/ImagePlaceholder.jsx';

export function AdminDeliveryEdit() {
  const { id } = useParams();
  const isNew = id === 'new' || !id;
  const navigate = useNavigate();
  const { token } = useAuth();
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ booking_id: '', title: '' });
  const [images, setImages] = useState([]);

  useEffect(() => {
    // Load completed bookings for the dropdown
    api.get('/api/bookings?status=completed', { token })
      .then(setBookings)
      .catch(() => {});
  }, [token]);

  useEffect(() => {
    if (isNew) { setLoading(false); return; }
    api.get(`/api/deliveries/${id}`, { token })
      .then((data) => {
        setForm({ booking_id: String(data.booking_id || ''), title: data.title });
        setImages(data.images || []);
      })
      .finally(() => setLoading(false));
  }, [id, isNew, token]);

  function autoFillTitle(bookingId) {
    const b = bookings.find((bk) => String(bk.id) === bookingId);
    if (b) setForm((f) => ({ ...f, booking_id: bookingId, title: `${b.service_name || b.title} — ${b.client_name}` }));
    else setForm((f) => ({ ...f, booking_id: bookingId }));
  }

  async function onFiles(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      // In new mode, save delivery first
      let deliveryId = id;
      if (isNew) {
        const created = await api.post('/api/deliveries', form, { token });
        deliveryId = String(created.id);
        navigate(`/admin/deliveries/${created.id}`, { replace: true });
        setLoading(false);
      }
      // Upload each image
      for (const file of files) {
        const { path } = await api.upload(file, { token });
        await api.post(`/api/deliveries/${deliveryId}/images`, { image_path: path, filename: file.name }, { token });
      }
      // Reload images
      const data = await api.get(`/api/deliveries/${deliveryId}`, { token });
      setImages(data.images || []);
    } catch (err) {
      alert(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function removeImage(imageId) {
    if (!confirm('Remove this image?')) return;
    await api.delete(`/api/deliveries/images/${imageId}`, { token });
    setImages((imgs) => imgs.filter((x) => x.id !== imageId));
  }

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (isNew) {
        const created = await api.post('/api/deliveries', form, { token });
        navigate(`/admin/deliveries/${created.id}`, { replace: true });
        return;
      }
      await api.put(`/api/deliveries/${id}`, form, { token });
      alert('Saved.');
    } catch (err) {
      alert(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-sand-200/50">Loading…</p>;

  return (
    <div>
      <h1 className="font-display text-3xl text-sand-50">
        {isNew ? 'New delivery' : 'Edit delivery'}
      </h1>
      <form onSubmit={save} className="mt-8 max-w-2xl space-y-5">
        <label className="block text-sm">
          <span className="text-sand-200/70">Booking *</span>
          <select
            required
            value={form.booking_id}
            onChange={(e) => autoFillTitle(e.target.value)}
            className="mt-1 w-full rounded-lg border border-white/10 bg-ink-950 px-3 py-2 text-sand-100"
          >
            <option value="">Select a completed booking…</option>
            {bookings.map((b) => (
              <option key={b.id} value={b.id}>
                {b.service_name || b.title} — {b.client_name} — {b.event_date}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="text-sand-200/70">Title *</span>
          <input
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="mt-1 w-full rounded-lg border border-white/10 bg-ink-950 px-3 py-2 text-sand-100"
          />
        </label>

        <button
          type="submit"
          className="rounded-full bg-accent px-6 py-2 text-sm font-medium text-ink-950 hover:bg-accent/90"
          disabled={saving}
        >
          {saving ? 'Saving…' : isNew ? 'Create delivery' : 'Save changes'}
        </button>
      </form>

      <div className="mt-12 max-w-2xl">
        <h2 className="font-display text-xl text-sand-50">Photos</h2>
        <p className="mt-1 text-sm text-sand-200/50">
          {isNew ? 'Save the delivery first, then upload photos.' : 'Upload multiple photos at once.'}
        </p>
        {!isNew && (
          <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm hover:bg-white/5">
            {uploading ? 'Uploading…' : 'Add photos'}
            <input type="file" accept="image/*" multiple className="hidden" onChange={onFiles} disabled={uploading} />
          </label>
        )}
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {images.map((img) => (
            <div key={img.id} className="overflow-hidden rounded-lg border border-white/10">
              <img src={img.image_path} alt="" className="aspect-square w-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(img.id)}
                className="w-full py-1 text-xs text-red-400/90 hover:underline"
              >
                Remove
              </button>
            </div>
          ))}
          {images.length === 0 && !isNew && (
            <div className="col-span-full py-12 text-center text-sm text-sand-200/40">
              No photos yet. Click "Add photos" to upload images.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

**Key form states:**
- **New + no bookings selected:** "Add photos" button is hidden (text says "Save the delivery first, then upload photos.")
- **Editing existing + no images:** Shows "No photos yet" empty state
- **Uploading:** Button text changes to "Uploading…", input disabled
- **Saving:** Submit button text changes to "Saving…", button disabled

---

## 8. Route Updates — `src/App.jsx`

Add imports:
```jsx
import { AdminDeliveries } from './pages/admin/AdminDeliveries.jsx';
import { AdminDeliveryEdit } from './pages/admin/AdminDeliveryEdit.jsx';
```

Add inside the protected admin layout route block (after existing routes):
```jsx
<Route path="deliveries" element={<AdminDeliveries />} />
<Route path="deliveries/new" element={<AdminDeliveryEdit />} />
<Route path="deliveries/:id" element={<AdminDeliveryEdit />} />
```

---

## 9. Nav Link — `src/layouts/AdminLayout.jsx`

Insert into the `links` array (e.g., after `Categories`):
```js
{ to: '/admin/deliveries', label: 'Deliveries' },
```

---

## 10. Wireframe

```
┌──────────────────────────────────────────────────────────┐
│  Admin                                                    │
│  HK Photo Lounge                          [Log out]      │
│  admin@hkphotolounge.com                                  │
├──────────────────────────────────────────────────────────┤
│  Overview  Portfolio  Categories  Deliveries  Services …  │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  Deliveries                              [Create Delivery]│
│  Manage photo galleries delivered to clients.             │
│                                                           │
│  ┌──────────────────────────────────────────────────────┐│
│  │  Cover  │  Title              │  Client    │  Photos ││
│  ├──────────────────────────────────────────────────────┤│
│  │ [img]   │  Wedding — Priya    │  Wedding…  │  24  E D││
│  │ [img]   │  Portraits — Raj    │  Portrait… │  12  E D││
│  │ [img]   │  Maternity — Anya   │  Maternity…│   8  E D││
│  └──────────────────────────────────────────────────────┘│
│                                                           │
└──────────────────────────────────────────────────────────┘
```

---

## 11. Verification Checklist

- [ ] List page shows all deliveries with cover thumbnail, title, client, photo count
- [ ] Empty state shown when no deliveries exist
- [ ] "Create Delivery" navigates to the form
- [ ] Booking dropdown populates with completed bookings
- [ ] Title auto-fills when a booking is selected
- [ ] Form requires booking + title before save
- [ ] New delivery creates record and redirects to edit page
- [ ] Bulk image upload works (multiple files at once)
- [ ] Upload progress visible (button text changes)
- [ ] Image grid shows after upload
- [ ] Remove image works with confirmation
- [ ] Edit page loads existing data correctly
- [ ] Save changes updates the delivery title
- [ ] Delete from list removes delivery + all images
- [ ] Nav link appears in admin header
- [ ] Loading/empty/error states handled on both pages
- [ ] Existing admin pages unaffected
