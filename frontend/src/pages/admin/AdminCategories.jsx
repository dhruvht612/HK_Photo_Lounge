import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import { useAuth } from '../../contexts/AuthContext.jsx';

const empty = { name: '', description: '', sort_order: 0 };

export function AdminCategories() {
  const { token } = useAuth();
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);

  function load() {
    api.get('/api/categories', { token }).then(setRows);
  }

  useEffect(() => {
    load();
  }, [token]);

  async function create(e) {
    e.preventDefault();
    await api.post('/api/categories', form, { token });
    setForm(empty);
    load();
  }

  async function update(e) {
    e?.preventDefault();
    if (!editing) return;
    await api.put(`/api/categories/${editing.id}`, editing, { token });
    setEditing(null);
    load();
  }

  async function remove(id) {
    if (!window.confirm('Delete this category?')) return;
    try {
      await api.delete(`/api/categories/${id}`, { token });
      load();
    } catch (err) {
      alert(err.body?.error || err.message);
    }
  }

  return (
    <div>
      <h1 className="font-display text-3xl text-sand-50">Categories</h1>
      <form
        onSubmit={create}
        className="mt-8 flex flex-wrap items-end gap-4 rounded-xl border border-white/10 bg-ink-900/40 p-6"
      >
        <label className="text-sm">
          <span className="text-sand-200/70">Name</span>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="mt-1 block rounded-lg border border-white/10 bg-ink-950 px-3 py-2 text-sand-100"
          />
        </label>
        <label className="text-sm">
          <span className="text-sand-200/70">Description</span>
          <input
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="mt-1 block rounded-lg border border-white/10 bg-ink-950 px-3 py-2 text-sand-100"
          />
        </label>
        <label className="text-sm">
          <span className="text-sand-200/70">Sort</span>
          <input
            type="number"
            value={form.sort_order}
            onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
            className="mt-1 block w-24 rounded-lg border border-white/10 bg-ink-950 px-3 py-2 text-sand-100"
          />
        </label>
        <button type="submit" className="rounded-full bg-accent px-5 py-2 text-sm font-medium text-ink-950">
          Add category
        </button>
      </form>

      <div className="mt-10 overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/10 bg-ink-900/80 text-sand-200/60">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Sort</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id} className="border-b border-white/5">
                {editing?.id === c.id ? (
                  <>
                    <td className="px-4 py-2">
                      <input
                        value={editing.name}
                        onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                        className="w-full rounded border border-white/10 bg-ink-950 px-2 py-1"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        value={editing.slug}
                        onChange={(e) => setEditing({ ...editing, slug: e.target.value })}
                        className="w-full rounded border border-white/10 bg-ink-950 px-2 py-1 text-xs"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        value={editing.sort_order}
                        onChange={(e) => setEditing({ ...editing, sort_order: e.target.value })}
                        className="w-20 rounded border border-white/10 bg-ink-950 px-2 py-1"
                      />
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button type="button" onClick={update} className="text-accent hover:underline">
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditing(null)}
                        className="ml-2 text-sand-200/60"
                      >
                        Cancel
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-3 text-sand-100">{c.name}</td>
                    <td className="px-4 py-3 text-sand-200/50">{c.slug}</td>
                    <td className="px-4 py-3">{c.sort_order}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() =>
                          setEditing({
                            id: c.id,
                            name: c.name,
                            slug: c.slug,
                            description: c.description ?? '',
                            sort_order: c.sort_order,
                          })
                        }
                        className="text-accent hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(c.id)}
                        className="ml-3 text-red-400/80 hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
