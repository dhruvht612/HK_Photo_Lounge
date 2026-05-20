import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { PortalSupabaseGate } from '../../components/PortalSupabaseGate.jsx';

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRe = /^[+]?[\d\s()-]{7,}$/;

export function PortalRegister() {
  const { register, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [err, setErr] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user?.role === 'client') {
      navigate('/portal/dashboard', { replace: true });
    }
  }, [user, authLoading, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setErr(null);
    setSuccess(null);
    if (!name.trim()) {
      setErr('Name is required');
      return;
    }
    if (!emailRe.test(email)) {
      setErr('Enter a valid email address');
      return;
    }
    if (phone.trim() && !phoneRe.test(phone.trim())) {
      setErr('Enter a valid phone number');
      return;
    }
    if (password.length < 8) {
      setErr('Password must be at least 8 characters');
      return;
    }
    if (password !== confirm) {
      setErr('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const result = await register(email, password, { name, phone });
      if (result?.needsEmailConfirmation) {
        setSuccess(
          'Account created. Check your email for a confirmation link, then sign in.'
        );
        return;
      }
      navigate('/portal/dashboard', { replace: true });
    } catch (ex) {
      setErr(ex?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <PortalSupabaseGate>
      <div className="flex min-h-screen flex-col items-center justify-center bg-ink-950 px-4 py-10">
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
          <h1 className="mt-1 font-display text-3xl text-sand-50">Create account</h1>
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <label className="block text-sm">
              <span className="text-sand-200/70">Full name</span>
              <input
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/10 bg-ink-950 px-3 py-2 text-sand-100 outline-none focus:border-teal-500/50"
                required
              />
            </label>
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
              <span className="text-sand-200/70">Phone (optional)</span>
              <input
                type="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/10 bg-ink-950 px-3 py-2 text-sand-100 outline-none focus:border-teal-500/50"
              />
            </label>
            <label className="block text-sm">
              <span className="text-sand-200/70">Password</span>
              <input
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/10 bg-ink-950 px-3 py-2 text-sand-100 outline-none focus:border-teal-500/50"
                required
                minLength={8}
              />
            </label>
            <label className="block text-sm">
              <span className="text-sand-200/70">Confirm password</span>
              <input
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/10 bg-ink-950 px-3 py-2 text-sand-100 outline-none focus:border-teal-500/50"
                required
                minLength={8}
              />
            </label>
            {err && <p className="text-sm text-red-400/90">{err}</p>}
            {success && <p className="text-sm text-teal-300/90">{success}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-teal-500 py-2.5 text-sm font-medium text-ink-950 hover:bg-teal-400 disabled:opacity-50"
            >
              {loading ? 'Creating account…' : 'Register'}
            </button>
          </form>
          <p className="mt-4 text-center text-sm text-sand-200/50">
            Already have an account?{' '}
            <Link to="/portal/login" className="text-teal-400/90 hover:text-teal-300">
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </PortalSupabaseGate>
  );
}
