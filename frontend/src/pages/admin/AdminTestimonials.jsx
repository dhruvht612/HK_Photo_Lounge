import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { assetUrl } from '../../lib/assets.js';
import { ImagePlaceholder } from '../../components/ImagePlaceholder.jsx';

const empty = {
  client_name: '',
  quote: '',
  role_or_event: '',
  image_path: '',
  rating: 5,
  is_featured: false,
  sort_order: 0,
  published: true,
};

export function AdminTestimonials() {
  const { token } = useAuth();
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [uploading, setUploading] = useState(false);

  function load() {
    api.get('/api/testimonials?admin=1', { token }).then(setRows);
  }

  useEffect(() => {
    load();
  }, [token]);

  async function uploadFile(file) {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/uploads`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upload failed');
    return data.path;
  }

  async function onImage(e, isEdit) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const path = await uploadFile(file);
      if (isEdit) setEditing((ed) => (ed ? { ...ed, image_path: path } : ed));
      else setForm((f) => ({ ...f, image_path: path }));
    } catch (err) {
      alert(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function create(e) {
    e.preventDefault();
    await api.post('/api/testimonials', form, { token });
    setForm(empty);
    load();
  }

  async function saveEdit(e) {
    e.preventDefault();
    if (!editing) return;
    await api.put(`/api/testimonials/${editing.id}`, editing, { token });
    setEditing(null);
    load();
  }

  async function remove(id) {
    if (!confirm('Delete this testimonial?')) return;
    await api.delete(`/api/testimonials/${id}`, { token });
    load();
  }

  return (
    <div>
      <h1 className="font-display text-3xl text-sand-50">Testimonials</h1>
      <form
        onSubmit={create}
        className="mt-8 space-y-4 rounded-xl border border-white/10 bg-ink-900/40 p-6"
      >
        <p className="text-sm font-medium text-sand-200/80">New testimonial</p>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm">
            <span className="text-sand-200/70">Client name</span>
            <input
              required
              value={form.client_name}
              onChange={(e) => setForm({ ...form, client_name: e.target.value })}
              className="mt-1 w-full rounded-lg border border-white/10 bg-ink-950 px-3 py-2 text-sand-100"
            />
          </label>
          <label className="text-sm">
            <span className="text-sand-200/70">Role / event</span>
            <input
              value={form.role_or_event}
              onChange={(e) => setForm({ ...form, role_or_event: e.target.value })}
              className="mt-1 w-full rounded-lg border border-white/10 bg-ink-950 px-3 py-2 text-sand-100"
            />
          </label>
          <label className="text-sm md:col-span-2">
            <span className="text-sand-200/70">Quote</span>
            <textarea
              required
              rows={3}
              value={form.quote}
              onChange={(e) => setForm({ ...form, quote: e.target.value })}
              className="mt-1 w-full rounded-lg border border-white/10 bg-ink-950 px-3 py-2 text-sand-100"
            />
          </label>
          <label className="text-sm">
            <span className="text-sand-200/70">Rating (1–5)</span>
            <input
              type="number"
              min={1}
              max={5}
              value={form.rating}
              onChange={(e) => setForm({ ...form, rating: e.target.value })}
              className="mt-1 w-full rounded-lg border border-white/10 bg-ink-950 px-3 py-2 text-sand-100"
            />
          </label>
          <label className="text-sm">
            <span className="text-sand-200/70">Sort</span>
            <input
              type="number"
              value={form.sort_order}
              onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
              className="mt-1 w-full rounded-lg border border-white/10 bg-ink-950 px-3 py-2 text-sand-100"
            />
          </label>
          <div className="flex flex-wrap items-center gap-4 md:col-span-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.is_featured}
                onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
              />
              Featured on homepage
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.published}
                onChange={(e) => setForm({ ...form, published: e.target.checked })}
              />
              Published
            </label>
            <label className="cursor-pointer text-sm text-accent">
              {uploading ? '…' : 'Photo (optional)'}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => onImage(e, false)} />
            </label>
          </div>
        </div>
        <button type="submit" className="rounded-full bg-accent px-5 py-2 text-sm font-medium text-ink-950">
          Add testimonial
        </button>
      </form>

      <div className="mt-10 space-y-4">
        {rows.map((t) =>
          editing?.id === t.id ? (
            <form
              key={t.id}
              onSubmit={saveEdit}
              className="rounded-xl border border-accent/30 bg-ink-900/60 p-6 space-y-3"
            >
              <input
                value={editing.client_name}
                onChange={(e) => setEditing({ ...editing, client_name: e.target.value })}
                className="w-full rounded border border-white/10 bg-ink-950 px-3 py-2"
              />
              <textarea
                rows={3}
                value={editing.quote}
                onChange={(e) => setEditing({ ...editing, quote: e.target.value })}
                className="w-full rounded border border-white/10 bg-ink-950 px-3 py-2"
              />
              <div className="flex flex-wrap gap-4 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!!editing.is_featured}
                    onChange={(e) => setEditing({ ...editing, is_featured: e.target.checked })}
                  />
                  Featured
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!!editing.published}
                    onChange={(e) => setEditing({ ...editing, published: e.target.checked })}
                  />
                  Published
                </label>
                <label className="text-accent cursor-pointer">
                  Image
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => onImage(e, true)} />
                </label>
              </div>
              <div className="flex gap-2">
                <button type="submit" className="text-accent hover:underline">
                  Save
                </button>
                <button type="button" onClick={() => setEditing(null)} className="text-sand-200/60">
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div
              key={t.id}
              className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-white/10 bg-ink-900/40 p-4"
            >
              <div className="flex gap-4">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full">
                  {t.image_path ? (
                    <img src={assetUrl(t.image_path)} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <ImagePlaceholder className="h-full w-full" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-sand-100">{t.client_name}</p>
                  <p className="mt-1 text-sm text-sand-200/70 line-clamp-3">“{t.quote}”</p>
                  <p className="mt-1 text-xs text-sand-200/40">
                    {t.is_featured ? 'Featured' : ''} · {t.published ? 'Live' : 'Draft'}
                  </p>
                </div>
              </div>
              <div className="flex gap-3 text-sm">
                <button type="button" onClick={() => setEditing({ ...t })} className="text-accent">
                  Edit
                </button>
                <button type="button" onClick={() => remove(t.id)} className="text-red-400/80">
                  Delete
                </button>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
