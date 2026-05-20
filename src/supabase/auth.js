import { supabase } from './client.js';

function assertClient() {
  if (!supabase) throw new Error('Supabase is not configured');
}

export async function signIn(email, password) {
  assertClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error };
  if (!data.session?.user?.id) {
    return {
      error: new Error(
        'Sign-in succeeded but no session was returned. Confirm your email in Supabase Auth or disable email confirmation for development.'
      ),
    };
  }
  try {
    const user = await fetchProfile(data.session.user.id);
    if (!user) {
      return {
        error: new Error(
          'No profile found for this account. Your login worked, but the profiles table has no row for this user. Run the fix SQL in supabase/README.md (section “Missing profile”), or register again after migration 006.'
        ),
      };
    }
    return { data: { session: data.session, user } };
  } catch (err) {
    return { error: err };
  }
}

export async function signUp(email, password, { name, phone } = {}) {
  assertClient();
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: name?.trim() || '',
        phone: phone?.trim() || '',
        role: 'client',
      },
      emailRedirectTo: `${window.location.origin}/portal/login`,
    },
  });
  if (authError) {
    const msg = authError.message || 'Sign up failed';
    if (msg.toLowerCase().includes('already registered')) {
      return { error: new Error('This email is already registered. Try signing in instead.') };
    }
    return { error: authError };
  }
  if (!authData.user) return { error: new Error('Sign up failed') };

  // No session when "Confirm email" is enabled in Supabase — profile is created by DB trigger
  if (!authData.session) {
    return {
      data: {
        user: null,
        session: null,
        needsEmailConfirmation: true,
      },
    };
  }

  // Session present: ensure profile exists (trigger may have created it)
  const { error: profileError } = await supabase.from('profiles').upsert(
    {
      id: authData.user.id,
      email,
      name: name?.trim() || null,
      phone: phone?.trim() || null,
      role: 'client',
    },
    { onConflict: 'id' }
  );
  if (profileError) return { error: profileError };

  await linkInquiriesToClient();

  const user = await fetchProfile(authData.user.id);
  if (!user) {
    return {
      error: new Error(
        'Account created but profile could not be loaded. Run supabase/migrations/006_profile_on_signup_trigger.sql, then sign in.'
      ),
    };
  }
  return { data: { user, session: authData.session, needsEmailConfirmation: false } };
}

export async function linkInquiriesToClient() {
  assertClient();
  const { error } = await supabase.rpc('link_inquiries_to_client');
  if (error) console.warn('link_inquiries_to_client:', error.message);
}

export async function resetPassword(email) {
  assertClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/portal/login`,
  });
  return { error };
}

export async function signOut() {
  assertClient();
  const { error } = await supabase.auth.signOut();
  return { error };
}

async function fetchProfile(userId) {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, email, name, phone, avatar_url, role, created_at')
    .eq('id', userId)
    .maybeSingle();
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
  return {
    id: profile.id,
    email: profile.email,
    name: profile.name,
    phone: profile.phone,
    avatar_url: profile.avatar_url,
    role: profile.role,
    created_at: profile.created_at,
  };
}

export async function getSessionUser() {
  assertClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) return null;
  try {
    const profile = await fetchProfile(session.user.id);
    return { ...profile, session };
  } catch {
    return null;
  }
}

export function onAuthStateChange(callback) {
  assertClient();
  const { data } = supabase.auth.onAuthStateChange(async (_event, session) => {
    if (!session?.user) {
      callback(null);
      return;
    }
    try {
      const profile = await fetchProfile(session.user.id);
      callback(profile);
    } catch {
      callback(null);
    }
  });
  return data.subscription;
}

export { getSessionUser as getCurrentUser };
