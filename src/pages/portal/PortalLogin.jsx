import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SignIn } from '@clerk/react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { PortalSupabaseGate } from '../../components/PortalSupabaseGate.jsx';
import { isClerkEnabled } from '../../clerk/config.js';
import { clerkAppearance } from '../../clerk/appearance.js';
import { LegacyPortalLogin } from './LegacyPortalLogin.jsx';

export function PortalLogin() {
  const { user, loading: authLoading, useClerk } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && user?.role === 'client') {
      navigate('/portal/dashboard', { replace: true });
    }
    if (!authLoading && user?.role === 'admin') {
      navigate('/admin', { replace: true });
    }
  }, [user, authLoading, navigate]);

  if (!isClerkEnabled || !useClerk) {
    return <LegacyPortalLogin />;
  }

  return (
    <PortalSupabaseGate>
      <div className="flex min-h-screen flex-col items-center justify-center bg-ink-950 px-4 py-10">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-1 text-sm text-sand-200/60 transition hover:text-sand-100"
        >
          ← Back to site
        </Link>
        <SignIn
          routing="path"
          path="/portal/login"
          signUpUrl="/portal/register"
          fallbackRedirectUrl="/portal/dashboard"
          appearance={clerkAppearance}
        />
      </div>
    </PortalSupabaseGate>
  );
}
