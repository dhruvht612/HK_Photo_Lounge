import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { assetUrl } from '../lib/assets.js';
import { ImagePlaceholder } from '../components/ImagePlaceholder.jsx';

export function Services() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/api/services')
      .then(setServices)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-24">
      <header className="max-w-2xl">
        <p className="text-xs uppercase tracking-[0.3em] text-accent">Services</p>
        <h1 className="mt-3 font-display text-4xl text-sand-50 md:text-5xl">What we offer</h1>
        <p className="mt-4 text-sand-200/70">
          From full wedding coverage to intimate portraits — packages can be tailored to your timeline
          and location.
        </p>
      </header>

      {loading ? (
        <p className="mt-16 text-sand-200/50">Loading…</p>
      ) : (
        <div className="mt-14 grid gap-10 md:grid-cols-2">
          {services.map((s, i) => (
            <motion.article
              key={s.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="overflow-hidden rounded-2xl border border-white/5 bg-ink-900/50"
            >
              <div className="aspect-[16/10] overflow-hidden">
                {s.image_path ? (
                  <img
                    src={assetUrl(s.image_path)}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <ImagePlaceholder className="h-full w-full" />
                )}
              </div>
              <div className="p-8">
                <h2 className="font-display text-3xl text-sand-50">{s.title}</h2>
                {s.summary && <p className="mt-3 text-sand-200/75">{s.summary}</p>}
                {s.price_hint && <p className="mt-4 text-accent">{s.price_hint}</p>}
                <Link
                  to={`/services/${s.slug}`}
                  className="mt-6 inline-flex rounded-full border border-white/15 px-5 py-2 text-sm text-sand-100 hover:border-white/35"
                >
                  View details
                </Link>
              </div>
            </motion.article>
          ))}
        </div>
      )}
    </div>
  );
}
