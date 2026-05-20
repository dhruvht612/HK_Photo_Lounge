import { supabase } from '../client.js';

function assertClient() {
  if (!supabase) throw new Error('Supabase is not configured');
}

export async function fetchUpcomingBooking(userId) {
  assertClient();
  const { data, error } = await supabase
    .from('bookings')
    .select('*, services(name)')
    .eq('client_id', userId)
    .eq('status', 'confirmed')
    .order('event_date', { ascending: true, nullsFirst: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchActiveBookingsCount(userId) {
  assertClient();
  const { count, error } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('client_id', userId)
    .eq('status', 'confirmed');
  if (error) throw error;
  return count ?? 0;
}

export async function fetchUnreadMessagesCount(userId) {
  assertClient();
  const { data: bookings, error: bookingsError } = await supabase
    .from('bookings')
    .select('id')
    .eq('client_id', userId);
  if (bookingsError) throw bookingsError;
  const bookingIds = (bookings ?? []).map((b) => b.id);
  if (bookingIds.length === 0) return 0;

  const { count, error } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .in('booking_id', bookingIds)
    .eq('read', false)
    .neq('sender_id', userId);
  if (error) throw error;
  return count ?? 0;
}

export async function fetchPendingDocumentsCount(userId) {
  assertClient();
  const { data: bookings, error: bookingsError } = await supabase
    .from('bookings')
    .select('id')
    .eq('client_id', userId);
  if (bookingsError) throw bookingsError;
  const bookingIds = (bookings ?? []).map((b) => b.id);
  if (bookingIds.length === 0) return 0;

  const [contractsRes, invoicesRes] = await Promise.all([
    supabase
      .from('contracts')
      .select('*', { count: 'exact', head: true })
      .in('booking_id', bookingIds)
      .eq('signed_by_client', false),
    supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .in('booking_id', bookingIds)
      .eq('status', 'pending'),
  ]);

  if (contractsRes.error) throw contractsRes.error;
  if (invoicesRes.error) throw invoicesRes.error;

  return (contractsRes.count ?? 0) + (invoicesRes.count ?? 0);
}

export async function fetchRecentActivity(userId) {
  assertClient();
  const items = [];

  const { data: bookings } = await supabase
    .from('bookings')
    .select('id, status, event_date, created_at, services(name)')
    .eq('client_id', userId)
    .order('created_at', { ascending: false })
    .limit(3);

  for (const b of bookings ?? []) {
    items.push({
      id: `booking-${b.id}`,
      type: 'booking',
      label: `Booking ${b.status}`,
      detail: b.services?.name ?? 'Session',
      at: b.created_at,
    });
  }

  const { data: inquiries } = await supabase
    .from('inquiries')
    .select('id, status, created_at')
    .eq('client_id', userId)
    .order('created_at', { ascending: false })
    .limit(2);

  for (const i of inquiries ?? []) {
    items.push({
      id: `inquiry-${i.id}`,
      type: 'inquiry',
      label: 'Inquiry submitted',
      detail: `Status: ${i.status}`,
      at: i.created_at,
    });
  }

  const { data: bookingRows } = await supabase
    .from('bookings')
    .select('id')
    .eq('client_id', userId);
  const bookingIds = (bookingRows ?? []).map((b) => b.id);

  if (bookingIds.length > 0) {
    const { data: deliveries } = await supabase
      .from('gallery_deliveries')
      .select('id, title, created_at')
      .in('booking_id', bookingIds)
      .order('created_at', { ascending: false })
      .limit(2);

    for (const g of deliveries ?? []) {
      items.push({
        id: `gallery-${g.id}`,
        type: 'gallery',
        label: 'Gallery delivered',
        detail: g.title,
        at: g.created_at,
      });
    }
  }

  return items
    .sort((a, b) => new Date(b.at) - new Date(a.at))
    .slice(0, 5);
}

export async function fetchDashboardData(userId) {
  const [upcoming, activeBookings, unreadMessages, pendingDocuments, activity] =
    await Promise.all([
      fetchUpcomingBooking(userId),
      fetchActiveBookingsCount(userId),
      fetchUnreadMessagesCount(userId),
      fetchPendingDocumentsCount(userId),
      fetchRecentActivity(userId),
    ]);

  return {
    upcoming,
    activeBookings,
    unreadMessages,
    pendingDocuments,
    activity,
  };
}
