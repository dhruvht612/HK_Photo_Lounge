import { useEffect } from 'react';
import { useAuth as useClerkAuth, useUser } from '@clerk/react';
import { resolveClerkProfile } from '../supabase/clerkProfile.js';

/**
 * Syncs Clerk session → app AuthContext (profiles row + role).
 * Must render inside ClerkProvider and AuthProvider.
 */
export function ClerkAuthSync({ setUser, setToken, setLoading, clerkSignOutRef }) {
  const { isSignedIn, isLoaded, signOut } = useClerkAuth();
  const { user: clerkUser } = useUser();

  useEffect(() => {
    clerkSignOutRef.current = signOut;
    return () => {
      clerkSignOutRef.current = null;
    };
  }, [signOut, clerkSignOutRef]);

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn || !clerkUser) {
      setUser(null);
      setToken(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    resolveClerkProfile(clerkUser)
      .then((profile) => {
        if (cancelled) return;
        if (!profile) {
          setUser(null);
          setToken(null);
          return;
        }
        setUser(profile);
        setToken('clerk');
      })
      .catch(() => {
        if (!cancelled) {
          setUser({
            id: clerkUser.id,
            email: clerkUser.primaryEmailAddress?.emailAddress ?? '',
            name: clerkUser.fullName ?? clerkUser.firstName ?? null,
            phone: clerkUser.primaryPhoneNumber?.phoneNumber ?? null,
            avatar_url: clerkUser.imageUrl ?? null,
            role: 'client',
          });
          setToken('clerk');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, clerkUser, setUser, setToken, setLoading]);

  return null;
}
