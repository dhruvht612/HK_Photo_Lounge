import { Router } from 'express';
import { db } from '../db/database.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/', (req, res) => {
  const { name, email, phone, service_interest, event_date, message } = req.body || {};
  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return res.status(400).json({ error: 'Name, email, and message are required' });
  }
  const info = db
    .prepare(
      `INSERT INTO inquiries (name, email, phone, service_interest, event_date, message, status)
       VALUES (?, ?, ?, ?, ?, ?, 'new')`
    )
    .run(
      name.trim(),
      email.trim().toLowerCase(),
      phone?.trim() || null,
      service_interest?.trim() || null,
      event_date?.trim() || null,
      message.trim()
    );
  const row = db.prepare('SELECT * FROM inquiries WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ id: row.id, message: 'Thank you — we will be in touch soon.' });
});

router.get('/', requireAuth, (req, res) => {
  const status = req.query.status;
  let sql = 'SELECT * FROM inquiries';
  const params = [];
  if (status) {
    sql += ' WHERE status = ?';
    params.push(status);
  }
  sql += ' ORDER BY created_at DESC';
  const rows = db.prepare(sql).all(...params);
  res.json(rows);
});

router.get('/:id', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  const row = db.prepare('SELECT * FROM inquiries WHERE id = ?').get(id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(row);
});

router.patch('/:id', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM inquiries WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  const { status } = req.body || {};
  const allowed = ['new', 'read', 'replied', 'archived'];
  if (status && !allowed.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  if (status) {
    db.prepare('UPDATE inquiries SET status = ? WHERE id = ?').run(status, id);
  }
  res.json(db.prepare('SELECT * FROM inquiries WHERE id = ?').get(id));
});

router.delete('/:id', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  const info = db.prepare('DELETE FROM inquiries WHERE id = ?').run(id);
  if (info.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.status(204).send();
});

export default router;
