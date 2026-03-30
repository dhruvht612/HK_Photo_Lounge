import { Router } from 'express';
import { db } from '../db/database.js';
import { requireAuth } from '../middleware/auth.js';
import { slugify, uniqueSlug } from '../utils/slug.js';

const router = Router();

router.get('/', (_req, res) => {
  const rows = db
    .prepare(
      `SELECT c.*,
        (SELECT COUNT(*) FROM portfolio_items p WHERE p.category_id = c.id AND p.published = 1) AS portfolio_count
       FROM categories c ORDER BY c.sort_order ASC, c.name ASC`
    )
    .all();
  res.json(rows);
});

router.get('/:id', (req, res) => {
  const id = Number(req.params.id);
  const row = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
  if (!row) return res.status(404).json({ error: 'Category not found' });
  res.json(row);
});

router.post('/', requireAuth, (req, res) => {
  const { name, description, sort_order } = req.body || {};
  if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });
  const base = slugify(name);
  const slug = uniqueSlug(base, (s) => !!db.prepare('SELECT 1 FROM categories WHERE slug = ?').get(s));
  const info = db
    .prepare(
      `INSERT INTO categories (name, slug, description, sort_order)
       VALUES (?, ?, ?, ?)`
    )
    .run(name.trim(), slug, description?.trim() || null, Number(sort_order) || 0);
  const row = db.prepare('SELECT * FROM categories WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(row);
});

router.put('/:id', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Category not found' });
  const { name, description, sort_order, slug: bodySlug } = req.body || {};
  let slug = existing.slug;
  if (bodySlug?.trim()) {
    const want = slugify(bodySlug);
    const clash = db.prepare('SELECT id FROM categories WHERE slug = ? AND id != ?').get(want, id);
    slug = clash ? uniqueSlug(want, (s) => !!db.prepare('SELECT 1 FROM categories WHERE slug = ? AND id != ?').get(s, id)) : want;
  } else if (name?.trim() && name.trim() !== existing.name) {
    const base = slugify(name);
    slug = uniqueSlug(base, (s) => !!db.prepare('SELECT 1 FROM categories WHERE slug = ? AND id != ?').get(s, id));
  }
  db.prepare(
    `UPDATE categories SET name = ?, slug = ?, description = ?, sort_order = ?
     WHERE id = ?`
  ).run(
    name?.trim() ?? existing.name,
    slug,
    description !== undefined ? description?.trim() || null : existing.description,
    sort_order !== undefined ? Number(sort_order) || 0 : existing.sort_order,
    id
  );
  res.json(db.prepare('SELECT * FROM categories WHERE id = ?').get(id));
});

router.delete('/:id', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  const info = db.prepare('DELETE FROM categories WHERE id = ?').run(id);
  if (info.changes === 0) return res.status(404).json({ error: 'Category not found' });
  res.status(204).send();
});

export default router;
