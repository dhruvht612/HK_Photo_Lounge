import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { assetUrl } from '../../lib/assets.js';
import { ImagePlaceholder } from '../../components/ImagePlaceholder.jsx';

export function AdminPortfolioEdit() {
  const { id } = useParams();
  const isNew = id === 'new';
  const navigate = useNavigate();
  const { token } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(!isNew);
  const [form, setForm] = useState({
    category_id: '',
    title: '',
    excerpt: '',
    description: '',
    cover_image: '',
    is_featured: false,
    featured_order: 0,
    published: true,
    slug: '',
  });
  const [gallery, setGallery] = useState([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    api.get('/api/categories', { token }).then(setCategories);
  }, [token]);

  useEffect(() => {
    if (isNew) {
      setLoading(false);
      return;
    }
    api
      .get(`/api/portfolio/${id}`, { token })
      .then((data) => {
        setForm({
          category_id: String(data.category_id),
          title: data.title,
          excerpt: data.excerpt || '',
          description: data.description || '',
          cover_image: data.cover_image || '',
          is_featured: !!data.is_featured,
          featured_order: data.featured_order ?? 0,
          published: !!data.published,
          slug: data.slug || '',
        });
        setGallery(data.gallery || []);
      })
      .finally(() => setLoading(false));
  }, [id, isNew, token]);

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

  async function onCoverFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const path = await uploadFile(file);
      setForm((f) => ({ ...f, cover_image: path }));
    } catch (err) {
      alert(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function onGalleryFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (isNew) {
      alert('Save the project first, then add gallery images.');
      return;
    }
    setUploading(true);
    try {
      const path = await uploadFile(file);
      await api.post(
        `/api/portfolio/${id}/images`,
        { image_path: path },
        { token }
      );
      const data = await api.get(`/api/portfolio/${id}`, { token });
      setGallery(data.gallery || []);
    } catch (err) {
      alert(err.message || 'Failed to add image');
    } finally {
      setUploading(false);
    }
  }

  async function save(e) {
    e.preventDefault();
    const payload = {
      category_id: Number(form.category_id),
      title: form.title,
      excerpt: form.excerpt || null,
      description: form.description || null,
      cover_image: form.cover_image || null,
      is_featured: form.is_featured,
      featured_order: Number(form.featured_order) || 0,
      published: form.published,
    };
    if (form.slug?.trim()) payload.slug = form.slug.trim();

    if (isNew) {
      const created = await api.post('/api/portfolio', payload, { token });
      navigate(`/admin/portfolio/${created.id}`, { replace: true });
      return;
    }
    await api.put(`/api/portfolio/${id}`, payload, { token });
    alert('Saved.');
  }

  async function removeGalleryImage(imageId) {
    if (!confirm('Remove this image?')) return;
    await api.delete(`/api/portfolio/images/${imageId}`, { token });
    setGallery((g) => g.filter((x) => x.id !== imageId));
  }

  if (loading) {
    return <p className="text-sand-200/50">Loading…</p>;
  }

  return (
    <div>
      <h1 className="font-display text-3xl text-sand-50">
        {isNew ? 'New project' : 'Edit project'}
      </h1>
      <form onSubmit={save} className="mt-8 max-w-2xl space-y-5">
        <label className="block text-sm">
          <span className="text-sand-200/70">Category *</span>
          <select
            required
            value={form.category_id}
            onChange={(e) => setForm({ ...form, category_id: e.target.value })}
            className="mt-1 w-full rounded-lg border border-white/10 bg-ink-950 px-3 py-2 text-sand-100"
          >
            <option value="">Select…</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
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
        <label className="block text-sm">
          <span className="text-sand-200/70">Slug (optional override)</span>
          <input
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            className="mt-1 w-full rounded-lg border border-white/10 bg-ink-950 px-3 py-2 text-sand-100"
            placeholder="auto from title"
          />
        </label>
        <label className="block text-sm">
          <span className="text-sand-200/70">Excerpt</span>
          <input
            value={form.excerpt}
            onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
            className="mt-1 w-full rounded-lg border border-white/10 bg-ink-950 px-3 py-2 text-sand-100"
          />
        </label>
        <label className="block text-sm">
          <span className="text-sand-200/70">Description</span>
          <textarea
            rows={5}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="mt-1 w-full rounded-lg border border-white/10 bg-ink-950 px-3 py-2 text-sand-100"
          />
        </label>
        <div className="flex flex-wrap gap-6">
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
        </div>
        <label className="block text-sm">
          <span className="text-sand-200/70">Featured order (higher first)</span>
          <input
            type="number"
            value={form.featured_order}
            onChange={(e) => setForm({ ...form, featured_order: e.target.value })}
            className="mt-1 w-full rounded-lg border border-white/10 bg-ink-950 px-3 py-2 text-sand-100"
          />
        </label>

        <div>
          <p className="text-sm text-sand-200/70">Cover image</p>
          <div className="mt-2 flex flex-wrap items-end gap-4">
            <div className="h-24 w-36 overflow-hidden rounded-lg border border-white/10">
              {form.cover_image ? (
                <img src={assetUrl(form.cover_image)} alt="" className="h-full w-full object-cover" />
              ) : (
                <ImagePlaceholder className="h-full w-full" />
              )}
            </div>
            <label className="cursor-pointer rounded-full border border-white/20 px-4 py-2 text-sm hover:bg-white/5">
              {uploading ? 'Uploading…' : 'Upload cover'}
              <input type="file" accept="image/*" className="hidden" onChange={onCoverFile} />
            </label>
          </div>
        </div>

        <button
          type="submit"
          className="rounded-full bg-accent px-6 py-2 text-sm font-medium text-ink-950 hover:bg-accent/90"
        >
          {isNew ? 'Create project' : 'Save changes'}
        </button>
      </form>

      {!isNew && (
        <div className="mt-12 max-w-2xl">
          <h2 className="font-display text-xl text-sand-50">Gallery</h2>
          <label className="mt-4 inline-block cursor-pointer rounded-full border border-white/20 px-4 py-2 text-sm hover:bg-white/5">
            Add gallery image
            <input type="file" accept="image/*" className="hidden" onChange={onGalleryFile} />
          </label>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {gallery.map((img) => (
              <div key={img.id} className="overflow-hidden rounded-lg border border-white/10">
                <img src={assetUrl(img.image_path)} alt="" className="aspect-square w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeGalleryImage(img.id)}
                  className="w-full py-1 text-xs text-red-400/90 hover:underline"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
