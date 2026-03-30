import { Router } from 'express';
import { db } from '../db/database.js';
import { requireAuth } from '../middleware/auth.js';
import { slugify, uniqueSlug } from '../utils/slug.js';

const router = Router();

function rowToPublic(row, images) {
  return {
    ...row,
    is_featured: !!row.is_featured,
    published: !!row.published,
    gallery: images || [],
  };
}

router.get('/', (req, res) => {
  const { category, featured, admin } = req.query;
  let sql = `SELECT p.*, c.name AS category_name, c.slug AS category_slug
             FROM portfolio_items p
             JOIN categories c ON c.id = p.category_id`;
  const params = [];
  const where = [];
  if (!admin) {
    where.push('p.published = 1');
  }
  if (category) {
    where.push('c.slug = ?');
    params.push(category);
  }
  if (featured === '1' || featured === 'true') {
    where.push('p.is_featured = 1');
  }
  if (where.length) sql += ' WHERE ' + where.join(' AND ');
  sql += ' ORDER BY p.featured_order DESC, p.created_at DESC';
  const rows = db.prepare(sql).all(...params);
  res.json(rows);
});

router.get('/slug/:slug', (req, res) => {
  const row = db
    .prepare(
      `SELECT p.*, c.name AS category_name, c.slug AS category_slug
       FROM portfolio_items p
       JOIN categories c ON c.id = p.category_id
       WHERE p.slug = ? AND p.published = 1`
    )
    .get(req.params.slug);
  if (!row) return res.status(404).json({ error: 'Not found' });
  const images = db
    .prepare(
      'SELECT * FROM portfolio_images WHERE portfolio_item_id = ? ORDER BY sort_order ASC, id ASC'
    )
    .all(row.id);
  res.json(rowToPublic(row, images));
});

router.get('/:id', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  const row = db
    .prepare(
      `SELECT p.*, c.name AS category_name, c.slug AS category_slug
       FROM portfolio_items p
       JOIN categories c ON c.id = p.category_id WHERE p.id = ?`
    )
    .get(id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  const images = db
    .prepare(
      'SELECT * FROM portfolio_images WHERE portfolio_item_id = ? ORDER BY sort_order ASC, id ASC'
    )
    .all(id);
  res.json(rowToPublic(row, images));
});

router.post('/', requireAuth, (req, res) => {
  const { category_id, title, excerpt, description, cover_image, is_featured, featured_order, published } =
    req.body || {};
  if (!category_id || !title?.trim()) {
    return res.status(400).json({ error: 'category_id and title are required' });
  }
  const cat = db.prepare('SELECT id FROM categories WHERE id = ?').get(Number(category_id));
  if (!cat) return res.status(400).json({ error: 'Invalid category' });
  const base = slugify(title);
  const slug = uniqueSlug(base, (s) => !!db.prepare('SELECT 1 FROM portfolio_items WHERE slug = ?').get(s));
  const now = new Date().toISOString();
  const info = db
    .prepare(
      `INSERT INTO portfolio_items (
        category_id, title, slug, excerpt, description, cover_image,
        is_featured, featured_order, published, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      Number(category_id),
      title.trim(),
      slug,
      excerpt?.trim() || null,
      description?.trim() || null,
      cover_image || null,
      is_featured ? 1 : 0,
      Number(featured_order) || 0,
      published !== false ? 1 : 0,
      now
    );
  const id = info.lastInsertRowid;
  const row = db
    .prepare(
      `SELECT p.*, c.name AS category_name, c.slug AS category_slug
       FROM portfolio_items p JOIN categories c ON c.id = p.category_id WHERE p.id = ?`
    )
    .get(id);
  res.status(201).json(rowToPublic(row, []));
});

router.put('/:id', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM portfolio_items WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  const {
    category_id,
    title,
    excerpt,
    description,
    cover_image,
    is_featured,
    featured_order,
    published,
    slug: bodySlug,
  } = req.body || {};

  let slug = existing.slug;
  if (bodySlug?.trim()) {
    const want = slugify(bodySlug);
    slug = uniqueSlug(want, (s) =>
      !!db.prepare('SELECT 1 FROM portfolio_items WHERE slug = ? AND id != ?').get(s, id)
    );
  } else if (title?.trim() && title.trim() !== existing.title) {
    const base = slugify(title);
    slug = uniqueSlug(base, (s) =>
      !!db.prepare('SELECT 1 FROM portfolio_items WHERE slug = ? AND id != ?').get(s, id)
    );
  }

  const catId = category_id != null ? Number(category_id) : existing.category_id;
  if (category_id != null && !db.prepare('SELECT id FROM categories WHERE id = ?').get(catId)) {
    return res.status(400).json({ error: 'Invalid category' });
  }

  const now = new Date().toISOString();
  db.prepare(
    `UPDATE portfolio_items SET
      category_id = ?, title = ?, slug = ?, excerpt = ?, description = ?, cover_image = ?,
      is_featured = ?, featured_order = ?, published = ?, updated_at = ?
     WHERE id = ?`
  ).run(
    catId,
    title?.trim() ?? existing.title,
    slug,
    excerpt !== undefined ? excerpt?.trim() || null : existing.excerpt,
    description !== undefined ? description?.trim() || null : existing.description,
    cover_image !== undefined ? cover_image || null : existing.cover_image,
    is_featured !== undefined ? (is_featured ? 1 : 0) : existing.is_featured,
    featured_order !== undefined ? Number(featured_order) || 0 : existing.featured_order,
    published !== undefined ? (published ? 1 : 0) : existing.published,
    now,
    id
  );
  const row = db
    .prepare(
      `SELECT p.*, c.name AS category_name, c.slug AS category_slug
       FROM portfolio_items p JOIN categories c ON c.id = p.category_id WHERE p.id = ?`
    )
    .get(id);
  const images = db
    .prepare(
      'SELECT * FROM portfolio_images WHERE portfolio_item_id = ? ORDER BY sort_order ASC, id ASC'
    )
    .all(id);
  res.json(rowToPublic(row, images));
});

router.delete('/:id', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  const info = db.prepare('DELETE FROM portfolio_items WHERE id = ?').run(id);
  if (info.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.status(204).send();
});

router.post('/:id/images', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  const item = db.prepare('SELECT id FROM portfolio_items WHERE id = ?').get(id);
  if (!item) return res.status(404).json({ error: 'Portfolio item not found' });
  const { image_path, caption, sort_order } = req.body || {};
  if (!image_path) return res.status(400).json({ error: 'image_path is required' });
  const maxSort =
    db.prepare('SELECT COALESCE(MAX(sort_order), -1) AS m FROM portfolio_images WHERE portfolio_item_id = ?').get(
      id
    ).m + 1;
  const info = db
    .prepare(
      `INSERT INTO portfolio_images (portfolio_item_id, image_path, caption, sort_order)
       VALUES (?, ?, ?, ?)`
    )
    .run(id, image_path, caption?.trim() || null, sort_order !== undefined ? Number(sort_order) : maxSort);
  const img = db.prepare('SELECT * FROM portfolio_images WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(img);
});

router.delete('/images/:imageId', requireAuth, (req, res) => {
  const imageId = Number(req.params.imageId);
  const info = db.prepare('DELETE FROM portfolio_images WHERE id = ?').run(imageId);
  if (info.changes === 0) return res.status(404).json({ error: 'Image not found' });
  res.status(204).send();
});

router.patch('/images/:imageId', requireAuth, (req, res) => {
  const imageId = Number(req.params.imageId);
  const row = db.prepare('SELECT * FROM portfolio_images WHERE id = ?').get(imageId);
  if (!row) return res.status(404).json({ error: 'Image not found' });
  const { caption, sort_order } = req.body || {};
  db.prepare(
    `UPDATE portfolio_images SET caption = ?, sort_order = ? WHERE id = ?`
  ).run(
    caption !== undefined ? caption?.trim() || null : row.caption,
    sort_order !== undefined ? Number(sort_order) : row.sort_order,
    imageId
  );
  res.json(db.prepare('SELECT * FROM portfolio_images WHERE id = ?').get(imageId));
});

export default router;
