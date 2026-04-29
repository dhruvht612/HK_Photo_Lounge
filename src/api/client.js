const base = import.meta.env.VITE_API_URL || '';

async function request(path, options = {}) {
  const headers = { ...options.headers };
  if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }
  const { token, ...rest } = options;
  const res = await fetch(`${base}${path}`, {
    ...rest,
    headers,
  });
  if (res.status === 204) return null;
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const err = new Error(data?.error || res.statusText);
    err.status = res.status;
    err.body = data;
    throw err;
  }
  return data;
}

export const api = {
  get: (path, opts) => request(path, { ...opts, method: 'GET' }),
  post: (path, body, opts) =>
    request(path, {
      ...opts,
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
  put: (path, body, opts) =>
    request(path, { ...opts, method: 'PUT', body: JSON.stringify(body) }),
  patch: (path, body, opts) =>
    request(path, { ...opts, method: 'PATCH', body: JSON.stringify(body) }),
  delete: (path, opts) => request(path, { ...opts, method: 'DELETE' }),
};
