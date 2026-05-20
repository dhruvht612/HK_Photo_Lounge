import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { PortalSupabaseGate } from '../../components/PortalSupabaseGate.jsx';

export function PortalLogin() {
  const { login, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/portal/dashboard';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user?.role === 'client') {
      navigate('/portal/dashboard', { replace: true });
    }
    if (!authLoading && user?.role === 'admin') {
      navigate('/admin', { replace: true });
    }
  }, [user, authLoading, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setErr(null);
    if (password.length < 6) {
      setErr('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (ex) {
      setErr(ex.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  }

  return (
    <PortalSupabaseGate>
      <div className="flex min-h-screen flex-col items-center justify-center bg-ink-950 px-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md rounded-2xl border border-white/10 bg-ink-900/60 p-8"
        >
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-sm text-sand-200/60 transition hover:text-sand-100"
          >
            ← Back to site
          </Link>
          <p className="mt-4 text-xs uppercase tracking-widest text-teal-400/90">Client portal</p>
          <h1 className="mt-1 font-display text-3xl text-sand-50">Sign in</h1>
          <p className="mt-2 text-sm text-sand-200/50">View bookings, galleries, and messages</p>
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <label className="block text-sm">
              <span className="text-sand-200/70">Email</span>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/10 bg-ink-950 px-3 py-2 text-sand-100 outline-none focus:border-teal-500/50"
                required
              />
            </label>
            <label className="block text-sm">
              <span className="text-sand-200/70">Password</span>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/10 bg-ink-950 px-3 py-2 text-sand-100 outline-none focus:border-teal-500/50"
                required
                minLength={6}
              />
            </label>
            {err && <p className="text-sm text-red-400/90">{err}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-teal-500 py-2.5 text-sm font-medium text-ink-950 hover:bg-teal-400 disabled:opacity-50"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
          <p className="mt-4 text-center text-sm text-sand-200/50">
            <Link to="/portal/reset-password" className="text-teal-400/90 hover:text-teal-300">
              Forgot password?
            </Link>
          </p>
          <p className="mt-2 text-center text-sm text-sand-200/50">
            No account?{' '}
            <Link to="/portal/register" className="text-teal-400/90 hover:text-teal-300">
              Register
            </Link>
          </p>
        </motion.div>
      </div>
    </PortalSupabaseGate>
  );
}
