import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import { useAuth } from '../../contexts/AuthContext.jsx';

const statuses = ['new', 'read', 'replied', 'archived'];

export function AdminInquiries() {
  const { token } = useAuth();
  const [rows, setRows] = useState([]);
  const [filter, setFilter] = useState('');

  function load() {
    const q = filter ? `?status=${encodeURIComponent(filter)}` : '';
    api.get(`/api/inquiries${q}`, { token }).then(setRows);
  }

  useEffect(() => {
    load();
  }, [token, filter]);

  async function patchStatus(id, status) {
    await api.patch(`/api/inquiries/${id}`, { status }, { token });
    load();
  }

  async function remove(id) {
    if (!confirm('Delete this inquiry?')) return;
    await api.delete(`/api/inquiries/${id}`, { token });
    load();
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-3xl text-sand-50">Inquiries</h1>
        <label className="text-sm">
          <span className="text-sand-200/60">Filter</span>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="ml-2 rounded-lg border border-white/10 bg-ink-950 px-3 py-1.5 text-sand-100"
          >
            <option value="">All</option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="mt-8 space-y-4">
        {rows.map((q) => (
          <article
            key={q.id}
            className="rounded-xl border border-white/10 bg-ink-900/40 p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-medium text-sand-100">{q.name}</p>
                <p className="text-sm text-accent">{q.email}</p>
                {q.phone && <p className="text-sm text-sand-200/60">{q.phone}</p>}
              </div>
              <div className="text-right text-xs text-sand-200/40">
                {new Date(q.created_at).toLocaleString()}
              </div>
            </div>
            {(q.service_interest || q.event_date) && (
              <p className="mt-3 text-sm text-sand-200/70">
                {q.service_interest && <span>Interest: {q.service_interest} · </span>}
                {q.event_date && <span>Date: {q.event_date}</span>}
              </p>
            )}
            <p className="mt-4 whitespace-pre-wrap text-sm text-sand-200/85">{q.message}</p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <label className="text-sm text-sand-200/60">
                Status
                <select
                  value={q.status}
                  onChange={(e) => patchStatus(q.id, e.target.value)}
                  className="ml-2 rounded border border-white/10 bg-ink-950 px-2 py-1 text-sand-100"
                >
                  {statuses.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                onClick={() => remove(q.id)}
                className="text-sm text-red-400/80 hover:underline"
              >
                Delete
              </button>
            </div>
          </article>
        ))}
        {rows.length === 0 && <p className="text-sand-200/50">No inquiries.</p>}
      </div>
    </div>
  );
}
