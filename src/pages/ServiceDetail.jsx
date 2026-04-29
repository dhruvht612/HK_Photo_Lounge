import { Link, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { assetUrl } from '../lib/assets.js';
import { ImagePlaceholder } from '../components/ImagePlaceholder.jsx';

export function ServiceDetail() {
  const { slug } = useParams();
  const [s, setS] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    api
      .get(`/api/services/slug/${encodeURIComponent(slug)}`)
      .then(setS)
      .catch(() => setErr('Not found'));
  }, [slug]);

  if (err) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-24 text-center">
        <p className="text-sand-200/70">Service not found.</p>
        <Link to="/services" className="mt-4 inline-block text-accent">
          ← All services
        </Link>
      </div>
    );
  }

  if (!s) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sand-200/50">Loading…</div>
    );
  }

  return (
    <article className="pb-24">
      <div className="relative aspect-[21/9] min-h-[200px] overflow-hidden">
        {s.image_path ? (
          <img src={assetUrl(s.image_path)} alt="" className="h-full w-full object-cover" />
        ) : (
          <ImagePlaceholder className="h-full min-h-[200px] w-full" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 mx-auto max-w-6xl px-4 pb-8 md:px-6">
          <h1 className="font-display text-4xl text-sand-50 md:text-5xl">{s.title}</h1>
          {s.price_hint && <p className="mt-3 text-accent">{s.price_hint}</p>}
        </div>
      </div>
      <div className="mx-auto max-w-3xl px-4 pt-12 md:px-6">
        {s.summary && <p className="text-xl text-sand-100/90">{s.summary}</p>}
        {s.description && (
          <div className="prose prose-invert mt-8 max-w-none text-sand-200/80">
            {s.description.split('\n').map((para, i) => (
              <p key={i} className="mb-4">
                {para}
              </p>
            ))}
          </div>
        )}
        <Link
          to="/contact"
          className="mt-10 inline-flex rounded-full bg-accent px-8 py-3 text-sm font-medium text-ink-950 hover:bg-accent/90"
        >
          Inquire about this service
        </Link>
      </div>
    </article>
  );
}
