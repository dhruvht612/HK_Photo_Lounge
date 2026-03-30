import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { assetUrl } from '../../lib/assets.js';
import { ImagePlaceholder } from '../../components/ImagePlaceholder.jsx';

export function AdminPortfolio() {
  const { token } = useAuth();
  const [items, setItems] = useState([]);

  function load() {
    api.get('/api/portfolio?admin=1', { token }).then(setItems);
  }

  useEffect(() => {
    load();
  }, [token]);

  async function remove(id) {
    if (!confirm('Delete this portfolio item and its gallery?')) return;
    await api.delete(`/api/portfolio/${id}`, { token });
    load();
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-sand-50">Portfolio</h1>
          <p className="mt-1 text-sm text-sand-200/50">CRUD projects, covers, and gallery images.</p>
        </div>
        <Link
          to="/admin/portfolio/new"
          className="rounded-full bg-accent px-5 py-2 text-sm font-medium text-ink-950 hover:bg-accent/90"
        >
          New project
        </Link>
      </div>
      <div className="mt-8 overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-white/10 bg-ink-900/80 text-sand-200/60">
            <tr>
              <th className="px-4 py-3">Cover</th>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Featured</th>
              <th className="px-4 py-3">Published</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                <td className="px-4 py-3">
                  <div className="h-12 w-16 overflow-hidden rounded-md">
                    {p.cover_image ? (
                      <img src={assetUrl(p.cover_image)} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <ImagePlaceholder className="h-full w-full" />
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 font-medium text-sand-100">{p.title}</td>
                <td className="px-4 py-3 text-sand-200/70">{p.category_name}</td>
                <td className="px-4 py-3">{p.is_featured ? 'Yes' : '—'}</td>
                <td className="px-4 py-3">{p.published ? 'Yes' : 'No'}</td>
                <td className="px-4 py-3 text-right">
                  <Link to={`/admin/portfolio/${p.id}`} className="text-accent hover:underline">
                    Edit
                  </Link>
                  <button
                    type="button"
                    onClick={() => remove(p.id)}
                    className="ml-3 text-red-400/80 hover:underline"
                  >
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
