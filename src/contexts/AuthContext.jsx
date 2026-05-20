import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../api/client.js';
import { isClerkEnabled } from '../clerk/config.js';
import { ClerkAuthSync } from '../clerk/ClerkAuthSync.jsx';
import { isSupabaseConfigured } from '../supabase/client.js';
import * as supabaseAuth from '../supabase/auth.js';

const AuthContext = createContext(null);
const STORAGE_KEY = 'hkpl_token';

const useSupabase =
  import.meta.env.VITE_USE_SUPABASE === 'true' && isSupabaseConfigured;

const useClerkWithSupabase = isClerkEnabled && useSupabase;

export function AuthProvider({ children }) {
  const clerkSignOutRef = useRef(null);
  const [token, setToken] = useState(() =>
    useSupabase && !useClerkWithSupabase ? null : localStorage.getItem(STORAGE_KEY)
  );
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(useSupabase);

  const login = useCallback(
    async (email, password, { role = 'client' } = {}) => {
      if (useClerkWithSupabase && role === 'client') {
        throw new Error('Use Sign in on the site header or /portal/login for client access.');
      }
      if (useSupabase) {
        const { data, error } = await supabaseAuth.signIn(email, password, { role });
        if (error) throw error instanceof Error ? error : new Error(error.message || 'Login failed');
        if (role === 'admin' && data.user?.role !== 'admin') {
          await supabaseAuth.signOut();
          throw new Error('This account is not an admin. Use the client portal to sign in.');
        }
        if (role === 'client' && data.user?.role === 'admin') {
          try {
            await supabaseAuth.signOut();
          } catch {
            /* ignore */
          }
          throw new Error('This account is an admin. Use Admin sign in from the site footer.');
        }
        setUser(data.user);
        setToken(data.session?.access_token ?? 'supabase');
        return { user: data.user, token: data.session?.access_token };
      }
      const data = await api.post('/api/auth/login', { email, password });
      localStorage.setItem(STORAGE_KEY, data.token);
      setToken(data.token);
      setUser(data.user);
      return data;
    },
    []
  );

  const register = useCallback(
    async (email, password, profile = {}) => {
      if (useClerkWithSupabase) {
        throw new Error('Use Sign up on the site header or /portal/register.');
      }
      if (!useSupabase) {
        throw new Error('Registration requires VITE_USE_SUPABASE=true');
      }
      const { data, error } = await supabaseAuth.signUp(email, password, profile);
      if (error) throw error instanceof Error ? error : new Error(error.message || 'Registration failed');
      if (data.needsEmailConfirmation) {
        return data;
      }
      setUser(data.user);
      setToken(data.session?.access_token ?? 'supabase');
      return data;
    },
    []
  );

  const resetPassword = useCallback(async (email) => {
    if (useClerkWithSupabase) {
      throw new Error('Use the forgot-password link on the Clerk sign-in screen.');
    }
    if (!useSupabase) {
      throw new Error('Password reset requires VITE_USE_SUPABASE=true');
    }
    const { error } = await supabaseAuth.resetPassword(email);
    if (error) throw error;
  }, []);

  const logout = useCallback(async () => {
    if (useClerkWithSupabase && clerkSignOutRef.current) {
      await clerkSignOutRef.current();
    } else if (useSupabase) {
      await supabaseAuth.signOut();
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
    setToken(null);
    setUser(null);
  }, []);

  const refreshMe = useCallback(async () => {
    if (useClerkWithSupabase) {
      return user;
    }
    if (useSupabase) {
      const profile = await supabaseAuth.getSessionUser();
      if (!profile) {
        setUser(null);
        setToken(null);
        return null;
      }
      setUser(profile);
      setToken('supabase');
      return profile;
    }
    if (!token) {
      setUser(null);
      return null;
    }
    try {
      const me = await api.get('/api/auth/me', { token });
      setUser(me);
      return me;
    } catch {
      await logout();
      return null;
    }
  }, [token, logout, user, useClerkWithSupabase]);

  useEffect(() => {
    if (!useSupabase || useClerkWithSupabase) {
      if (!useClerkWithSupabase) setLoading(false);
      return;
    }
    let mounted = true;
    supabaseAuth
      .getSessionUser()
      .then((profile) => {
        if (!mounted) return;
        if (profile) {
          setUser(profile);
          setToken('supabase');
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    const subscription = supabaseAuth.onAuthStateChange((profile) => {
      if (!mounted) return;
      if (profile) {
        setUser(profile);
        setToken('supabase');
      } else {
        setUser(null);
        setToken(null);
      }
    });
    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [useSupabase, useClerkWithSupabase]);

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated: useSupabase ? !!user : !!token,
      loading,
      useSupabase,
      useClerk: useClerkWithSupabase,
      login,
      register,
      resetPassword,
      logout,
      refreshMe,
    }),
    [token, user, loading, login, register, resetPassword, logout, refreshMe]
  );

  return (
    <AuthContext.Provider value={value}>
      {useClerkWithSupabase && (
        <ClerkAuthSync
          setUser={setUser}
          setToken={setToken}
          setLoading={setLoading}
          clerkSignOutRef={clerkSignOutRef}
        />
      )}
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
