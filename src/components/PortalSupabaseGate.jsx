import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

export function PortalSupabaseGate({ children }) {
  const { useSupabase } = useAuth();

  if (!useSupabase) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-ink-950 px-4">
        <div className="max-w-md rounded-2xl border border-white/10 bg-ink-900/60 p-8 text-center">
          <h1 className="font-display text-2xl text-sand-50">Client portal</h1>
          <p className="mt-3 text-sm text-sand-200/60">
            The client portal requires Supabase. Set <code className="text-accent">VITE_USE_SUPABASE=true</code>{' '}
            and add your Supabase credentials to <code className="text-accent">.env</code>.
          </p>
          <Link
            to="/"
            className="mt-6 inline-block rounded-full bg-accent px-6 py-2 text-sm font-medium text-ink-950 hover:bg-accent/90"
          >
            Back to site
          </Link>
        </div>
      </div>
    );
  }

  return children;
}
