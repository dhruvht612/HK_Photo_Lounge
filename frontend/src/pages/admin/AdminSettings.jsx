import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import { useAuth } from '../../contexts/AuthContext.jsx';

const fields = [
  { key: 'hero_title', label: 'Hero title' },
  { key: 'hero_subtitle', label: 'Hero subtitle' },
  { key: 'about_blurb', label: 'About blurb', textarea: true },
  { key: 'contact_email', label: 'Contact email' },
  { key: 'contact_phone', label: 'Contact phone' },
  { key: 'social_instagram', label: 'Instagram handle' },
];

export function AdminSettings() {
  const { token } = useAuth();
  const [data, setData] = useState({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get('/api/settings', { token }).then(setData);
  }, [token]);

  function setField(key, value) {
    setData((d) => ({ ...d, [key]: value }));
    setSaved(false);
  }

  async function save(e) {
    e.preventDefault();
    const payload = {};
    for (const f of fields) {
      payload[f.key] = data[f.key] ?? '';
    }
    await api.put('/api/settings', payload, { token });
    setSaved(true);
  }

  return (
    <div>
      <h1 className="font-display text-3xl text-sand-50">Site settings</h1>
      <p className="mt-2 text-sm text-sand-200/50">
        Homepage hero, about snippet, and contact details (public-facing).
      </p>
      <form onSubmit={save} className="mt-8 max-w-xl space-y-5">
        {fields.map((f) => (
          <label key={f.key} className="block text-sm">
            <span className="text-sand-200/70">{f.label}</span>
            {f.textarea ? (
              <textarea
                rows={4}
                value={data[f.key] ?? ''}
                onChange={(e) => setField(f.key, e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/10 bg-ink-950 px-3 py-2 text-sand-100"
              />
            ) : (
              <input
                value={data[f.key] ?? ''}
                onChange={(e) => setField(f.key, e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/10 bg-ink-950 px-3 py-2 text-sand-100"
              />
            )}
          </label>
        ))}
        {saved && <p className="text-sm text-emerald-400/90">Saved.</p>}
        <button
          type="submit"
          className="rounded-full bg-accent px-6 py-2 text-sm font-medium text-ink-950 hover:bg-accent/90"
        >
          Save settings
        </button>
      </form>
    </div>
  );
}
