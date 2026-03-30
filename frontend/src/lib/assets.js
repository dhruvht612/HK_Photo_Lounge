const base = import.meta.env.VITE_API_URL || '';

export function assetUrl(path) {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${base}${path}`;
}
