import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { PortalSupabaseGate } from '../../components/PortalSupabaseGate.jsx';

export function PortalResetPassword() {
  const { resetPassword, useClerk } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (useClerk) {
      navigate('/portal/login', { replace: true });
    }
  }, [useClerk, navigate]);

  if (useClerk) {
    return null;
  }
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
    } catch (ex) {
      setErr(ex.message || 'Could not send reset email');
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
          <h1 className="mt-4 font-display text-3xl text-sand-50">Reset password</h1>
          {sent ? (
            <div className="mt-6">
              <p className="text-sm text-sand-200/70">
                If an account exists for <strong className="text-sand-100">{email}</strong>, you will
                receive a reset link shortly. Check your inbox and spam folder.
              </p>
              <Link
                to="/portal/login"
                className="mt-6 inline-block rounded-full bg-teal-500 px-6 py-2 text-sm font-medium text-ink-950 hover:bg-teal-400"
              >
                Back to sign in
              </Link>
            </div>
          ) : (
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
              {err && <p className="text-sm text-red-400/90">{err}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-teal-500 py-2.5 text-sm font-medium text-ink-950 hover:bg-teal-400 disabled:opacity-50"
              >
                {loading ? 'Sending…' : 'Send reset link'}
              </button>
              <p className="text-center text-sm">
                <Link to="/portal/login" className="text-teal-400/90 hover:text-teal-300">
                  Back to sign in
                </Link>
              </p>
            </form>
          )}
        </motion.div>
      </div>
    </PortalSupabaseGate>
  );
}
