import { Router } from 'express';
import { db } from '../db/database.js';
import { requireAuth } from '../middleware/auth.js';
import { slugify, uniqueSlug } from '../utils/slug.js';

const router = Router();

router.get('/', (req, res) => {
  const admin = req.query.admin === '1' || req.query.admin === 'true';
  let sql = 'SELECT * FROM services';
  if (!admin) sql += ' WHERE published = 1';
  sql += ' ORDER BY sort_order ASC, title ASC';
  const rows = db.prepare(sql).all();
  res.json(rows.map((r) => ({ ...r, published: !!r.published })));
});

router.get('/slug/:slug', (req, res) => {
  const row = db.prepare('SELECT * FROM services WHERE slug = ? AND published = 1').get(req.params.slug);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json({ ...row, published: !!row.published });
});

router.get('/:id', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  const row = db.prepare('SELECT * FROM services WHERE id = ?').get(id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json({ ...row, published: !!row.published });
});

router.post('/', requireAuth, (req, res) => {
  const { title, summary, description, price_hint, image_path, sort_order, published } = req.body || {};
  if (!title?.trim()) return res.status(400).json({ error: 'Title is required' });
  const base = slugify(title);
  const slug = uniqueSlug(base, (s) => !!db.prepare('SELECT 1 FROM services WHERE slug = ?').get(s));
  const now = new Date().toISOString();
  const info = db
    .prepare(
      `INSERT INTO services (title, slug, summary, description, price_hint, image_path, sort_order, published, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      title.trim(),
      slug,
      summary?.trim() || null,
      description?.trim() || null,
      price_hint?.trim() || null,
      image_path || null,
      Number(sort_order) || 0,
      published !== false ? 1 : 0,
      now
    );
  const row = db.prepare('SELECT * FROM services WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ ...row, published: !!row.published });
});

router.put('/:id', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM services WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  const { title, summary, description, price_hint, image_path, sort_order, published, slug: bodySlug } = req.body || {};
  let slug = existing.slug;
  if (bodySlug?.trim()) {
    const want = slugify(bodySlug);
    slug = uniqueSlug(want, (s) =>
      !!db.prepare('SELECT 1 FROM services WHERE slug = ? AND id != ?').get(s, id)
    );
  } else if (title?.trim() && title.trim() !== existing.title) {
    const base = slugify(title);
    slug = uniqueSlug(base, (s) =>
      !!db.prepare('SELECT 1 FROM services WHERE slug = ? AND id != ?').get(s, id)
    );
  }
  const now = new Date().toISOString();
  db.prepare(
    `UPDATE services SET title = ?, slug = ?, summary = ?, description = ?, price_hint = ?,
     image_path = ?, sort_order = ?, published = ?, updated_at = ? WHERE id = ?`
  ).run(
    title?.trim() ?? existing.title,
    slug,
    summary !== undefined ? summary?.trim() || null : existing.summary,
    description !== undefined ? description?.trim() || null : existing.description,
    price_hint !== undefined ? price_hint?.trim() || null : existing.price_hint,
    image_path !== undefined ? image_path || null : existing.image_path,
    sort_order !== undefined ? Number(sort_order) || 0 : existing.sort_order,
    published !== undefined ? (published ? 1 : 0) : existing.published,
    now,
    id
  );
  const row = db.prepare('SELECT * FROM services WHERE id = ?').get(id);
  res.json({ ...row, published: !!row.published });
});

router.delete('/:id', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  const info = db.prepare('DELETE FROM services WHERE id = ?').run(id);
  if (info.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.status(204).send();
});

export default router;
