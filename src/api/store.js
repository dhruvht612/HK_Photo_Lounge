import { createSeedData } from './seedData.js';

const STORAGE_KEY = 'hk-photo-lounge-data-v1';

let cache = null;

function load() {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      cache = JSON.parse(raw);
      return cache;
    }
  } catch {
    /* reset on corrupt data */
  }
  cache = createSeedData();
  save();
  return cache;
}

export function save() {
  if (cache) localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
}

export function getStore() {
  return load();
}

export function resetStore() {
  cache = createSeedData();
  save();
  return cache;
}

export function nextId(store, key) {
  const id = store.nextId[key];
  store.nextId[key] = id + 1;
  save();
  return id;
}

export function findCategory(store, id) {
  return store.categories.find((c) => c.id === id);
}

export function portfolioWithCategory(store, item) {
  const cat = findCategory(store, item.category_id);
  return {
    ...item,
    category_name: cat?.name ?? null,
    category_slug: cat?.slug ?? null,
  };
}

export function galleryFor(store, portfolioId) {
  return store.portfolioImages
    .filter((img) => img.portfolio_item_id === portfolioId)
    .sort((a, b) => a.sort_order - b.sort_order || a.id - b.id);
}

export function rowToPublic(store, row) {
  const images = galleryFor(store, row.id);
  return {
    ...portfolioWithCategory(store, row),
    is_featured: !!row.is_featured,
    published: !!row.published,
    gallery: images,
  };
}

const PUBLIC_SETTING_KEYS = new Set([
  'hero_title',
  'hero_subtitle',
  'about_blurb',
  'contact_email',
  'contact_phone',
  'social_instagram',
]);

export function publicSettings(store) {
  const out = {};
  for (const key of PUBLIC_SETTING_KEYS) {
    if (store.settings[key] !== undefined) out[key] = store.settings[key];
  }
  return out;
}
