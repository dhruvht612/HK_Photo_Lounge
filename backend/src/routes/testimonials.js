import { Router } from 'express';
import { db } from '../db/database.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', (req, res) => {
  const admin = req.query.admin === '1' || req.query.admin === 'true';
  const featured = req.query.featured === '1' || req.query.featured === 'true';
  let sql = 'SELECT * FROM testimonials WHERE 1=1';
  const params = [];
  if (!admin) sql += ' AND published = 1';
  if (featured) sql += ' AND is_featured = 1';
  sql += ' ORDER BY sort_order ASC, created_at DESC';
  const rows = db.prepare(sql).all(...params);
  res.json(
    rows.map((r) => ({
      ...r,
      published: !!r.published,
      is_featured: !!r.is_featured,
    }))
  );
});

router.get('/:id', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  const row = db.prepare('SELECT * FROM testimonials WHERE id = ?').get(id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json({ ...row, published: !!row.published, is_featured: !!row.is_featured });
});

router.post('/', requireAuth, (req, res) => {
  const { client_name, quote, role_or_event, image_path, rating, is_featured, sort_order, published } =
    req.body || {};
  if (!client_name?.trim() || !quote?.trim()) {
    return res.status(400).json({ error: 'client_name and quote are required' });
  }
  const r = Math.min(5, Math.max(1, Number(rating) || 5));
  const info = db
    .prepare(
      `INSERT INTO testimonials (client_name, quote, role_or_event, image_path, rating, is_featured, sort_order, published)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      client_name.trim(),
      quote.trim(),
      role_or_event?.trim() || null,
      image_path || null,
      r,
      is_featured ? 1 : 0,
      Number(sort_order) || 0,
      published !== false ? 1 : 0
    );
  const row = db.prepare('SELECT * FROM testimonials WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ ...row, published: !!row.published, is_featured: !!row.is_featured });
});

router.put('/:id', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM testimonials WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  const { client_name, quote, role_or_event, image_path, rating, is_featured, sort_order, published } =
    req.body || {};
  const r =
    rating !== undefined ? Math.min(5, Math.max(1, Number(rating) || 5)) : existing.rating;
  db.prepare(
    `UPDATE testimonials SET client_name = ?, quote = ?, role_or_event = ?, image_path = ?,
     rating = ?, is_featured = ?, sort_order = ?, published = ? WHERE id = ?`
  ).run(
    client_name?.trim() ?? existing.client_name,
    quote?.trim() ?? existing.quote,
    role_or_event !== undefined ? role_or_event?.trim() || null : existing.role_or_event,
    image_path !== undefined ? image_path || null : existing.image_path,
    r,
    is_featured !== undefined ? (is_featured ? 1 : 0) : existing.is_featured,
    sort_order !== undefined ? Number(sort_order) || 0 : existing.sort_order,
    published !== undefined ? (published ? 1 : 0) : existing.published,
    id
  );
  const row = db.prepare('SELECT * FROM testimonials WHERE id = ?').get(id);
  res.json({ ...row, published: !!row.published, is_featured: !!row.is_featured });
});

router.delete('/:id', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  const info = db.prepare('DELETE FROM testimonials WHERE id = ?').run(id);
  if (info.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.status(204).send();
});

export default router;
