import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { assetUrl } from '../lib/assets.js';
import { ImagePlaceholder } from '../components/ImagePlaceholder.jsx';

export function PortfolioDetail() {
  const { slug } = useParams();
  const [item, setItem] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    api
      .get(`/api/portfolio/slug/${encodeURIComponent(slug)}`)
      .then(setItem)
      .catch(() => setErr('Not found'));
  }, [slug]);

  if (err) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-24 text-center">
        <p className="text-sand-200/70">Project not found.</p>
        <Link to="/portfolio" className="mt-4 inline-block text-accent">
          ← Back to portfolio
        </Link>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sand-200/50">Loading…</div>
    );
  }

  const gallery = item.gallery || [];

  return (
    <article className="pb-24">
      <div className="relative aspect-[21/9] min-h-[240px] w-full overflow-hidden bg-ink-900">
        {item.cover_image ? (
          <img
            src={assetUrl(item.cover_image)}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <ImagePlaceholder className="h-full min-h-[240px] w-full" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 mx-auto max-w-6xl px-4 pb-10 md:px-6">
          <p className="text-xs uppercase tracking-[0.3em] text-accent">{item.category_name}</p>
          <h1 className="mt-3 font-display text-4xl text-sand-50 md:text-6xl">{item.title}</h1>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 pt-12 md:px-6">
        {item.excerpt && (
          <p className="font-display text-xl italic text-sand-100/90 md:text-2xl">{item.excerpt}</p>
        )}
        {item.description && (
          <div className="prose prose-invert mt-8 max-w-none text-sand-200/80">
            {item.description.split('\n').map((para, i) => (
              <p key={i} className="mb-4">
                {para}
              </p>
            ))}
          </div>
        )}
        <Link
          to={`/portfolio?category=${encodeURIComponent(item.category_slug)}`}
          className="mt-10 inline-block text-sm text-accent hover:text-accent/80"
        >
          ← More in {item.category_name}
        </Link>
      </div>

      {gallery.length > 0 && (
        <div className="mx-auto mt-16 max-w-6xl px-4 md:px-6">
          <h2 className="font-display text-2xl text-sand-50">Gallery</h2>
          <div className="mt-8 columns-1 gap-4 sm:columns-2 lg:columns-3">
            {gallery.map((img, i) => (
              <motion.figure
                key={img.id}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: (i % 6) * 0.05 }}
                className="mb-4 break-inside-avoid overflow-hidden rounded-xl border border-white/5"
              >
                <img
                  src={assetUrl(img.image_path)}
                  alt={img.caption || ''}
                  className="w-full object-cover"
                  loading="lazy"
                />
                {img.caption && (
                  <figcaption className="px-3 py-2 text-xs text-sand-200/50">{img.caption}</figcaption>
                )}
              </motion.figure>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
