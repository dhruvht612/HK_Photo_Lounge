import { slugify, uniqueSlug } from '../lib/slug.js';
import {
  findCategory,
  galleryFor,
  getStore,
  nextId,
  portfolioWithCategory,
  publicSettings,
  rowToPublic,
  save,
} from './store.js';

function err(status, message) {
  const e = new Error(message);
  e.status = status;
  throw e;
}

function parseAuth(token) {
  if (!token?.startsWith('mock:')) return null;
  const id = Number(token.slice('mock:'.length));
  const store = getStore();
  const user = store.users.find((u) => u.id === id);
  return user || null;
}

function requireAuth(token) {
  const user = parseAuth(token);
  if (!user) err(401, 'Unauthorized');
  return user;
}

function parsePath(path) {
  const [pathname, search] = path.split('?');
  const segments = pathname.replace(/^\/api/, '').split('/').filter(Boolean);
  const query = new URLSearchParams(search || '');
  return { segments, query };
}

function boolQuery(q, key) {
  const v = q.get(key);
  return v === '1' || v === 'true';
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export async function handleRequest(method, path, { body, token } = {}) {
  const authHeader = token ? `Bearer ${token}` : null;
  const store = getStore();
  const { segments, query } = parsePath(path);
  const now = new Date().toISOString();

  // --- auth ---
  if (segments[0] === 'auth') {
    if (method === 'POST' && segments[1] === 'login') {
      const email = body?.email?.trim().toLowerCase();
      const password = body?.password;
      if (!email || !password) err(400, 'Email and password required');
      const user = store.users.find((u) => u.email === email);
      if (!user || user.password !== password) err(401, 'Invalid credentials');
      return {
        token: `mock:${user.id}`,
        user: { id: user.id, email: user.email, name: user.name },
      };
    }
    if (method === 'GET' && segments[1] === 'me') {
      const user = requireAuth(authHeader);
      return { id: user.id, email: user.email, name: user.name, created_at: user.created_at };
    }
  }

  // --- home ---
  if (method === 'GET' && segments[0] === 'home' && segments.length === 1) {
    const featuredPortfolio = store.portfolioItems
      .filter((p) => p.published && p.is_featured)
      .map((p) => portfolioWithCategory(store, p))
      .sort((a, b) => b.featured_order - a.featured_order || b.created_at.localeCompare(a.created_at))
      .slice(0, 12);
    const featuredTestimonials = store.testimonials
      .filter((t) => t.published && t.is_featured)
      .map((t) => ({ ...t, published: !!t.published, is_featured: !!t.is_featured }))
      .sort((a, b) => a.sort_order - b.sort_order)
      .slice(0, 8);
    const servicesPreview = store.services
      .filter((s) => s.published)
      .sort((a, b) => a.sort_order - b.sort_order)
      .slice(0, 6)
      .map((s) => ({
        id: s.id,
        title: s.title,
        slug: s.slug,
        summary: s.summary,
        price_hint: s.price_hint,
        image_path: s.image_path,
      }));
    return { settings: publicSettings(store), featuredPortfolio, featuredTestimonials, servicesPreview };
  }

  // --- settings ---
  if (segments[0] === 'settings') {
    if (method === 'GET' && segments[1] === 'public') return publicSettings(store);
    if (method === 'GET' && segments.length === 1) {
      requireAuth(authHeader);
      return { ...store.settings };
    }
    if (method === 'PUT' && segments.length === 1) {
      requireAuth(authHeader);
      if (!body || typeof body !== 'object' || Array.isArray(body)) {
        err(400, 'Expected JSON object of key/value settings');
      }
      Object.assign(store.settings, body);
      save();
      return { ...store.settings };
    }
  }

  // --- uploads ---
  if (method === 'POST' && segments[0] === 'uploads') {
    requireAuth(authHeader);
    const file = body instanceof FormData ? body.get('file') : null;
    if (!file || typeof file === 'string') err(400, 'No file');
    const dataUrl = await fileToDataUrl(file);
    return { path: dataUrl, filename: file.name };
  }

  // --- categories ---
  if (segments[0] === 'categories') {
    if (method === 'GET' && segments.length === 1) {
      return store.categories
        .map((c) => ({
          ...c,
          portfolio_count: store.portfolioItems.filter((p) => p.category_id === c.id && p.published).length,
        }))
        .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));
    }
    if (method === 'POST' && segments.length === 1) {
      requireAuth(authHeader);
      const { name, description, sort_order } = body || {};
      if (!name?.trim()) err(400, 'Name is required');
      const slug = uniqueSlug(slugify(name), (s) => store.categories.some((c) => c.slug === s));
      const row = {
        id: nextId(store, 'category'),
        name: name.trim(),
        slug,
        description: description?.trim() || null,
        sort_order: Number(sort_order) || 0,
        created_at: now,
      };
      store.categories.push(row);
      save();
      return row;
    }
    if (segments.length === 2) {
      const id = Number(segments[1]);
      const existing = store.categories.find((c) => c.id === id);
      if (!existing) err(404, 'Category not found');
      if (method === 'PUT') {
        requireAuth(authHeader);
        const { name, description, sort_order, slug: bodySlug } = body || {};
        let slug = existing.slug;
        if (bodySlug?.trim()) {
          const want = slugify(bodySlug);
          slug = uniqueSlug(want, (s) => store.categories.some((c) => c.slug === s && c.id !== id));
        } else if (name?.trim() && name.trim() !== existing.name) {
          slug = uniqueSlug(slugify(name), (s) => store.categories.some((c) => c.slug === s && c.id !== id));
        }
        Object.assign(existing, {
          name: name?.trim() ?? existing.name,
          slug,
          description: description !== undefined ? description?.trim() || null : existing.description,
          sort_order: sort_order !== undefined ? Number(sort_order) || 0 : existing.sort_order,
        });
        save();
        return existing;
      }
      if (method === 'DELETE') {
        requireAuth(authHeader);
        store.categories = store.categories.filter((c) => c.id !== id);
        save();
        return null;
      }
    }
  }

  // --- portfolio ---
  if (segments[0] === 'portfolio') {
    if (segments[1] === 'slug' && segments[2] && method === 'GET') {
      const row = store.portfolioItems.find((p) => p.slug === segments[2] && p.published);
      if (!row) err(404, 'Not found');
      return rowToPublic(store, row);
    }
    if (segments[1] === 'images' && segments[2] && method === 'DELETE') {
      requireAuth(authHeader);
      const imageId = Number(segments[2]);
      const before = store.portfolioImages.length;
      store.portfolioImages = store.portfolioImages.filter((img) => img.id !== imageId);
      if (store.portfolioImages.length === before) err(404, 'Image not found');
      save();
      return null;
    }
    if (segments.length === 3 && segments[2] === 'images' && method === 'POST') {
      requireAuth(authHeader);
      const id = Number(segments[1]);
      if (!store.portfolioItems.some((p) => p.id === id)) err(404, 'Portfolio item not found');
      const { image_path, caption, sort_order } = body || {};
      if (!image_path) err(400, 'image_path is required');
      const maxSort = Math.max(-1, ...galleryFor(store, id).map((i) => i.sort_order)) + 1;
      const img = {
        id: nextId(store, 'portfolioImage'),
        portfolio_item_id: id,
        image_path,
        caption: caption?.trim() || null,
        sort_order: sort_order !== undefined ? Number(sort_order) : maxSort,
      };
      store.portfolioImages.push(img);
      save();
      return img;
    }
    if (segments.length === 1 && method === 'GET') {
      const admin = boolQuery(query, 'admin');
      const category = query.get('category');
      let rows = store.portfolioItems;
      if (!admin) rows = rows.filter((p) => p.published);
      if (category) {
        rows = rows.filter((p) => {
          const cat = findCategory(store, p.category_id);
          return cat?.slug === category;
        });
      }
      if (boolQuery(query, 'featured')) rows = rows.filter((p) => p.is_featured);
      return rows
        .map((p) => portfolioWithCategory(store, p))
        .sort((a, b) => b.featured_order - a.featured_order || b.created_at.localeCompare(a.created_at));
    }
    if (segments.length === 1 && method === 'POST') {
      requireAuth(authHeader);
      const { category_id, title, excerpt, description, cover_image, is_featured, featured_order, published } =
        body || {};
      if (!category_id || !title?.trim()) err(400, 'category_id and title are required');
      if (!findCategory(store, Number(category_id))) err(400, 'Invalid category');
      const slug = uniqueSlug(slugify(title), (s) => store.portfolioItems.some((p) => p.slug === s));
      const row = {
        id: nextId(store, 'portfolio'),
        category_id: Number(category_id),
        title: title.trim(),
        slug,
        excerpt: excerpt?.trim() || null,
        description: description?.trim() || null,
        cover_image: cover_image || null,
        is_featured: is_featured ? 1 : 0,
        featured_order: Number(featured_order) || 0,
        published: published !== false ? 1 : 0,
        created_at: now,
        updated_at: now,
      };
      store.portfolioItems.push(row);
      save();
      return rowToPublic(store, row);
    }
    if (segments.length === 2) {
      const id = Number(segments[1]);
      const existing = store.portfolioItems.find((p) => p.id === id);
      if (!existing) err(404, 'Not found');
      if (method === 'GET') {
        requireAuth(authHeader);
        return rowToPublic(store, existing);
      }
      if (method === 'PUT') {
        requireAuth(authHeader);
        const {
          category_id,
          title,
          excerpt,
          description,
          cover_image,
          is_featured,
          featured_order,
          published,
          slug: bodySlug,
        } = body || {};
        let slug = existing.slug;
        if (bodySlug?.trim()) {
          slug = uniqueSlug(slugify(bodySlug), (s) => store.portfolioItems.some((p) => p.slug === s && p.id !== id));
        } else if (title?.trim() && title.trim() !== existing.title) {
          slug = uniqueSlug(slugify(title), (s) => store.portfolioItems.some((p) => p.slug === s && p.id !== id));
        }
        const catId = category_id != null ? Number(category_id) : existing.category_id;
        if (category_id != null && !findCategory(store, catId)) err(400, 'Invalid category');
        Object.assign(existing, {
          category_id: catId,
          title: title?.trim() ?? existing.title,
          slug,
          excerpt: excerpt !== undefined ? excerpt?.trim() || null : existing.excerpt,
          description: description !== undefined ? description?.trim() || null : existing.description,
          cover_image: cover_image !== undefined ? cover_image || null : existing.cover_image,
          is_featured: is_featured !== undefined ? (is_featured ? 1 : 0) : existing.is_featured,
          featured_order: featured_order !== undefined ? Number(featured_order) || 0 : existing.featured_order,
          published: published !== undefined ? (published ? 1 : 0) : existing.published,
          updated_at: now,
        });
        save();
        return rowToPublic(store, existing);
      }
      if (method === 'DELETE') {
        requireAuth(authHeader);
        store.portfolioItems = store.portfolioItems.filter((p) => p.id !== id);
        store.portfolioImages = store.portfolioImages.filter((img) => img.portfolio_item_id !== id);
        save();
        return null;
      }
    }
  }

  // --- services ---
  if (segments[0] === 'services') {
    if (segments[1] === 'slug' && segments[2] && method === 'GET') {
      const row = store.services.find((s) => s.slug === segments[2] && s.published);
      if (!row) err(404, 'Not found');
      return { ...row, published: !!row.published };
    }
    if (segments.length === 1 && method === 'GET') {
      const admin = boolQuery(query, 'admin');
      let rows = store.services;
      if (!admin) rows = rows.filter((s) => s.published);
      return rows
        .map((r) => ({ ...r, published: !!r.published }))
        .sort((a, b) => a.sort_order - b.sort_order || a.title.localeCompare(b.title));
    }
    if (segments.length === 1 && method === 'POST') {
      requireAuth(authHeader);
      const { title, summary, description, price_hint, image_path, sort_order, published } = body || {};
      if (!title?.trim()) err(400, 'Title is required');
      const slug = uniqueSlug(slugify(title), (s) => store.services.some((x) => x.slug === s));
      const row = {
        id: nextId(store, 'service'),
        title: title.trim(),
        slug,
        summary: summary?.trim() || null,
        description: description?.trim() || null,
        price_hint: price_hint?.trim() || null,
        image_path: image_path || null,
        sort_order: Number(sort_order) || 0,
        published: published !== false ? 1 : 0,
        created_at: now,
        updated_at: now,
      };
      store.services.push(row);
      save();
      return { ...row, published: !!row.published };
    }
    if (segments.length === 2) {
      const id = Number(segments[1]);
      const existing = store.services.find((s) => s.id === id);
      if (!existing) err(404, 'Not found');
      if (method === 'PUT') {
        requireAuth(authHeader);
        const { title, summary, description, price_hint, image_path, sort_order, published, slug: bodySlug } =
          body || {};
        let slug = existing.slug;
        if (bodySlug?.trim()) {
          slug = uniqueSlug(slugify(bodySlug), (s) => store.services.some((x) => x.slug === s && x.id !== id));
        } else if (title?.trim() && title.trim() !== existing.title) {
          slug = uniqueSlug(slugify(title), (s) => store.services.some((x) => x.slug === s && x.id !== id));
        }
        Object.assign(existing, {
          title: title?.trim() ?? existing.title,
          slug,
          summary: summary !== undefined ? summary?.trim() || null : existing.summary,
          description: description !== undefined ? description?.trim() || null : existing.description,
          price_hint: price_hint !== undefined ? price_hint?.trim() || null : existing.price_hint,
          image_path: image_path !== undefined ? image_path || null : existing.image_path,
          sort_order: sort_order !== undefined ? Number(sort_order) || 0 : existing.sort_order,
          published: published !== undefined ? (published ? 1 : 0) : existing.published,
          updated_at: now,
        });
        save();
        return { ...existing, published: !!existing.published };
      }
      if (method === 'DELETE') {
        requireAuth(authHeader);
        store.services = store.services.filter((s) => s.id !== id);
        save();
        return null;
      }
    }
  }

  // --- testimonials ---
  if (segments[0] === 'testimonials') {
    if (segments.length === 1 && method === 'GET') {
      const admin = boolQuery(query, 'admin');
      const featured = boolQuery(query, 'featured');
      let rows = store.testimonials;
      if (!admin) rows = rows.filter((t) => t.published);
      if (featured) rows = rows.filter((t) => t.is_featured);
      return rows
        .map((r) => ({ ...r, published: !!r.published, is_featured: !!r.is_featured }))
        .sort((a, b) => a.sort_order - b.sort_order);
    }
    if (segments.length === 1 && method === 'POST') {
      requireAuth(authHeader);
      const { client_name, quote, role_or_event, image_path, rating, is_featured, sort_order, published } =
        body || {};
      if (!client_name?.trim() || !quote?.trim()) err(400, 'client_name and quote are required');
      const row = {
        id: nextId(store, 'testimonial'),
        client_name: client_name.trim(),
        quote: quote.trim(),
        role_or_event: role_or_event?.trim() || null,
        image_path: image_path || null,
        rating: Math.min(5, Math.max(1, Number(rating) || 5)),
        is_featured: is_featured ? 1 : 0,
        sort_order: Number(sort_order) || 0,
        published: published !== false ? 1 : 0,
        created_at: now,
      };
      store.testimonials.push(row);
      save();
      return { ...row, published: !!row.published, is_featured: !!row.is_featured };
    }
    if (segments.length === 2) {
      const id = Number(segments[1]);
      const existing = store.testimonials.find((t) => t.id === id);
      if (!existing) err(404, 'Not found');
      if (method === 'PUT') {
        requireAuth(authHeader);
        const { client_name, quote, role_or_event, image_path, rating, is_featured, sort_order, published } =
          body || {};
        Object.assign(existing, {
          client_name: client_name?.trim() ?? existing.client_name,
          quote: quote?.trim() ?? existing.quote,
          role_or_event: role_or_event !== undefined ? role_or_event?.trim() || null : existing.role_or_event,
          image_path: image_path !== undefined ? image_path || null : existing.image_path,
          rating: rating !== undefined ? Math.min(5, Math.max(1, Number(rating) || 5)) : existing.rating,
          is_featured: is_featured !== undefined ? (is_featured ? 1 : 0) : existing.is_featured,
          sort_order: sort_order !== undefined ? Number(sort_order) || 0 : existing.sort_order,
          published: published !== undefined ? (published ? 1 : 0) : existing.published,
        });
        save();
        return { ...existing, published: !!existing.published, is_featured: !!existing.is_featured };
      }
      if (method === 'DELETE') {
        requireAuth(authHeader);
        store.testimonials = store.testimonials.filter((t) => t.id !== id);
        save();
        return null;
      }
    }
  }

  // --- inquiries ---
  if (segments[0] === 'inquiries') {
    if (segments.length === 1 && method === 'POST') {
      const { name, email, phone, service_interest, event_date, message } = body || {};
      if (!name?.trim() || !email?.trim() || !message?.trim()) {
        err(400, 'Name, email, and message are required');
      }
      const id = nextId(store, 'inquiry');
      store.inquiries.unshift({
        id,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || null,
        service_interest: service_interest?.trim() || null,
        event_date: event_date?.trim() || null,
        message: message.trim(),
        status: 'new',
        created_at: now,
      });
      save();
      return { id, message: 'Thank you — we will be in touch soon.' };
    }
    if (segments.length === 1 && method === 'GET') {
      requireAuth(authHeader);
      const status = query.get('status');
      let rows = store.inquiries;
      if (status) rows = rows.filter((i) => i.status === status);
      return rows.sort((a, b) => b.created_at.localeCompare(a.created_at));
    }
    if (segments.length === 2) {
      const id = Number(segments[1]);
      const existing = store.inquiries.find((i) => i.id === id);
      if (!existing) err(404, 'Not found');
      if (method === 'PATCH') {
        requireAuth(authHeader);
        const { status } = body || {};
        const allowed = ['new', 'read', 'replied', 'archived'];
        if (status && !allowed.includes(status)) err(400, 'Invalid status');
        if (status) existing.status = status;
        save();
        return existing;
      }
      if (method === 'DELETE') {
        requireAuth(authHeader);
        store.inquiries = store.inquiries.filter((i) => i.id !== id);
        save();
        return null;
      }
    }
  }

  err(404, 'Not found');
}
