export function slugify(str) {
  const s = String(str || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return s || 'item';
}

export function uniqueSlug(base, exists) {
  let slug = base;
  let n = 2;
  while (exists(slug)) {
    slug = `${base}-${n}`;
    n += 1;
  }
  return slug;
}
