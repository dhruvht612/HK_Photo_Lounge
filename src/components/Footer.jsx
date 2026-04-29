import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { Mail, Phone, ArrowUpRight } from 'lucide-react';
import { api } from '../api/client.js';

const exploreLinks = [
  { to: '/', label: 'Home' },
  { to: '/portfolio', label: 'Portfolio' },
  { to: '/services', label: 'Services' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
];

const serviceLinks = [
  { to: '/services/wedding-day-coverage', label: 'Weddings' },
  { to: '/services/portrait-session', label: 'Portraits' },
  { to: '/services/event-coverage', label: 'Events' },
  { to: '/services', label: 'Brand Sessions' },
];

const defaultBlurb =
  'Harikishan Thakar — HK Photo Lounge. Macro, wildlife, events, weddings, and newborn sessions across Brampton and the GTA.';

const linkClass =
  'text-sm text-sand-300/75 transition duration-200 hover:text-sand-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent/60';

const headingClass = 'text-[11px] font-medium uppercase tracking-[0.28em] text-accent';

function instagramHref(raw) {
  if (!raw?.trim()) return null;
  const s = raw.trim();
  if (s.startsWith('http')) return s;
  const handle = s.replace(/^@/, '');
  return `https://instagram.com/${handle}`;
}

function instagramLabel(raw) {
  if (!raw?.trim()) return 'Instagram';
  const s = raw.trim();
  if (s.startsWith('http')) return 'Instagram';
  return s.startsWith('@') ? s : `@${s.replace(/^@/, '')}`;
}

function InstagramGlyph({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function Footer() {
  const [settings, setSettings] = useState({});

  useEffect(() => {
    api.get('/api/settings/public').then(setSettings).catch(() => {});
  }, []);

  const brandBlurb = useMemo(() => {
    const b = settings.about_blurb;
    if (typeof b === 'string' && b.trim()) return b.trim();
    return defaultBlurb;
  }, [settings.about_blurb]);

  const year = new Date().getFullYear();
  const ig = settings.social_instagram;
  const igUrl = instagramHref(ig);
  const igDisplay = instagramLabel(ig);

  return (
    <footer className="border-t border-white/[0.09] bg-gradient-to-b from-[#070708] via-ink-950 to-[#030304]">
      <div className="mx-auto max-w-6xl px-4 pb-16 pt-16 sm:px-6 md:pt-20 lg:px-8">
        <div className="grid gap-14 sm:grid-cols-2 lg:grid-cols-12 lg:gap-10">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-4">
            <p className="font-display text-2xl tracking-tight text-sand-50 md:text-3xl">HK Photo Lounge</p>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-sand-300/75">{brandBlurb}</p>
            <p className="mt-6 text-sm leading-relaxed text-sand-400/90">
              Hong Kong · Commissions by appointment
            </p>
            <p className="mt-2 text-sm text-sand-500/80">Weekday enquiries · Seasonal weekend availability</p>
          </div>

          {/* Explore */}
          <div className="lg:col-span-2 lg:col-start-6">
            <h3 className={headingClass}>Explore</h3>
            <ul className="mt-6 space-y-3.5">
              {exploreLinks.map((item) => (
                <li key={item.to + item.label}>
                  <Link to={item.to} className={linkClass}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div className="lg:col-span-2">
            <h3 className={headingClass}>Services</h3>
            <ul className="mt-6 space-y-3.5">
              {serviceLinks.map((item) => (
                <li key={item.to + item.label}>
                  <Link to={item.to} className={linkClass}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Connect */}
          <div className="sm:col-span-2 lg:col-span-3">
            <h3 className={headingClass}>Connect</h3>
            <ul className="mt-6 space-y-4">
              {settings.contact_email ? (
                <li>
                  <a
                    href={`mailto:${settings.contact_email}`}
                    className="group inline-flex items-start gap-3 text-sm text-sand-300/80 transition hover:text-sand-50"
                  >
                    <Mail className="mt-0.5 h-4 w-4 shrink-0 text-accent/70 transition group-hover:text-accent" strokeWidth={1.5} />
                    <span className="border-b border-transparent pb-px transition group-hover:border-accent/40">
                      {settings.contact_email}
                    </span>
                  </a>
                </li>
              ) : (
                <li className="text-sm text-sand-500/70">Email on request</li>
              )}
              {settings.contact_phone ? (
                <li>
                  <a
                    href={`tel:${String(settings.contact_phone).replace(/\s/g, '')}`}
                    className="group inline-flex items-start gap-3 text-sm text-sand-300/80 transition hover:text-sand-50"
                  >
                    <Phone className="mt-0.5 h-4 w-4 shrink-0 text-accent/70 transition group-hover:text-accent" strokeWidth={1.5} />
                    <span className="border-b border-transparent pb-px transition group-hover:border-accent/40">
                      {settings.contact_phone}
                    </span>
                  </a>
                </li>
              ) : null}
              {igUrl ? (
                <li>
                  <a
                    href={igUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="group inline-flex items-start gap-3 text-sm text-sand-300/80 transition hover:text-sand-50"
                  >
                    <InstagramGlyph className="mt-0.5 h-4 w-4 shrink-0 text-accent/70 transition group-hover:text-accent" />
                    <span className="border-b border-transparent pb-px transition group-hover:border-accent/40">
                      {igDisplay}
                    </span>
                  </a>
                </li>
              ) : null}
              <li className="pt-1">
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-accent transition hover:text-[#e8d5a3]"
                >
                  Book a session
                  <ArrowUpRight className="h-3.5 w-3.5 opacity-80" strokeWidth={2} />
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-6 border-t border-white/[0.07] pt-10 md:flex-row md:items-center md:justify-between md:gap-8">
          <p className="text-xs text-sand-500/70">
            © {year} HK Photo Lounge. All rights reserved.
            <span className="mx-2 text-sand-600/80">·</span>
            <Link
              to="/admin/login"
              className="text-sand-600/90 transition hover:text-sand-400/90"
            >
              Studio
            </Link>
          </p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-sand-500/80">
            <Link to="/privacy" className="transition hover:text-sand-200">
              Privacy policy
            </Link>
            <span className="text-sand-600/60" aria-hidden>
              |
            </span>
            <Link to="/terms" className="transition hover:text-sand-200">
              Terms
            </Link>
            {igUrl ? (
              <>
                <span className="text-sand-600/60" aria-hidden>
                  |
                </span>
                <a
                  href={igUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 transition hover:text-accent"
                >
                  <InstagramGlyph className="h-3.5 w-3.5" />
                  Instagram
                </a>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </footer>
  );
}
