import { supabase } from './client.js';

const REQUEST_TIMEOUT_MS = 20000;

function withTimeout(promise, label = 'Request') {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out`)), REQUEST_TIMEOUT_MS)
    ),
  ]);
}

function mapProfileRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    phone: row.phone,
    avatar_url: row.avatar_url,
    role: row.role,
    created_at: row.created_at,
  };
}

export async function fetchProfileById(userId) {
  if (!supabase) return null;
  const { data, error } = await withTimeout(
    supabase
      .from('profiles')
      .select('id, email, name, phone, avatar_url, role, created_at')
      .eq('id', userId)
      .maybeSingle(),
    'Load profile'
  );
  if (error) throw error;
  return mapProfileRow(data);
}

export async function ensureClerkProfile(clerkUser) {
  if (!supabase) return null;
  const id = clerkUser.id;
  const email =
    clerkUser.primaryEmailAddress?.emailAddress?.trim().toLowerCase() ?? '';
  const name = clerkUser.fullName?.trim() || clerkUser.firstName?.trim() || null;
  const phone = clerkUser.primaryPhoneNumber?.phoneNumber?.trim() || null;
  const role =
    clerkUser.publicMetadata?.role === 'admin' ? 'admin' : 'client';

  const existing = await fetchProfileById(id);
  if (existing) return existing;

  const { data: rpcRow, error: rpcError } = await withTimeout(
    supabase.rpc('ensure_my_profile', { p_role: role }),
    'Create profile'
  );
  if (!rpcError && rpcRow) {
    const parsed = typeof rpcRow === 'string' ? JSON.parse(rpcRow) : rpcRow;
    const user = mapProfileRow(parsed);
    if (user) return user;
  }

  const { error: insertError } = await withTimeout(
    supabase.from('profiles').insert({
      id,
      email,
      name,
      phone,
      role,
    }),
    'Create profile'
  );
  if (insertError) throw insertError;

  return fetchProfileById(id);
}

export async function resolveClerkProfile(clerkUser) {
  try {
    return await ensureClerkProfile(clerkUser);
  } catch {
    return {
      id: clerkUser.id,
      email: clerkUser.primaryEmailAddress?.emailAddress ?? '',
      name: clerkUser.fullName ?? clerkUser.firstName ?? null,
      phone: clerkUser.primaryPhoneNumber?.phoneNumber ?? null,
      avatar_url: clerkUser.imageUrl ?? null,
      role: 'client',
      created_at: null,
    };
  }
}
