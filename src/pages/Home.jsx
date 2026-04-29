import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { Camera, Heart, CalendarRange, Star, ArrowRight } from 'lucide-react';
import { api } from '../api/client.js';
import { assetUrl } from '../lib/assets.js';
import HeroButtonExpandable from '@/components/ui/hero-button-expendable';
import { HeroBackdrop } from '../components/HeroBackdrop';
import { PublicHeader } from '../components/PublicNavBar.jsx';
import {
  FEATURED_FALLBACK_IMAGES,
  HERO_BG_IMAGE,
  ABOUT_SECTION_IMAGE,
} from '../lib/homeVisuals.js';

function initialsFromName(name) {
  if (!name?.trim()) return 'HK';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function StarRating({ rating }) {
  const r = Math.min(5, Math.max(1, Number(rating) || 5));
  return (
    <div className="flex gap-0.5" aria-hidden>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`h-3.5 w-3.5 ${
            n <= r ? 'fill-accent text-accent' : 'fill-none text-sand-600'
          }`}
        />
      ))}
    </div>
  );
}

function serviceIcon(slug) {
  if (!slug) return Camera;
  if (slug.includes('wedding')) return Heart;
  if (slug.includes('event')) return CalendarRange;
  if (slug.includes('portrait')) return Camera;
  return Camera;
}

export function Home() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    api
      .get('/api/home')
      .then(setData)
      .catch((e) => setErr(e.message));
  }, []);

  const featuredTrio = useMemo(() => {
    const fp = data?.featuredPortfolio || [];
    const out = fp.slice(0, 3);
    let i = 0;
    while (out.length < 3) {
      out.push({
        id: `explore-${i}`,
        isPad: true,
        title: 'Explore the archive',
        category_name: 'Portfolio',
        excerpt: 'Full weddings, portraits, and commercial work.',
        slug: null,
      });
      i += 1;
    }
    return out.slice(0, 3);
  }, [data]);

  if (err) {
    return (
      <section className="relative isolate overflow-x-hidden">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-0 min-h-[100vh] bg-ink-950"
          aria-hidden
        />
        <PublicHeader />
        <div className="relative z-10 mx-auto max-w-6xl px-4 py-24 text-center text-red-300/90">
          Could not load homepage. Is the API running?
        </div>
      </section>
    );
  }

  if (!data) {
    return (
      <section className="relative isolate overflow-x-hidden">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-0 min-h-[100vh] bg-ink-950"
          aria-hidden
        />
        <PublicHeader />
        <div className="relative z-10 flex min-h-[60vh] items-center justify-center text-sand-200/50">
          Loading…
        </div>
      </section>
    );
  }

  const heroTitle = data.settings?.hero_title || 'HK Photo Lounge';
  const heroSub =
    data.settings?.hero_subtitle || 'Photography for life’s best chapters.';
  const aboutBlurb =
    data.settings?.about_blurb ||
    'HK Photo Lounge is Harikishan Thakar’s photography — macro, wildlife, events, weddings, and more — based in Brampton and serving the GTA.';

  return (
    <section className="relative isolate overflow-x-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[100svh] min-h-[100vh] overflow-hidden bg-ink-950">
        <HeroBackdrop backgroundImageUrl={HERO_BG_IMAGE} />
      </div>
      <PublicHeader />
      <div className="relative z-10">
        <div className="flex min-h-[100svh] flex-col items-center justify-center px-4 pb-12 pt-[calc(var(--public-header-h)+3rem)] sm:px-6 sm:pb-24 sm:pt-[calc(var(--public-header-h)+6rem)]">
          <HeroButtonExpandable
            badgeText="Hong Kong · Photography & bookings"
            studioName="HK Photo Lounge"
            headlineBefore=""
            headlineGradient={heroTitle}
            subheadline={heroSub}
            trustLine="Editorial · Hong Kong · Commission-led"
            contactEmail={data.settings?.contact_email}
            contactPhone={data.settings?.contact_phone}
            instagram={data.settings?.social_instagram}
            ctaLabel="Reserve your date"
            modalTagline="Plan your session"
            modalBody="Tell us your date, location, and the story you want to tell — we will guide the rest."
            testimonialQuote={data.featuredTestimonials?.[0]?.quote || undefined}
            testimonialName={data.featuredTestimonials?.[0]?.client_name || undefined}
            testimonialRole={data.featuredTestimonials?.[0]?.role_or_event || undefined}
            testimonialImageUrl="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=128&h=128&fit=crop"
          />
        </div>

      {/* Featured work — asymmetrical editorial grid */}
      <section className="relative py-20 md:pt-28 md:pb-20">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-accent">Portfolio</p>
              <h2 className="mt-3 font-display text-4xl tracking-tight text-sand-50 md:text-5xl">
                Featured work
              </h2>
              <p className="mt-3 max-w-lg text-base text-sand-300/90">
                Selected commissions — full-bleed imagery, printed-worthy colour, and calm direction on the day.
              </p>
            </div>
            <Link
              to="/portfolio"
              className="group mt-4 inline-flex items-center gap-2 text-sm font-medium text-accent md:mt-0"
            >
              View all projects
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </Link>
          </div>

          <div className="mt-14 grid min-h-[480px] gap-4 md:grid-cols-2 md:grid-rows-2 md:gap-5">
            {featuredTrio.map((item, idx) => {
              const img =
                item.cover_image && !item.isPad
                  ? assetUrl(item.cover_image)
                  : FEATURED_FALLBACK_IMAGES[idx % FEATURED_FALLBACK_IMAGES.length];
              const to = item.slug ? `/portfolio/${item.slug}` : '/portfolio';
              const large = idx === 0;
              return (
                <motion.article
                  key={item.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.55, delay: idx * 0.08 }}
                  className={`group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-ink-900/40 shadow-xl ${
                    large ? 'md:row-span-2 md:min-h-[520px]' : 'md:min-h-[240px]'
                  }`}
                >
                  <Link to={to} className="block h-full min-h-[280px] md:min-h-0">
                    <div className="relative h-full min-h-[280px] overflow-hidden md:absolute md:inset-0 md:min-h-full">
                      <img
                        src={img}
                        alt=""
                        className="h-full w-full object-cover transition duration-[1.1s] ease-out group-hover:scale-[1.04]"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
                      <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-transparent opacity-0 transition duration-500 group-hover:opacity-100" />
                      <div className="absolute inset-0 opacity-0 shadow-[inset_0_0_0_1px_rgba(201,169,98,0)] transition duration-500 group-hover:opacity-100 group-hover:shadow-[inset_0_0_80px_rgba(201,169,98,0.12)]" />
                      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                        <p className="text-[10px] uppercase tracking-[0.35em] text-accent/95">
                          {item.category_name}
                        </p>
                        <h3 className="mt-2 font-display text-2xl text-sand-50 md:text-3xl">
                          {item.title}
                        </h3>
                        {item.excerpt && (
                          <p className="mt-2 line-clamp-2 max-w-xl text-sm text-sand-200/75">
                            {item.excerpt}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                </motion.article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="relative py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <p className="text-xs uppercase tracking-[0.3em] text-accent">Services</p>
          <h2 className="mt-3 font-display text-4xl text-sand-50 md:text-5xl">What we create</h2>
          <p className="mt-3 max-w-2xl text-sand-300/90">
            Bespoke packages — every commission begins with a conversation.
          </p>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {(data.servicesPreview || []).map((s, i) => {
              const Icon = serviceIcon(s.slug);
              return (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                  className="group relative rounded-2xl border border-white/[0.08] bg-ink-900/35 p-8 transition duration-300 hover:-translate-y-1 hover:border-accent/40 hover:shadow-[0_20px_50px_-20px_rgba(201,169,98,0.15)]"
                >
                  <div className="mb-6 inline-flex rounded-xl border border-white/10 bg-white/5 p-3 text-accent transition group-hover:border-accent/30">
                    <Icon className="h-6 w-6" strokeWidth={1.25} />
                  </div>
                  <h3 className="font-display text-2xl text-sand-50">{s.title}</h3>
                  {s.summary && <p className="mt-3 leading-relaxed text-sand-300/85">{s.summary}</p>}
                  {s.price_hint && (
                    <p className="mt-5 text-sm font-medium tracking-wide text-accent">{s.price_hint}</p>
                  )}
                  <Link
                    to={`/services/${s.slug}`}
                    className="mt-6 inline-flex items-center gap-1 text-sm text-sand-200 transition hover:text-accent"
                  >
                    Details
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Philosophy / About */}
      <section className="relative py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <motion.div
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-white/[0.08] bg-ink-900 lg:aspect-[3/4]"
            >
              <img
                src={ABOUT_SECTION_IMAGE}
                alt=""
                className="h-full w-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-black/50 via-transparent to-transparent" />
            </motion.div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-accent">Philosophy</p>
              <h2 className="mt-4 font-display text-4xl leading-tight text-sand-50 md:text-5xl">
                Light, restraint, and feeling
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-sand-200/85">{aboutBlurb}</p>
              <p className="mt-6 text-sand-400/90">
                We work slowly where it matters — composition, colour, and the in-between moments — so
                your gallery feels cohesive, not crowded.
              </p>
              <Link
                to="/about"
                className="mt-10 inline-flex items-center gap-2 text-sm font-medium text-accent hover:text-accent/90"
              >
                Our story
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <p className="text-xs uppercase tracking-[0.3em] text-accent">Testimonials</p>
          <h2 className="mt-3 font-display text-4xl text-sand-50 md:text-5xl">From clients</h2>
          <div className="mt-14 grid gap-6 md:grid-cols-2">
            {data.featuredTestimonials?.map((t, i) => {
              const highlight = i === 0;
              return (
                <motion.blockquote
                  key={t.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                  className={`relative flex flex-col rounded-2xl border p-8 ${
                    highlight
                      ? 'border-accent/35 bg-gradient-to-br from-ink-800/80 to-ink-900/90 shadow-[0_0_0_1px_rgba(201,169,98,0.12),0_25px_60px_-30px_rgba(0,0,0,0.6)]'
                      : 'border-white/[0.07] bg-ink-900/40'
                  }`}
                >
                  {highlight && (
                    <span className="absolute right-6 top-6 text-[10px] uppercase tracking-[0.2em] text-accent">
                      Featured
                    </span>
                  )}
                  <StarRating rating={t.rating} />
                  <p className="mt-5 font-display text-xl italic leading-relaxed text-sand-100 md:text-2xl">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <footer className="mt-8 flex items-center gap-4">
                    {t.image_path ? (
                      <img
                        src={assetUrl(t.image_path)}
                        alt=""
                        className="h-12 w-12 rounded-full object-cover ring-2 ring-white/10"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 font-display text-sm text-sand-100 ring-2 ring-white/10">
                        {initialsFromName(t.client_name)}
                      </div>
                    )}
                    <div>
                      <div className="font-medium text-sand-100">{t.client_name}</div>
                      {t.role_or_event && (
                        <div className="text-sm text-sand-500">{t.role_or_event}</div>
                      )}
                    </div>
                  </footer>
                </motion.blockquote>
              );
            })}
          </div>
        </div>
      </section>

      {/* Full-width booking CTA */}
      <section className="relative pt-12 md:pt-16">
        <div className="relative overflow-hidden rounded-t-3xl bg-gradient-to-br from-ink-900 via-black to-ink-950 px-4 py-16 md:px-8 md:py-24">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(201,169,98,0.12),transparent_55%)]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_80%_100%,rgba(201,169,98,0.06),transparent_50%)]"
          />
          <div className="relative z-10 mx-auto max-w-3xl text-center">
            <p className="text-xs uppercase tracking-[0.35em] text-accent">Enquiries</p>
            <h2 className="mt-5 font-display text-3xl text-sand-50 md:text-5xl">
              Begin your commission
            </h2>
            <p className="mt-5 text-lg text-sand-300/85">
              Share your date, venue, and the mood you are chasing — we will respond with availability
              and a tailored outline.
            </p>
            <Link
              to="/contact"
              className="mt-10 inline-flex items-center justify-center rounded-full bg-accent px-10 py-4 text-sm font-semibold uppercase tracking-[0.15em] text-ink-950 transition hover:bg-accent/90"
            >
              Request availability
            </Link>
          </div>
        </div>
      </section>
      </div>
    </section>
  );
}
