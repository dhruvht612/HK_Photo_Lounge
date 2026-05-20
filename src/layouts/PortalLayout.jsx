import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';

const links = [
  { to: '/portal/dashboard', label: 'Dashboard', end: false },
  { to: '/portal/bookings', label: 'My Bookings', phase: 3 },
  { to: '/portal/galleries', label: 'Galleries', phase: 5 },
  { to: '/portal/messages', label: 'Messages', phase: 4 },
  { to: '/portal/documents', label: 'Documents', phase: 5 },
  { to: '/portal/inspiration', label: 'Inspiration', phase: 6 },
];

export function PortalLayout() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate('/portal/login');
  }

  const navClass = ({ isActive }) =>
    `block rounded-full px-3 py-2 text-sm ${
      isActive ? 'bg-teal-500/20 text-teal-200' : 'text-sand-200/70 hover:bg-white/5'
    }`;

  return (
    <div className="min-h-screen bg-ink-950 text-sand-100">
      <header className="border-b border-white/10 bg-ink-900/90 lg:hidden">
        <div className="flex items-center justify-between px-4 py-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-teal-400/90">Client portal</p>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="font-display text-lg text-sand-50 hover:text-teal-300"
            >
              HK Photo Lounge
            </button>
          </div>
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="rounded-lg p-2 text-sand-200 hover:bg-white/10"
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
        {menuOpen && (
          <nav className="border-t border-white/5 px-2 py-3">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === '/portal/dashboard'}
                className={navClass}
                onClick={() => setMenuOpen(false)}
              >
                {l.label}
              </NavLink>
            ))}
            <button
              type="button"
              onClick={handleLogout}
              className="mt-2 w-full rounded-full px-3 py-2 text-left text-sm text-sand-200/70 hover:bg-white/5"
            >
              Log out
            </button>
          </nav>
        )}
      </header>

      <div className="mx-auto flex max-w-6xl">
        <aside className="hidden w-56 shrink-0 border-r border-white/10 bg-ink-900/50 lg:block">
          <div className="sticky top-0 p-6">
            <p className="text-xs uppercase tracking-widest text-teal-400/90">Client portal</p>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="mt-1 font-display text-xl text-sand-50 hover:text-teal-300"
            >
              HK Photo Lounge
            </button>
            {user?.email && (
              <p className="mt-2 truncate text-xs text-sand-200/50">{user.email}</p>
            )}
            <nav className="mt-8 flex flex-col gap-1">
              {links.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  end={l.to === '/portal/dashboard'}
                  className={navClass}
                >
                  {l.label}
                </NavLink>
              ))}
            </nav>
            <button
              type="button"
              onClick={handleLogout}
              className="mt-8 w-full rounded-full border border-white/15 px-4 py-2 text-sm text-sand-200 hover:border-white/30"
            >
              Log out
            </button>
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-4 py-8 md:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
