import { NavLink } from 'react-router-dom';

export const publicNavItems = [
  { to: '/', label: 'Home' },
  { to: '/portfolio', label: 'Portfolio' },
  { to: '/services', label: 'Services' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
];

export function PublicNavBar() {
  return (
    <div className="mx-auto max-w-6xl px-3 sm:px-4">
      <div
        className="flex flex-col gap-3 rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.07] via-[#0a0a0b]/92 to-[#080809]/95 px-4 py-3 shadow-[0_12px_48px_-12px_rgba(0,0,0,0.65),inset_0_1px_0_0_rgba(201,169,98,0.12),0_0_0_1px_rgba(255,255,255,0.03)_inset] backdrop-blur-2xl backdrop-saturate-150 md:flex-row md:items-center md:justify-between md:gap-4 md:rounded-full md:px-6 md:py-3"
      >
        <NavLink to="/" className="group flex shrink-0 items-baseline gap-2">
          <span className="font-display text-xl tracking-tight text-sand-50 md:text-2xl lg:text-3xl">
            HK Photo Lounge
          </span>
          <span className="hidden text-xs uppercase tracking-[0.25em] text-accent/90 sm:inline">studio</span>
        </NavLink>
        <nav className="hidden items-center gap-1 md:flex">
          {publicNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `rounded-full px-3 py-1.5 text-sm transition-colors ${
                  isActive
                    ? 'bg-white/12 text-sand-50 shadow-sm'
                    : 'text-sand-200/85 hover:bg-white/[0.06] hover:text-sand-50'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <MobileNav />
      </div>
    </div>
  );
}

function MobileNav() {
  return (
    <nav className="flex flex-wrap gap-1 border-t border-white/[0.06] pt-3 md:hidden md:border-0 md:pt-0">
      {publicNavItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          className={({ isActive }) =>
            `rounded-full px-2.5 py-1 text-xs transition-colors ${
              isActive ? 'bg-white/12 text-sand-50' : 'text-sand-200/85 hover:bg-white/[0.06]'
            }`
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}

/** Sticky glass bar — use once per page (layout or home shell). */
export function PublicHeader() {
  return (
    <header className="sticky top-0 z-40 bg-transparent pb-3 pt-7 sm:pb-4 sm:pt-8 md:pt-9">
      <PublicNavBar />
    </header>
  );
}
