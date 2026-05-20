const base = import.meta.env.VITE_API_URL || '';

export function assetUrl(path) {
  if (!path) return null;
  if (path.startsWith('http') || path.startsWith('data:') || path.startsWith('blob:')) return path;
  return `${base}${path}`;
}
