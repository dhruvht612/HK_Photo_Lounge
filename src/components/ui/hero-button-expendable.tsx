import { useState, useEffect, type FormEvent } from 'react';
import { X, Check, ArrowRight, BarChart3, Globe2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MeshGradient } from '@paper-design/shaders-react';
import { api } from '@/api/client.js';

export type HeroExpandableProps = {
  badgeText?: string;
  studioName?: string;
  headlineBefore?: string;
  headlineGradient?: string;
  subheadline?: string;
  contactEmail?: string | null;
  contactPhone?: string | null;
  instagram?: string | null;
  /** Short trust markers, e.g. "Editorial · Hong Kong · Since 2014" */
  trustLine?: string;
  ctaLabel?: string;
  modalTagline?: string;
  modalBody?: string;
  testimonialQuote?: string;
  testimonialName?: string;
  testimonialRole?: string;
  testimonialImageUrl?: string;
};

export default function HeroButtonExpandable({
  badgeText = 'New: editorial portrait sessions',
  studioName,
  headlineBefore = 'Frame your story in',
  headlineGradient = 'Hong Kong light',
  subheadline = 'Weddings, portraits, and brand work — natural light, honest emotion, and a gallery you will revisit for years.',
  contactEmail,
  contactPhone,
  instagram,
  trustLine = 'Editorial · Hong Kong · Commission-led',
  ctaLabel = 'Start your journey',
  modalTagline = 'Ready to create?',
  modalBody = 'Join couples and brands who trust HK Photo Lounge for calm direction and timeless images.',
  testimonialQuote = 'They captured every laugh and tear — the gallery still makes us emotional.',
  testimonialName = 'Maya & Jon',
  testimonialRole = 'Wedding — Central',
  testimonialImageUrl = 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=128&h=128&fit=crop',
}: HeroExpandableProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [formStep, setFormStep] = useState<'idle' | 'submitting' | 'success'>('idle');

  const handleExpand = () => setIsExpanded(true);

  const handleClose = () => {
    setIsExpanded(false);
    setTimeout(() => setFormStep('idle'), 500);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const name = (form.elements.namedItem('name') as HTMLInputElement)?.value?.trim();
    const email = (form.elements.namedItem('email') as HTMLInputElement)?.value?.trim();
    const company = (form.elements.namedItem('company') as HTMLInputElement)?.value?.trim();
    const size = (form.elements.namedItem('size') as HTMLSelectElement)?.value;
    const message = (form.elements.namedItem('message') as HTMLTextAreaElement)?.value?.trim();

    const parts = [message];
    if (company) parts.push(`Company: ${company}`);
    if (size) parts.push(`Team size: ${size}`);
    const fullMessage = parts.filter(Boolean).join('\n\n');

    if (!name || !email || !fullMessage) return;

    setFormStep('submitting');
    try {
      await api.post('/api/inquiries', {
        name,
        email,
        phone: '',
        service_interest: 'Hero demo request',
        event_date: null,
        message: fullMessage,
      });
      setFormStep('success');
    } catch {
      setFormStep('idle');
      alert('Could not send your request. Please try again or use the Contact page.');
    }
  };

  useEffect(() => {
    if (isExpanded) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isExpanded]);

  return (
    <>
      <div className="relative z-10 flex flex-col items-center gap-6 text-center text-sand-100 sm:gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm font-medium text-sand-200 backdrop-blur-sm"
          >
            <span className="mr-2 flex h-2 w-2 rounded-full bg-accent shadow-[0_0_10px_rgba(201,169,98,0.85)]" />
            {badgeText}
          </motion.div>

          {studioName?.trim() ? (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="-mt-2 font-display text-lg tracking-[0.2em] text-sand-400 sm:text-xl"
            >
              {studioName.trim()}
            </motion.p>
          ) : null}

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="max-w-4xl text-balance text-4xl font-bold tracking-tight text-sand-100 sm:text-5xl md:text-6xl lg:text-7xl"
          >
            {headlineBefore.trim() ? (
              <>
                {headlineBefore}{' '}
                <br className="hidden sm:block" />
              </>
            ) : null}
            <span className="bg-gradient-to-br from-accent via-[#e8d5a3] to-accent-muted bg-clip-text text-transparent">
              {headlineGradient}
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-2xl px-4 text-base leading-relaxed text-sand-300 sm:text-lg md:text-xl"
          >
            {subheadline}
          </motion.p>

          {(contactEmail || contactPhone || instagram) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
              className="flex max-w-lg flex-col gap-2 text-sm text-sand-400 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-x-8 sm:gap-y-1"
            >
              {contactEmail ? (
                <a
                  href={`mailto:${contactEmail}`}
                  className="text-sand-300 underline-offset-4 transition hover:text-accent hover:underline"
                >
                  {contactEmail}
                </a>
              ) : null}
              {contactPhone ? (
                <a
                  href={`tel:${contactPhone.replace(/\s/g, '')}`}
                  className="text-sand-300 transition hover:text-accent"
                >
                  {contactPhone}
                </a>
              ) : null}
              {instagram ? (
                instagram.startsWith('http') ? (
                  <a
                    href={instagram}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sand-300 transition hover:text-accent"
                  >
                    Instagram
                  </a>
                ) : (
                  <a
                    href={`https://instagram.com/${instagram.replace(/^@/, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sand-300 transition hover:text-accent"
                  >
                    {instagram}
                  </a>
                )
              ) : null}
            </motion.div>
          )}

          <AnimatePresence initial={false}>
            {!isExpanded && (
              <motion.button
                type="button"
                layoutId="cta-card"
                style={{ borderRadius: 9999 }}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                transition={{ type: 'spring', stiffness: 380, damping: 28, delay: 0.15 }}
                onClick={handleExpand}
                className="relative z-10 mt-2 inline-flex h-14 min-w-[220px] items-center justify-center gap-2 rounded-full bg-accent px-8 text-lg font-semibold tracking-wide text-ink-950 shadow-lg shadow-black/40 ring-1 ring-white/10 transition hover:bg-accent/95 hover:shadow-xl hover:shadow-accent/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-[0.98]"
              >
                {ctaLabel}
                <ArrowRight className="h-5 w-5 shrink-0" aria-hidden />
              </motion.button>
            )}
          </AnimatePresence>

          {trustLine ? (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45, duration: 0.6 }}
              className="mt-4 max-w-xl text-[11px] font-medium uppercase tracking-[0.35em] text-sand-500"
            >
              {trustLine}
            </motion.p>
          ) : null}
        </div>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4">
            <motion.div
              layoutId="cta-card"
              transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
              style={{ borderRadius: '24px' }}
              layout
              className="relative flex h-full w-full overflow-hidden bg-ink-900 shadow-2xl sm:rounded-[24px]"
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="pointer-events-none absolute inset-0"
              >
                <MeshGradient
                  speed={0.65}
                  colors={['#121214', '#1f1c18', '#2a241c', '#3d3428']}
                  distortion={0.75}
                  swirl={0.14}
                  grainMixer={0.12}
                  grainOverlay={0}
                  style={{ height: '100%', width: '100%' }}
                />
              </motion.div>

              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                type="button"
                onClick={handleClose}
                className="absolute right-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition-colors hover:bg-white/20 sm:right-8 sm:top-8"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </motion.button>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                className="relative z-10 mx-auto flex h-full w-full max-w-7xl flex-col overflow-y-auto lg:flex-row lg:overflow-hidden"
              >
                <div className="flex flex-1 flex-col justify-center gap-8 p-8 text-white sm:p-12 lg:p-16">
                  <div className="space-y-4">
                    <h2 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
                      {modalTagline}
                    </h2>
                    <p className="max-w-md text-lg text-sand-200/90">{modalBody}</p>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/10 backdrop-blur-sm">
                        <BarChart3 className="h-6 w-6 text-accent" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">Editorial direction</h3>
                        <p className="mt-1 text-sm leading-relaxed text-sand-200/75">
                          Mood boards, locations, and timelines — planned so the day feels effortless.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/10 backdrop-blur-sm">
                        <Globe2 className="h-6 w-6 text-accent" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">Hong Kong &amp; beyond</h3>
                        <p className="mt-1 text-sm leading-relaxed text-sand-200/75">
                          On-location shoots across the city, from harbour views to intimate studios.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto border-t border-white/20 pt-8">
                    <figure>
                      <blockquote className="mb-6 text-xl font-medium leading-relaxed">
                        &ldquo;{testimonialQuote}&rdquo;
                      </blockquote>
                      <figcaption className="flex items-center gap-4">
                        <img
                          src={testimonialImageUrl}
                          alt=""
                          width={48}
                          height={48}
                          className="h-12 w-12 rounded-full object-cover object-center ring-2 ring-white/20"
                        />
                        <div>
                          <div className="font-semibold">{testimonialName}</div>
                          <div className="text-sm text-sand-300">{testimonialRole}</div>
                        </div>
                      </figcaption>
                    </figure>
                  </div>
                </div>

                <div className="flex flex-1 items-center justify-center bg-ink-950/30 p-4 backdrop-blur-sm sm:p-12 lg:bg-transparent lg:p-16 lg:backdrop-blur-none">
                  <div className="w-full max-w-md rounded-2xl border border-white/15 bg-white/10 p-6 shadow-2xl backdrop-blur-md sm:p-8">
                    {formStep === 'success' ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex h-[400px] flex-col items-center justify-center space-y-6 text-center"
                      >
                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-500 shadow-lg shadow-green-500/30">
                          <Check className="h-10 w-10 text-white" />
                        </div>
                        <div>
                          <h3 className="mb-2 text-2xl font-bold text-white">Request received</h3>
                          <p className="text-sand-200">We will be in touch shortly.</p>
                        </div>
                        <button
                          type="button"
                          onClick={handleClose}
                          className="rounded-lg bg-white/20 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-white/30"
                        >
                          Close
                        </button>
                      </motion.div>
                    ) : (
                      <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-1">
                          <h3 className="text-xl font-semibold text-white">Book a consult</h3>
                          <p className="text-sm text-sand-200/90">Tell us about your session — we will reply within two business days.</p>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <label htmlFor="hero-name" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-sand-300/90">
                              Full name
                            </label>
                            <input
                              required
                              type="text"
                              id="hero-name"
                              name="name"
                              placeholder="Jane Doe"
                              className="w-full rounded-lg border border-white/15 bg-ink-950/50 px-4 py-3 text-sm text-white placeholder:text-white/35 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-accent"
                            />
                          </div>

                          <div>
                            <label htmlFor="hero-email" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-sand-300/90">
                              Email
                            </label>
                            <input
                              required
                              type="email"
                              id="hero-email"
                              name="email"
                              placeholder="jane@email.com"
                              className="w-full rounded-lg border border-white/15 bg-ink-950/50 px-4 py-3 text-sm text-white placeholder:text-white/35 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-accent"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label htmlFor="hero-company" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-sand-300/90">
                                Company
                              </label>
                              <input
                                type="text"
                                id="hero-company"
                                name="company"
                                placeholder="Optional"
                                className="w-full rounded-lg border border-white/15 bg-ink-950/50 px-4 py-3 text-sm text-white placeholder:text-white/35 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-accent"
                              />
                            </div>
                            <div>
                              <label htmlFor="hero-size" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-sand-300/90">
                                Size
                              </label>
                              <select
                                id="hero-size"
                                name="size"
                                className="w-full cursor-pointer appearance-none rounded-lg border border-white/15 bg-ink-950/50 px-4 py-3 text-sm text-white transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-accent"
                              >
                                <option className="bg-ink-900">1-50</option>
                                <option className="bg-ink-900">51-200</option>
                                <option className="bg-ink-900">201-1000</option>
                                <option className="bg-ink-900">1000+</option>
                              </select>
                            </div>
                          </div>

                          <div>
                            <label htmlFor="hero-message" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-sand-300/90">
                              Your needs
                            </label>
                            <textarea
                              id="hero-message"
                              name="message"
                              required
                              rows={3}
                              placeholder="Wedding date, portrait style, or brand brief…"
                              className="w-full resize-none rounded-lg border border-white/15 bg-ink-950/50 px-4 py-3 text-sm text-white placeholder:text-white/35 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-accent"
                            />
                          </div>
                        </div>

                        <button
                          disabled={formStep === 'submitting'}
                          type="submit"
                          className="mt-2 flex w-full items-center justify-center rounded-lg bg-accent px-8 py-3.5 font-semibold text-ink-950 transition-all hover:bg-accent/90 focus:ring-4 focus:ring-accent/35 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          {formStep === 'submitting' ? (
                            <span className="flex items-center gap-2">
                              <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink-950 border-t-transparent" />
                              Sending…
                            </span>
                          ) : (
                            'Submit request'
                          )}
                        </button>

                        <p className="mt-4 text-center text-xs text-sand-300/50">
                          By submitting, you agree to be contacted about your inquiry.
                        </p>
                      </form>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
