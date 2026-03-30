import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { ABOUT_PAGE_PORTRAIT } from '../lib/homeVisuals.js';

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12, delayChildren: 0.04 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  },
};

const serviceTags = [
  'Macro',
  'Wildlife',
  'Events',
  'Birthdays',
  'Weddings',
  'Indian weddings',
  'Punjabi weddings',
  'Photoshoots',
  'Newborn',
];

const stats = [
  { title: 'Brampton, ON', subtitle: "Canada's Flower City" },
  { title: 'GTA', subtitle: 'Local communities served' },
  { title: 'Travel', subtitle: 'Available when your story travels' },
];

export function About() {
  return (
    <div className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_55%_at_50%_-15%,rgba(201,169,98,0.11),transparent_58%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_45%_at_100%_60%,rgba(0,0,0,0.45),transparent_55%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_0%_80%,rgba(18,18,20,0.6),transparent_50%)]"
      />

      <div className="relative mx-auto max-w-6xl px-4 py-24 sm:px-6 md:py-28 lg:px-8">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="grid gap-16 lg:grid-cols-2 lg:items-center lg:gap-20"
        >
          <motion.div variants={itemVariants} className="order-1 lg:order-none">
            <div className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-ink-900/30 shadow-[0_28px_80px_-40px_rgba(0,0,0,0.85),0_0_0_1px_rgba(255,255,255,0.04)_inset] md:rounded-3xl">
              <div className="aspect-[4/5] overflow-hidden md:aspect-[3/4]">
                <img
                  src={ABOUT_PAGE_PORTRAIT}
                  alt="Harikishan Thakar — HK Photo Lounge"
                  className="h-full w-full object-cover object-center transition duration-[1.1s] ease-out group-hover:scale-[1.04]"
                />
              </div>
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10 opacity-80"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-0 shadow-[inset_0_0_0_1px_rgba(201,169,98,0)] transition duration-500 group-hover:opacity-100 group-hover:shadow-[inset_0_0_100px_rgba(201,169,98,0.06)]"
              />
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="order-2 flex flex-col justify-center lg:order-none">
            <p className="text-xs font-medium uppercase tracking-[0.3em] text-accent">About</p>
            <h1 className="mt-5 font-display text-4xl leading-[1.1] tracking-tight text-sand-50 md:text-5xl lg:text-[3.25rem]">
              Timeless imagery, crafted with intention
            </h1>
            <p className="mt-4 font-display text-xl text-accent/95 md:text-2xl">Harikishan Thakar</p>
            <p className="mt-1 text-sm text-white/55">HK Photo Lounge</p>

            <div className="mt-8 flex flex-wrap gap-2">
              {serviceTags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-white/[0.1] bg-white/[0.04] px-3 py-1 text-xs text-sand-200/85"
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="mt-10 space-y-6 text-base leading-relaxed text-white/70 md:text-lg">
              <p>
                <span className="text-sand-200/90">HK Photo Lounge</span> is the photography of{' '}
                <span className="text-sand-200/90">Harikishan Thakar</span> — work shaped by curiosity,
                colour, and real moments. From macro and wildlife to events, birthdays, weddings
                (including Indian and Punjabi celebrations), newborn sessions, and creative photoshoots,
                every commission is a chance to tell your story with heart.
              </p>

              <blockquote className="border-l-2 border-accent/50 pl-5 font-display text-lg italic leading-relaxed text-sand-200/90 md:text-xl">
                Do not stop the Imagination. It will create endless fun and joy
              </blockquote>

              <blockquote className="border-l-2 border-white/15 pl-5 font-display text-lg italic leading-relaxed text-sand-300/85 md:text-xl">
                Love what I shoot each time!!!!
              </blockquote>

              <p>
                Based in <strong className="font-medium text-sand-200/90">Brampton, Ontario</strong> — Canada’s Flower City — Harikishan serves{' '}
                <strong className="font-medium text-sand-200/90">communities across the GTA</strong> and is available for travel when your chapter
                takes you further afield.
              </p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.45 }}
              className="mt-12"
            >
              <Link
                to="/contact"
                className="group inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-8 py-3.5 text-sm font-medium text-sand-100 backdrop-blur-sm transition hover:border-accent/35 hover:bg-white/[0.07] hover:text-white"
              >
                Book a session
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" strokeWidth={2} />
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="mt-20 border-t border-white/[0.08] pt-16 md:mt-24 md:pt-20"
        >
          <div className="grid gap-10 sm:grid-cols-3 sm:gap-8">
            {stats.map((item) => (
              <div
                key={item.title}
                className="text-center sm:border-l sm:border-white/[0.06] sm:pl-8 sm:text-left first:sm:border-l-0 first:sm:pl-0"
              >
                <p className="font-display text-2xl tracking-tight text-sand-50 md:text-3xl">{item.title}</p>
                <p className="mt-2 text-sm text-white/55 md:text-[15px]">{item.subtitle}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
