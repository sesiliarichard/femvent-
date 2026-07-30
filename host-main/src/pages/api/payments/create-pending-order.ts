import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const ALLOWED_ORIGIN = 'https://femvents.netlify.app';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { eventId, provider, amount, userId, guestName, guestEmail } = req.body;

  if (!eventId || !provider || !amount || amount <= 0) {
    return res.status(400).json({ error: 'eventId, provider, and a valid amount are required' });
  }

  if (!['wise', 'crypto', 'manual'].includes(provider)) {
    return res.status(400).json({ error: 'Unsupported provider for pending orders' });
  }

  if (!userId && !guestEmail) {
    return res.status(400).json({ error: 'userId or guestEmail is required' });
  }

  try {
    // Confirm the organizer actually has this provider connected and active
    const { data: event, error: eventError } = await supabaseAdmin
      .from('events')
      .select('host_id')
      .eq('id', eventId)
      .maybeSingle();

    if (eventError) throw eventError;
    if (!event?.host_id) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const { data: paymentAccount, error: paymentAccountError } = await supabaseAdmin
      .from('payment_accounts')
      .select('meta')
      .eq('user_id', event.host_id)
      .eq('provider', provider)
      .eq('status', 'active')
      .maybeSingle();

    if (paymentAccountError) throw paymentAccountError;
    if (!paymentAccount) {
      return res.status(400).json({ error: 'Organizer has not connected this payment method' });
    }

    const reference = `FV-${provider.toUpperCase()}-${Date.now()}`;

    // tickets.payment_id is a foreign key into payments — that row must exist first
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('payments')
      .insert({
        event_id: eventId,
        user_id: userId || null,
        amount: Math.round(amount),
        status: 'pending',
        payment_method: provider,
        type: 'ticket',
        currency: 'USD',
        meta: { reference },
      })
      .select()
      .single();

    if (paymentError) throw paymentError;

    const { data: ticket, error: insertError } = await supabaseAdmin
      .from('tickets')
      .insert({
        event_id: eventId,
        user_id: userId || null,
        guest_name: userId ? null : guestName || null,
        guest_email: userId ? null : guestEmail || null,
        status: 'pending',
        payment_id: payment.id,
        payment_amount: amount,
        payment_method: provider,
        ticket_type: 'Standard',
        check_in_status: 'not-checked-in',
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return res.status(200).json({
      ticketId: ticket.id,
      reference,
      instructions: paymentAccount.meta,
    });
    
  } catch (error) {
    console.error('Error creating pending order:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}