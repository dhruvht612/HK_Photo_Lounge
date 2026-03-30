import { Router } from 'express';
import { db } from '../db/database.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const PUBLIC_KEYS = new Set([
  'hero_title',
  'hero_subtitle',
  'about_blurb',
  'contact_email',
  'contact_phone',
  'social_instagram',
]);

function parseValue(raw) {
  if (raw == null) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

router.get('/public', (_req, res) => {
  const rows = db.prepare('SELECT key, value FROM site_settings').all();
  const out = {};
  for (const { key, value } of rows) {
    if (PUBLIC_KEYS.has(key)) out[key] = parseValue(value);
  }
  res.json(out);
});

router.get('/', requireAuth, (_req, res) => {
  const rows = db.prepare('SELECT key, value FROM site_settings').all();
  const out = {};
  for (const { key, value } of rows) {
    out[key] = parseValue(value);
  }
  res.json(out);
});

router.put('/', requireAuth, (req, res) => {
  const body = req.body || {};
  if (typeof body !== 'object' || Array.isArray(body)) {
    return res.status(400).json({ error: 'Expected JSON object of key/value settings' });
  }
  const upsert = db.prepare(
    `INSERT INTO site_settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`
  );
  const run = db.transaction(() => {
    for (const [key, val] of Object.entries(body)) {
      if (typeof key !== 'string' || !key.trim()) continue;
      const stored = typeof val === 'string' ? val : JSON.stringify(val);
      upsert.run(key.trim(), stored);
    }
  });
  run();
  const rows = db.prepare('SELECT key, value FROM site_settings').all();
  const out = {};
  for (const { key, value } of rows) {
    out[key] = parseValue(value);
  }
  res.json(out);
});

export default router;
