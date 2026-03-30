import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import { useAuth } from '../../contexts/AuthContext.jsx';

export function AdminDashboard() {
  const { token } = useAuth();
  const [counts, setCounts] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get('/api/portfolio?admin=1', { token }),
      api.get('/api/categories', { token }),
      api.get('/api/services?admin=1', { token }),
      api.get('/api/testimonials?admin=1', { token }),
      api.get('/api/inquiries', { token }),
    ]).then(([port, cats, svc, test, inq]) => {
      setCounts({
        portfolio: port.length,
        categories: cats.length,
        services: svc.length,
        testimonials: test.length,
        inquiries: inq.length,
      });
    });
  }, [token]);

  const cards = [
    { label: 'Portfolio items', count: counts?.portfolio, to: '/admin/portfolio' },
    { label: 'Categories', count: counts?.categories, to: '/admin/categories' },
    { label: 'Services', count: counts?.services, to: '/admin/services' },
    { label: 'Testimonials', count: counts?.testimonials, to: '/admin/testimonials' },
    { label: 'Inquiries', count: counts?.inquiries, to: '/admin/inquiries' },
  ];

  return (
    <div>
      <h1 className="font-display text-3xl text-sand-50">Overview</h1>
      <p className="mt-2 text-sand-200/60">Manage content and client inquiries.</p>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Link
            key={c.to}
            to={c.to}
            className="rounded-xl border border-white/10 bg-ink-900/50 p-6 transition hover:border-white/20"
          >
            <p className="text-sm text-sand-200/60">{c.label}</p>
            <p className="mt-2 font-display text-3xl text-sand-50">
              {counts ? c.count : '—'}
            </p>
          </Link>
        ))}
      </div>
      <Link
        to="/admin/settings"
        className="mt-8 inline-block text-sm text-accent hover:underline"
      >
        Edit homepage copy and contact info →
      </Link>
    </div>
  );
}
