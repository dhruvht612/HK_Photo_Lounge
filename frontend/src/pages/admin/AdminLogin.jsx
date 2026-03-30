import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext.jsx';

export function AdminLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/admin';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (ex) {
      setErr(ex.body?.error || ex.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ink-950 px-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-2xl border border-white/10 bg-ink-900/60 p-8"
      >
        <h1 className="font-display text-3xl text-sand-50">Admin sign in</h1>
        <p className="mt-2 text-sm text-sand-200/50">HK Photo Lounge dashboard</p>
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <label className="block text-sm">
            <span className="text-sand-200/70">Email</span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/10 bg-ink-950 px-3 py-2 text-sand-100 outline-none focus:border-accent/50"
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
              className="mt-1 w-full rounded-lg border border-white/10 bg-ink-950 px-3 py-2 text-sand-100 outline-none focus:border-accent/50"
              required
            />
          </label>
          {err && <p className="text-sm text-red-400/90">{err}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-accent py-2.5 text-sm font-medium text-ink-950 hover:bg-accent/90 disabled:opacity-50"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
