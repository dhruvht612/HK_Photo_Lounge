import { useEffect } from 'react';
import { useAuth } from '@clerk/react';
import { setClerkTokenGetter } from '../supabase/client.js';

/** Passes Clerk session tokens to the Supabase client for third-party auth. */
export function ClerkTokenBridge() {
  const { getToken, isSignedIn } = useAuth();

  useEffect(() => {
    setClerkTokenGetter(async () => {
      if (!isSignedIn) return null;
      try {
        return (await getToken()) ?? null;
      } catch {
        return null;
      }
    });
    return () => setClerkTokenGetter(null);
  }, [getToken, isSignedIn]);

  return null;
}
