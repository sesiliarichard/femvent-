import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { eventId } = req.body;

  if (!eventId) {
    return res.status(400).json({ error: 'eventId is required' });
  }

  // Who is calling? Taken from their login token, never from the request body
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Please log in' });
  }
  const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !authData.user) {
    return res.status(401).json({ error: 'Please log in' });
  }
  const userId = authData.user.id;

  try {
    // Confirm this host actually owns the event before deleting anything
    const { data: event, error: eventError } = await supabaseAdmin
      .from('events')
      .select('id, host_id')
      .eq('id', eventId)
      .maybeSingle();

    if (eventError) throw eventError;
    if (!event) return res.status(404).json({ error: 'Event not found' });
    if (event.host_id !== userId) {
      return res.status(403).json({ error: 'You do not have permission to delete this event' });
    }

    // Tables with ON DELETE NO ACTION — must be cleared manually, children before parents
    const tablesToClear = [
      'affiliate_clicks',
      'discount_usage',
      'discount_codes',
      'seat_reservations',
      'seat_maps',
      'messages',
      'private_messages',
      'conversations',
      'ab_tests',
      'waitlist',
      'event_team',
      'event_insurance',
      'insurance_quotes',
      'invoices',
      'event_products',
      'payments',
    ];

    for (const table of tablesToClear) {
      const { error } = await supabaseAdmin.from(table).delete().eq('event_id', eventId);
      if (error) {
        console.error(`Failed clearing ${table} for event ${eventId}:`, error);
        return res.status(500).json({ error: `Failed to delete related data (${table}): ${error.message}` });
      }
    }

    // Everything else (announcements, exhibitors, venue_areas, feedback,
    // ticket_types, tickets) cascades automatically
    const { error: deleteError } = await supabaseAdmin.from('events').delete().eq('id', eventId);
    if (deleteError) throw deleteError;

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Error deleting event:', error);
    return res.status(500).json({ error: error?.message || String(error) });
  }
}