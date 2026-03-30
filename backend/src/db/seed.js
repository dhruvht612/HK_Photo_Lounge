import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { initSchema, db } from './database.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

initSchema();

const email = process.env.ADMIN_EMAIL || 'admin@hkphotolounge.com';
const password = process.env.ADMIN_PASSWORD || 'changeme123';

const hash = bcrypt.hashSync(password, 10);
const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
if (!existing) {
  db.prepare('INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)').run(
    email,
    hash,
    'Studio Admin'
  );
  console.log('Created admin user:', email);
} else {
  console.log('Admin user already exists:', email);
}

const settings = [
  ['hero_title', JSON.stringify('Moments, framed in light.')],
  ['hero_subtitle', JSON.stringify('Hong Kong photography for weddings, portraits, and brands.')],
  [
    'about_blurb',
    JSON.stringify(
      'HK Photo Lounge is Harikishan Thakar’s photography — macro, wildlife, events, weddings, and more — based in Brampton and serving the GTA.'
    ),
  ],
  ['contact_email', JSON.stringify('hello@hkphotolounge.com')],
  ['contact_phone', JSON.stringify('+852 0000 0000')],
  ['social_instagram', JSON.stringify('@hkphotolounge')],
];
const upsert = db.prepare(
  `INSERT INTO site_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO NOTHING`
);
for (const [k, v] of settings) upsert.run(k, v);

const catCount = db.prepare('SELECT COUNT(*) AS c FROM categories').get().c;
if (catCount === 0) {
  const cats = [
    ['Weddings', 'weddings', 'Ceremony to reception, told with warmth.'],
    ['Portraits', 'portraits', 'Individuals and families in studio or on location.'],
    ['Commercial', 'commercial', 'Product and brand imagery with a refined edge.'],
  ];
  const insCat = db.prepare(
    'INSERT INTO categories (name, slug, description, sort_order) VALUES (?, ?, ?, ?)'
  );
  for (let i = 0; i < cats.length; i++) {
    insCat.run(cats[i][0], cats[i][1], cats[i][2], i);
  }

  const wid = db.prepare('SELECT id FROM categories WHERE slug = ?').get('weddings').id;
  const pid = db.prepare('SELECT id FROM categories WHERE slug = ?').get('portraits').id;

  db.prepare(
    `INSERT INTO portfolio_items (category_id, title, slug, excerpt, description, cover_image, is_featured, featured_order, published)
     VALUES (?, ?, ?, ?, ?, ?, 1, 10, 1)`
  ).run(
    wid,
    'Harbour sunset vows',
    'harbour-sunset-vows',
    'An intimate rooftop ceremony overlooking Victoria Harbour.',
    'Golden hour portraits and candid reception highlights.',
    null
  );
  db.prepare(
    `INSERT INTO portfolio_items (category_id, title, slug, excerpt, description, cover_image, is_featured, featured_order, published)
     VALUES (?, ?, ?, ?, ?, ?, 1, 5, 1)`
  ).run(
    pid,
    'Editorial portrait study',
    'editorial-portrait-study',
    'Soft window light and minimal styling.',
    'Shot on location with a film-inspired grade.',
    null
  );
  const cid = db.prepare('SELECT id FROM categories WHERE slug = ?').get('commercial').id;
  db.prepare(
    `INSERT INTO portfolio_items (category_id, title, slug, excerpt, description, cover_image, is_featured, featured_order, published)
     VALUES (?, ?, ?, ?, ?, ?, 1, 2, 1)`
  ).run(
    cid,
    'Midnight launch',
    'midnight-launch',
    'Product reveal with sculptural light and controlled colour.',
    'Shot for a luxury retail opening in Tsim Sha Tsui.',
    null
  );

  const svc = db.prepare(
    `INSERT INTO services (title, slug, summary, description, price_hint, sort_order, published)
     VALUES (?, ?, ?, ?, ?, ?, 1)`
  );
  svc.run(
    'Wedding day coverage',
    'wedding-day-coverage',
    'Full-day storytelling from prep to send-off.',
    'Includes online gallery, print rights, and planning consult.',
    'From HK$18,000',
    0
  );
  svc.run(
    'Portrait session',
    'portrait-session',
    '1–2 hour session at studio or outdoor.',
    'Wardrobe guidance and light retouching included.',
    'From HK$3,200',
    1
  );
  svc.run(
    'Event coverage',
    'event-coverage',
    'Galas, launches, and celebrations — discreet, fast, beautiful.',
    'Multi-camera options, rapid selects, and next-day highlights available.',
    'From HK$8,500',
    2
  );

  db.prepare(
    `INSERT INTO testimonials (client_name, quote, role_or_event, rating, is_featured, sort_order, published)
     VALUES (?, ?, ?, 5, 1, 0, 1)`
  ).run(
    'Maya & Jon',
    'They captured every laugh and tear — the gallery still makes us emotional.',
    'Wedding — Central'
  );
  db.prepare(
    `INSERT INTO testimonials (client_name, quote, role_or_event, rating, is_featured, sort_order, published)
     VALUES (?, ?, ?, 5, 1, 1, 1)`
  ).run(
    'Leo Chen',
    'Crisp commercial shots that elevated our launch campaign.',
    'Brand shoot — TST'
  );

  console.log('Seeded demo categories, portfolio, services, testimonials.');
} else {
  const ev = db.prepare('SELECT id FROM services WHERE slug = ?').get('event-coverage');
  if (!ev) {
    db.prepare(
      `INSERT INTO services (title, slug, summary, description, price_hint, sort_order, published, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 1, datetime('now'))`
    ).run(
      'Event coverage',
      'event-coverage',
      'Galas, launches, and celebrations — discreet, fast, beautiful.',
      'Multi-camera options, rapid selects, and next-day highlights available.',
      'From HK$8,500',
      2
    );
    console.log('Added Event coverage service.');
  }
}

console.log('Seed complete. Login with', email, '/', password === 'changeme123' ? '(default password)' : '***');
