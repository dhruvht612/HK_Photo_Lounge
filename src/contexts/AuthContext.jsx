import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client.js';
import { isSupabaseConfigured } from '../supabase/client.js';
import * as supabaseAuth from '../supabase/auth.js';

const AuthContext = createContext(null);
const STORAGE_KEY = 'hkpl_token';

const useSupabase =
  import.meta.env.VITE_USE_SUPABASE === 'true' && isSupabaseConfigured;

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() =>
    useSupabase ? null : localStorage.getItem(STORAGE_KEY)
  );
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(useSupabase);

  const login = useCallback(
    async (email, password) => {
      if (useSupabase) {
        const { data, error } = await supabaseAuth.signIn(email, password);
        if (error) throw error instanceof Error ? error : new Error(error.message || 'Login failed');
        if (data.user?.role !== 'admin') {
          await supabaseAuth.signOut();
          throw new Error('This account is not an admin. Use the client portal to sign in.');
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
    if (!useSupabase) {
      throw new Error('Password reset requires VITE_USE_SUPABASE=true');
    }
    const { error } = await supabaseAuth.resetPassword(email);
    if (error) throw error;
  }, []);

  const logout = useCallback(async () => {
    if (useSupabase) {
      await supabaseAuth.signOut();
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
    setToken(null);
    setUser(null);
  }, []);

  const refreshMe = useCallback(async () => {
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
  }, [token, logout]);

  useEffect(() => {
    if (!useSupabase) {
      setLoading(false);
      return;
    }
    let mounted = true;
    supabaseAuth.getSessionUser().then((profile) => {
      if (!mounted) return;
      if (profile) {
        setUser(profile);
        setToken('supabase');
      }
    }).finally(() => {
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
  }, [useSupabase]);

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated: useSupabase ? !!user : !!token,
      loading,
      useSupabase,
      login,
      register,
      resetPassword,
      logout,
      refreshMe,
    }),
    [token, user, loading, login, register, resetPassword, logout, refreshMe]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
