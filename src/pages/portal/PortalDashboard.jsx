import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { fetchDashboardData } from '../../supabase/queries/dashboard.js';

function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-lg bg-white/10 ${className}`} />;
}

function formatDate(dateStr) {
  if (!dateStr) return 'TBD';
  return new Date(dateStr).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function PortalDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    setLoading(true);
    setErr(null);
    fetchDashboardData(user.id)
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((e) => {
        if (!cancelled) setErr(e.message || 'Failed to load dashboard');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const name = user?.name || user?.email?.split('@')[0] || 'there';

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl text-sand-50">Welcome back, {name}!</h1>
        <p className="mt-1 text-sm text-sand-200/50">Your bookings and deliverables at a glance</p>
      </div>

      {err && (
        <p className="rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-300">
          {err}
        </p>
      )}

      <section>
        <h2 className="text-sm font-medium uppercase tracking-wider text-sand-200/50">
          Upcoming booking
        </h2>
        {loading ? (
          <Skeleton className="mt-3 h-32 w-full" />
        ) : data?.upcoming ? (
          <div className="mt-3 rounded-2xl border border-white/10 bg-ink-900/50 p-6">
            <p className="font-display text-xl text-sand-50">
              {data.upcoming.services?.name ?? 'Photography session'}
            </p>
            <p className="mt-2 text-sm text-sand-200/70">
              {formatDate(data.upcoming.event_date)}
              {data.upcoming.location ? ` · ${data.upcoming.location}` : ''}
            </p>
            <span className="mt-3 inline-block rounded-full bg-teal-500/20 px-3 py-0.5 text-xs text-teal-300">
              {data.upcoming.status}
            </span>
          </div>
        ) : (
          <p className="mt-3 rounded-2xl border border-dashed border-white/10 px-6 py-8 text-center text-sm text-sand-200/50">
            No upcoming bookings.{' '}
            <Link to="/contact" className="text-teal-400/90 hover:text-teal-300">
              Get in touch
            </Link>{' '}
            to plan your next session.
          </p>
        )}
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {loading ? (
          <>
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </>
        ) : (
          <>
            <StatCard label="Active bookings" value={data?.activeBookings ?? 0} />
            <StatCard label="Unread messages" value={data?.unreadMessages ?? 0} />
            <StatCard label="Pending documents" value={data?.pendingDocuments ?? 0} />
          </>
        )}
      </section>

      <section>
        <h2 className="text-sm font-medium uppercase tracking-wider text-sand-200/50">
          Recent activity
        </h2>
        {loading ? (
          <div className="mt-3 space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : data?.activity?.length ? (
          <ul className="mt-3 divide-y divide-white/5 rounded-2xl border border-white/10 bg-ink-900/40">
            {data.activity.map((item) => (
              <li key={item.id} className="flex items-start justify-between gap-4 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-sand-100">{item.label}</p>
                  <p className="text-xs text-sand-200/50">{item.detail}</p>
                </div>
                <time className="shrink-0 text-xs text-sand-200/40">
                  {new Date(item.at).toLocaleDateString()}
                </time>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-sand-200/50">No recent activity yet.</p>
        )}
      </section>

      <section className="flex flex-wrap gap-3">
        <QuickAction to="/portal/bookings" label="View my bookings" />
        <QuickAction to="/portal/galleries" label="Check galleries" />
        <QuickAction to="/portal/messages" label="Send a message" />
      </section>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-ink-900/50 p-5">
      <p className="text-2xl font-display text-sand-50">{value}</p>
      <p className="mt-1 text-xs text-sand-200/50">{label}</p>
    </div>
  );
}

function QuickAction({ to, label }) {
  return (
    <Link
      to={to}
      className="rounded-full border border-white/15 px-5 py-2 text-sm text-sand-200 hover:border-teal-500/40 hover:text-teal-300"
    >
      {label}
    </Link>
  );
}
