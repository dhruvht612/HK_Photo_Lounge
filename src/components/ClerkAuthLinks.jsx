import { Link } from 'react-router-dom';
import { Show, SignInButton, SignUpButton, UserButton } from '@clerk/react';
import { isClerkEnabled } from '../clerk/config.js';

const signInClass =
  'rounded-full px-3 py-1.5 text-sm text-sand-200/90 transition hover:bg-white/[0.06] hover:text-sand-50';
const signUpClass =
  'rounded-full bg-teal-500/90 px-3 py-1.5 text-sm font-medium text-ink-950 transition hover:bg-teal-400';

export function ClerkAuthLinks({ className = '' }) {
  if (!isClerkEnabled) {
    return (
      <div className={`flex flex-wrap items-center gap-2 ${className}`}>
        <Link to="/portal/login" className={signInClass}>
          Sign in
        </Link>
        <Link to="/portal/register" className={signUpClass}>
          Sign up
        </Link>
        <Link
          to="/admin/login"
          className="rounded-full px-2 py-1.5 text-xs text-sand-500/80 transition hover:text-sand-300"
        >
          Admin
        </Link>
      </div>
    );
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <Show when="signed-out">
        <SignInButton mode="modal">
          <button type="button" className={signInClass}>
            Sign in
          </button>
        </SignInButton>
        <SignUpButton mode="modal">
          <button type="button" className={signUpClass}>
            Sign up
          </button>
        </SignUpButton>
      </Show>
      <Show when="signed-in">
        <Link to="/portal/dashboard" className={signInClass}>
          Portal
        </Link>
        <UserButton
          afterSignOutUrl="/"
          appearance={{
            elements: {
              userButtonPopoverCard: 'bg-ink-900 border border-white/10',
            },
          }}
        />
      </Show>
      <Link
        to="/admin/login"
        className="rounded-full px-2 py-1.5 text-xs text-sand-500/80 transition hover:text-sand-300"
      >
        Admin
      </Link>
    </div>
  );
}
