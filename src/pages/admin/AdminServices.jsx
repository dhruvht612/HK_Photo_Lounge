import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { assetUrl } from '../../lib/assets.js';
import { ImagePlaceholder } from '../../components/ImagePlaceholder.jsx';

const empty = {
  title: '',
  summary: '',
  description: '',
  price_hint: '',
  image_path: '',
  sort_order: 0,
  published: true,
};

export function AdminServices() {
  const { token } = useAuth();
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [uploading, setUploading] = useState(false);

  function load() {
    api.get('/api/services?admin=1', { token }).then(setRows);
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
    await api.post('/api/services', form, { token });
    setForm(empty);
    load();
  }

  async function saveEdit(e) {
    e.preventDefault();
    if (!editing) return;
    await api.put(`/api/services/${editing.id}`, editing, { token });
    setEditing(null);
    load();
  }

  async function remove(id) {
    if (!confirm('Delete this service?')) return;
    await api.delete(`/api/services/${id}`, { token });
    load();
  }

  return (
    <div>
      <h1 className="font-display text-3xl text-sand-50">Services</h1>
      <form
        onSubmit={create}
        className="mt-8 space-y-4 rounded-xl border border-white/10 bg-ink-900/40 p-6"
      >
        <p className="text-sm font-medium text-sand-200/80">New service</p>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm md:col-span-2">
            <span className="text-sand-200/70">Title</span>
            <input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="mt-1 w-full rounded-lg border border-white/10 bg-ink-950 px-3 py-2 text-sand-100"
            />
          </label>
          <label className="text-sm md:col-span-2">
            <span className="text-sand-200/70">Summary</span>
            <input
              value={form.summary}
              onChange={(e) => setForm({ ...form, summary: e.target.value })}
              className="mt-1 w-full rounded-lg border border-white/10 bg-ink-950 px-3 py-2 text-sand-100"
            />
          </label>
          <label className="text-sm md:col-span-2">
            <span className="text-sand-200/70">Description</span>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="mt-1 w-full rounded-lg border border-white/10 bg-ink-950 px-3 py-2 text-sand-100"
            />
          </label>
          <label className="text-sm">
            <span className="text-sand-200/70">Price hint</span>
            <input
              value={form.price_hint}
              onChange={(e) => setForm({ ...form, price_hint: e.target.value })}
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
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.published}
                onChange={(e) => setForm({ ...form, published: e.target.checked })}
              />
              Published
            </label>
            <label className="cursor-pointer text-sm text-accent">
              {uploading ? 'Uploading…' : 'Upload image'}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => onImage(e, false)} />
            </label>
          </div>
          {form.image_path && (
            <div className="h-16 w-24 overflow-hidden rounded border border-white/10 md:col-span-2">
              <img src={assetUrl(form.image_path)} alt="" className="h-full w-full object-cover" />
            </div>
          )}
        </div>
        <button type="submit" className="rounded-full bg-accent px-5 py-2 text-sm font-medium text-ink-950">
          Add service
        </button>
      </form>

      <div className="mt-10 space-y-6">
        {rows.map((s) =>
          editing?.id === s.id ? (
            <form
              key={s.id}
              onSubmit={saveEdit}
              className="rounded-xl border border-accent/30 bg-ink-900/60 p-6 space-y-3"
            >
              <input
                value={editing.title}
                onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                className="w-full rounded border border-white/10 bg-ink-950 px-3 py-2 font-medium"
              />
              <textarea
                rows={2}
                value={editing.summary || ''}
                onChange={(e) => setEditing({ ...editing, summary: e.target.value })}
                className="w-full rounded border border-white/10 bg-ink-950 px-3 py-2 text-sm"
              />
              <textarea
                rows={3}
                value={editing.description || ''}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                className="w-full rounded border border-white/10 bg-ink-950 px-3 py-2 text-sm"
              />
              <div className="flex flex-wrap gap-4 text-sm">
                <label className="text-accent cursor-pointer">
                  Replace image
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => onImage(e, true)} />
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!!editing.published}
                    onChange={(e) => setEditing({ ...editing, published: e.target.checked })}
                  />
                  Published
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
              key={s.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/10 bg-ink-900/40 p-4"
            >
              <div className="flex gap-4">
                <div className="h-16 w-24 overflow-hidden rounded-md">
                  {s.image_path ? (
                    <img src={assetUrl(s.image_path)} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <ImagePlaceholder className="h-full w-full" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-sand-100">{s.title}</p>
                  <p className="text-xs text-sand-200/50">{s.slug}</p>
                </div>
              </div>
              <div className="flex gap-3 text-sm">
                <button type="button" onClick={() => setEditing({ ...s })} className="text-accent">
                  Edit
                </button>
                <button type="button" onClick={() => remove(s.id)} className="text-red-400/80">
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
