import { Link } from 'react-router-dom';

export function PortalPlaceholder({ title, phase, description }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-ink-900/40 p-8 text-center">
      <h1 className="font-display text-2xl text-sand-50">{title}</h1>
      <p className="mt-2 text-sm text-sand-200/50">
        {description ?? `This feature is coming in Phase ${phase}.`}
      </p>
      <Link
        to="/portal/dashboard"
        className="mt-6 inline-block rounded-full border border-white/15 px-5 py-2 text-sm text-sand-200 hover:border-white/30"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
