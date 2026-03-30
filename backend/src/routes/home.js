import { Router } from 'express';
import { db } from '../db/database.js';

const router = Router();

function parseValue(raw) {
  if (raw == null) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

router.get('/', (_req, res) => {
  const settingsRows = db.prepare('SELECT key, value FROM site_settings').all();
  const settings = {};
  const publicKeys = [
    'hero_title',
    'hero_subtitle',
    'about_blurb',
    'contact_email',
    'contact_phone',
    'social_instagram',
  ];
  for (const { key, value } of settingsRows) {
    if (publicKeys.includes(key)) settings[key] = parseValue(value);
  }

  const featuredPortfolio = db
    .prepare(
      `SELECT p.*, c.name AS category_name, c.slug AS category_slug
       FROM portfolio_items p
       JOIN categories c ON c.id = p.category_id
       WHERE p.published = 1 AND p.is_featured = 1
       ORDER BY p.featured_order DESC, p.created_at DESC
       LIMIT 12`
    )
    .all();

  const featuredTestimonials = db
    .prepare(
      `SELECT * FROM testimonials
       WHERE published = 1 AND is_featured = 1
       ORDER BY sort_order ASC, created_at DESC
       LIMIT 8`
    )
    .all()
    .map((t) => ({ ...t, published: !!t.published, is_featured: !!t.is_featured }));

  const services = db
    .prepare('SELECT id, title, slug, summary, price_hint, image_path FROM services WHERE published = 1 ORDER BY sort_order ASC LIMIT 6')
    .all();

  res.json({
    settings,
    featuredPortfolio,
    featuredTestimonials,
    servicesPreview: services,
  });
});

export default router;
