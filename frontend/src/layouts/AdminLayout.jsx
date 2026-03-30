import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';

const links = [
  { to: '/admin', label: 'Overview', end: true },
  { to: '/admin/portfolio', label: 'Portfolio' },
  { to: '/admin/categories', label: 'Categories' },
  { to: '/admin/services', label: 'Services' },
  { to: '/admin/testimonials', label: 'Testimonials' },
  { to: '/admin/inquiries', label: 'Inquiries' },
  { to: '/admin/settings', label: 'Site settings' },
];

export function AdminLayout() {
  const { logout, refreshMe, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    refreshMe();
  }, [refreshMe]);

  return (
    <div className="min-h-screen bg-ink-950 text-sand-100">
      <header className="border-b border-white/10 bg-ink-900/90">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 md:px-6">
          <div>
            <p className="text-xs uppercase tracking-widest text-accent">Admin</p>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="font-display text-xl text-sand-50 hover:text-accent"
            >
              HK Photo Lounge
            </button>
            {user?.email && (
              <p className="text-xs text-sand-200/50">{user.email}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              logout();
              navigate('/admin/login');
            }}
            className="rounded-full border border-white/15 px-4 py-1.5 text-sm text-sand-200 hover:border-white/30"
          >
            Log out
          </button>
        </div>
        <nav className="mx-auto flex max-w-6xl flex-wrap gap-1 border-t border-white/5 px-2 py-2 md:px-4">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                `rounded-full px-3 py-1.5 text-sm ${
                  isActive ? 'bg-white/10 text-sand-50' : 'text-sand-200/70 hover:bg-white/5'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
        <Outlet />
      </div>
    </div>
  );
}
