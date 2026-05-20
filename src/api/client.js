import { handleRequest } from './mockServer.js';

async function request(path, options = {}) {
  const { token, method = 'GET', body } = options;
  let parsedBody = body;
  if (body && typeof body === 'string') {
    try {
      parsedBody = JSON.parse(body);
    } catch {
      parsedBody = body;
    }
  }
  try {
    const data = await handleRequest(method, path, { body: parsedBody, token });
    return data;
  } catch (e) {
    if (e.status) throw e;
    throw e;
  }
}

export const api = {
  get: (path, opts) => request(path, { ...opts, method: 'GET' }),
  post: (path, body, opts) => request(path, { ...opts, method: 'POST', body }),
  put: (path, body, opts) => request(path, { ...opts, method: 'PUT', body }),
  patch: (path, body, opts) => request(path, { ...opts, method: 'PATCH', body }),
  delete: (path, opts) => request(path, { ...opts, method: 'DELETE' }),
  upload: (file, opts = {}) => {
    const fd = new FormData();
    fd.append('file', file);
    return request('/api/uploads', { ...opts, method: 'POST', body: fd });
  },
};
