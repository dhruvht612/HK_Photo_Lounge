import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { api } from '../api/client.js';

export function Contact() {
  const [settings, setSettings] = useState({});
  const [status, setStatus] = useState(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    service_interest: '',
    event_date: '',
    message: '',
  });

  useEffect(() => {
    api.get('/api/settings/public').then(setSettings).catch(() => {});
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus({ type: 'loading' });
    try {
      await api.post('/api/inquiries', form);
      setStatus({ type: 'success', text: 'Thank you — we will reply shortly.' });
      setForm({
        name: '',
        email: '',
        phone: '',
        service_interest: '',
        event_date: '',
        message: '',
      });
    } catch (err) {
      setStatus({ type: 'error', text: err.body?.error || err.message });
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-24">
      <div className="grid gap-12 lg:grid-cols-5 lg:gap-16">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2"
        >
          <p className="text-xs uppercase tracking-[0.3em] text-accent">Contact</p>
          <h1 className="mt-4 font-display text-4xl text-sand-50 md:text-5xl">Book an inquiry</h1>
          <p className="mt-6 text-sand-200/75">
            Share a few details — date, location, and the vibe you are after. We typically respond
            within two business days.
          </p>
          <div className="mt-10 space-y-2 text-sm text-sand-200/60">
            {settings.contact_email && (
              <p>
                Email:{' '}
                <a className="text-accent hover:underline" href={`mailto:${settings.contact_email}`}>
                  {settings.contact_email}
                </a>
              </p>
            )}
            {settings.contact_phone && <p>Phone: {settings.contact_phone}</p>}
            {settings.social_instagram && (
              <p>Instagram: {settings.social_instagram}</p>
            )}
          </div>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          onSubmit={handleSubmit}
          className="lg:col-span-3 space-y-5 rounded-2xl border border-white/5 bg-ink-900/40 p-6 md:p-8"
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="text-sand-200/70">Name *</span>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mt-1 w-full rounded-lg border border-white/10 bg-ink-950/80 px-3 py-2 text-sand-100 outline-none focus:border-accent/50"
              />
            </label>
            <label className="block text-sm">
              <span className="text-sand-200/70">Email *</span>
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="mt-1 w-full rounded-lg border border-white/10 bg-ink-950/80 px-3 py-2 text-sand-100 outline-none focus:border-accent/50"
              />
            </label>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="text-sand-200/70">Phone</span>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="mt-1 w-full rounded-lg border border-white/10 bg-ink-950/80 px-3 py-2 text-sand-100 outline-none focus:border-accent/50"
              />
            </label>
            <label className="block text-sm">
              <span className="text-sand-200/70">Service interest</span>
              <input
                value={form.service_interest}
                onChange={(e) => setForm({ ...form, service_interest: e.target.value })}
                className="mt-1 w-full rounded-lg border border-white/10 bg-ink-950/80 px-3 py-2 text-sand-100 outline-none focus:border-accent/50"
                placeholder="Wedding, portrait…"
              />
            </label>
          </div>
          <label className="block text-sm">
            <span className="text-sand-200/70">Event date (if known)</span>
            <input
              value={form.event_date}
              onChange={(e) => setForm({ ...form, event_date: e.target.value })}
              className="mt-1 w-full rounded-lg border border-white/10 bg-ink-950/80 px-3 py-2 text-sand-100 outline-none focus:border-accent/50"
            />
          </label>
          <label className="block text-sm">
            <span className="text-sand-200/70">Message *</span>
            <textarea
              required
              rows={5}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              className="mt-1 w-full rounded-lg border border-white/10 bg-ink-950/80 px-3 py-2 text-sand-100 outline-none focus:border-accent/50"
            />
          </label>
          {status?.type === 'success' && (
            <p className="text-sm text-emerald-400/90">{status.text}</p>
          )}
          {status?.type === 'error' && <p className="text-sm text-red-400/90">{status.text}</p>}
          <button
            type="submit"
            disabled={status?.type === 'loading'}
            className="rounded-full bg-accent px-8 py-3 text-sm font-medium text-ink-950 transition hover:bg-accent/90 disabled:opacity-50"
          >
            {status?.type === 'loading' ? 'Sending…' : 'Send inquiry'}
          </button>
        </motion.form>
      </div>
    </div>
  );
}
