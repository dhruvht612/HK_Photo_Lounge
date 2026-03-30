import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { assetUrl } from '../lib/assets.js';
import { ImagePlaceholder } from '../components/ImagePlaceholder.jsx';

export function Portfolio() {
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get('category') || '';
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const portfolioUrl = category
      ? `/api/portfolio?category=${encodeURIComponent(category)}`
      : '/api/portfolio';
    Promise.all([api.get('/api/categories'), api.get(portfolioUrl)])
      .then(([cats, port]) => {
        if (!cancelled) {
          setCategories(cats);
          setItems(port);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [category]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-24">
      <header className="max-w-2xl">
        <p className="text-xs uppercase tracking-[0.3em] text-accent">Portfolio</p>
        <h1 className="mt-3 font-display text-4xl text-sand-50 md:text-5xl">Selected work</h1>
        <p className="mt-4 text-sand-200/70">
          Browse by category. Each project is crafted with attention to light, composition, and story.
        </p>
      </header>

      <div className="mt-10 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setSearchParams({})}
          className={`rounded-full px-4 py-1.5 text-sm ${
            !category ? 'bg-white/10 text-sand-50' : 'bg-white/5 text-sand-200/70 hover:bg-white/10'
          }`}
        >
          All
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setSearchParams({ category: c.slug })}
            className={`rounded-full px-4 py-1.5 text-sm ${
              category === c.slug
                ? 'bg-white/10 text-sand-50'
                : 'bg-white/5 text-sand-200/70 hover:bg-white/10'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="mt-16 text-sand-200/50">Loading…</p>
      ) : (
        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => (
            <motion.article
              key={item.id}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="group overflow-hidden rounded-2xl border border-white/5 bg-ink-900/50"
            >
              <Link to={`/portfolio/${item.slug}`} className="block">
                <div className="aspect-[3/4] overflow-hidden">
                  {item.cover_image ? (
                    <img
                      src={assetUrl(item.cover_image)}
                      alt=""
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <ImagePlaceholder className="h-full w-full" />
                  )}
                </div>
                <div className="p-5">
                  <p className="text-xs uppercase tracking-widest text-accent/90">{item.category_name}</p>
                  <h2 className="mt-2 font-display text-2xl text-sand-50">{item.title}</h2>
                  {item.excerpt && (
                    <p className="mt-2 line-clamp-2 text-sm text-sand-200/55">{item.excerpt}</p>
                  )}
                </div>
              </Link>
            </motion.article>
          ))}
        </div>
      )}

      {!loading && items.length === 0 && (
        <p className="mt-16 text-sand-200/50">No projects in this category yet.</p>
      )}
    </div>
  );
}
