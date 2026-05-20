import { supabaseAuth } from './client.js';

const REQUEST_TIMEOUT_MS = 20000;
let activeSignIn = 0;

function assertClient() {
  if (!supabaseAuth) throw new Error('Supabase is not configured');
}

function withTimeout(promise, label = 'Request') {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out. Check Supabase connection and run migration 005.`)), REQUEST_TIMEOUT_MS)
    ),
  ]);
}

function normalizeEmail(email) {
  return email?.trim().toLowerCase() ?? '';
}

export async function signIn(email, password, { role = 'client' } = {}) {
  assertClient();
  const signInId = ++activeSignIn;
  try {
    const normalizedEmail = normalizeEmail(email);
    const { data, error } = await withTimeout(
      supabaseAuth.auth.signInWithPassword({ email: normalizedEmail, password }),
      'Sign in'
    );
    if (error) return { error };
    if (!data.session?.user?.id) {
      return {
        error: new Error(
          'Sign-in succeeded but no session was returned. Confirm your email in Supabase Auth or disable email confirmation for development.'
        ),
      };
    }
    try {
      const user = await resolveUserProfile(data.session.user, role);
      if (!user) {
        return { error: new Error('Could not load your profile. Run migrations 005 and 007 in Supabase SQL Editor.') };
      }
      return { data: { session: data.session, user } };
    } catch (err) {
      return { error: err };
    }
  } finally {
    if (activeSignIn === signInId) activeSignIn = 0;
  }
}

async function resolveUserProfile(authUser, role) {
  let user = await fetchProfile(authUser.id);
  if (!user) {
    user = await ensureProfile(authUser, { role });
  }
  return user;
}

async function ensureProfile(authUser, { role }) {
  const existing = await fetchProfile(authUser.id);
  if (existing) return existing;

  const { data: rpcRow, error: rpcError } = await withTimeout(
    supabaseAuth.rpc('ensure_my_profile', { p_role: role }),
    'Create profile'
  );

  if (!rpcError && rpcRow) {
    const user = mapProfileRow(parseRpcProfileRow(rpcRow));
    if (user) return user;
  }

  if (rpcError && !rpcError.message?.includes('Could not find the function')) {
    console.warn('ensure_my_profile:', rpcError.message);
  }

  const { error: insertError } = await withTimeout(
    supabaseAuth.from('profiles').insert({
      id: authUser.id,
      email: authUser.email ?? '',
      name: authUser.user_metadata?.name?.trim() || null,
      phone: authUser.user_metadata?.phone?.trim() || null,
      role,
    }),
    'Create profile'
  );
  if (insertError) throw insertError;

  linkInquiriesToClient();

  return fetchProfile(authUser.id);
}

function parseRpcProfileRow(rpcRow) {
  if (!rpcRow) return null;
  if (typeof rpcRow === 'string') {
    try {
      return JSON.parse(rpcRow);
    } catch {
      return null;
    }
  }
  return rpcRow;
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

export async function signUp(email, password, { name, phone } = {}) {
  assertClient();
  const normalizedEmail = normalizeEmail(email);
  const { data: authData, error: authError } = await withTimeout(
    supabaseAuth.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: {
          name: name?.trim() || '',
          phone: phone?.trim() || '',
          role: 'client',
        },
        emailRedirectTo: `${window.location.origin}/portal/login`,
      },
    }),
    'Sign up'
  );
  if (authError) {
    const msg = authError.message || 'Sign up failed';
    const lower = msg.toLowerCase();
    if (lower.includes('already registered')) {
      return { error: new Error('This email is already registered. Try signing in instead.') };
    }
    if (lower.includes('rate limit')) {
      return {
        error: new Error(
          'Too many sign-up or confirmation emails were sent. Wait about an hour, use Sign in if you already registered, or create the user in Supabase → Authentication → Users. For development, raise rate limits under Authentication → Rate Limits.'
        ),
      };
    }
    if (
      lower.includes('password') &&
      (lower.includes('weak') || lower.includes('leaked') || lower.includes('character') || lower.includes('requirements'))
    ) {
      return {
        error: new Error(
          'Password rejected by Supabase. Use at least 8 characters with uppercase, lowercase, a number, and a symbol (e.g. PhotoLounge1!). Or relax rules under Authentication → Providers → Email.'
        ),
      };
    }
    return { error: authError };
  }
  if (!authData.user) return { error: new Error('Sign up failed') };

  if (!authData.session) {
    return {
      data: {
        user: null,
        session: null,
        needsEmailConfirmation: true,
      },
    };
  }

  try {
    const user = await resolveUserProfile(authData.user, 'client');
    if (!user) {
      return { error: new Error('Account created but profile could not be loaded.') };
    }
    linkInquiriesToClient();
    return { data: { user, session: authData.session, needsEmailConfirmation: false } };
  } catch (err) {
    return { error: err };
  }
}

export function linkInquiriesToClient() {
  assertClient();
  withTimeout(supabaseAuth.rpc('link_inquiries_to_client'), 'Link inquiries').catch((err) => {
    console.warn('link_inquiries_to_client:', err.message);
  });
}

export async function resetPassword(email) {
  assertClient();
  const { error } = await supabaseAuth.auth.resetPasswordForEmail(normalizeEmail(email), {
    redirectTo: `${window.location.origin}/portal/login`,
  });
  return { error };
}

export async function signOut() {
  assertClient();
  const { error } = await withTimeout(supabaseAuth.auth.signOut(), 'Sign out');
  return { error };
}

async function fetchProfile(userId) {
  const { data: profile, error } = await withTimeout(
    supabaseAuth
      .from('profiles')
      .select('id, email, name, phone, avatar_url, role, created_at')
      .eq('id', userId)
      .maybeSingle(),
    'Load profile'
  );
  if (error) {
    const msg = error.message || 'Failed to load profile';
    if (msg.includes('infinite recursion')) {
      throw new Error(
        'Database policy error: run supabase/migrations/005_fix_profiles_rls_recursion.sql in the Supabase SQL Editor, then try again.'
      );
    }
    throw new Error(msg);
  }
  if (!profile) return null;
  return mapProfileRow(profile);
}

export async function getSessionUser() {
  assertClient();
  const {
    data: { session },
  } = await supabaseAuth.auth.getSession();
  if (!session?.user) return null;
  try {
    const role = session.user.user_metadata?.role === 'admin' ? 'admin' : 'client';
    const profile = await resolveUserProfile(session.user, role);
    if (!profile) return null;
    return { ...profile, session };
  } catch {
    return null;
  }
}

export function onAuthStateChange(callback) {
  assertClient();
  const { data } = supabaseAuth.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_OUT' || !session?.user) {
      callback(null);
      return;
    }

    if (activeSignIn > 0) return;

    if (event === 'TOKEN_REFRESHED') {
      try {
        const profile = await fetchProfile(session.user.id);
        if (profile) callback(profile);
      } catch {
        /* keep existing user in context */
      }
      return;
    }

    try {
      const role = session.user.user_metadata?.role === 'admin' ? 'admin' : 'client';
      const profile = await resolveUserProfile(session.user, role);
      callback(profile);
    } catch {
      callback(null);
    }
  });
  return data.subscription;
}

export { getSessionUser as getCurrentUser };
