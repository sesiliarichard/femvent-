import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { eventId, amount, seatIds, sessionId, userId, email, name, redirectUrl } = req.body;

  if (!eventId || !amount || amount <= 0) {
    return res.status(400).json({ error: 'eventId and a valid amount are required' });
  }

  if (!email) {
    return res.status(400).json({ error: 'Customer email is required' });
  }

  try {
    // Look up the event's organizer
    const { data: event, error: eventError } = await supabaseAdmin
      .from('events')
      .select('host_id, currency')
      .eq('id', eventId)
      .maybeSingle();

    if (eventError) throw eventError;

    if (!event || !event.host_id) {
      return res.status(400).json({ error: 'Event or organizer not found' });
    }

    // Look up the organizer's active Flutterwave payment account
    const { data: paymentAccount, error: paymentAccountError } = await supabaseAdmin
      .from('payment_accounts')
      .select('external_account_id')
      .eq('user_id', event.host_id)
      .eq('provider', 'flutterwave')
      .eq('status', 'active')
      .maybeSingle();

    if (paymentAccountError) throw paymentAccountError;

    if (!paymentAccount?.external_account_id) {
      return res.status(400).json({
        error: 'This organizer has not connected a Flutterwave payout account yet',
      });
    }

    const txRef = `femvents-${eventId}-${Date.now()}`;

    const flutterwaveRes = await fetch('https://api.flutterwave.com/v3/payments', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tx_ref: txRef,
        amount,
        currency: event.currency || 'USD',
        redirect_url: redirectUrl || `${req.headers.origin}/events/${eventId}/payment-status`,
        customer: {
          email,
          name: name || 'FemVents Attendee',
        },
        customizations: {
          title: 'FemVents Ticket Purchase',
          description: `Ticket purchase for event ${eventId}`,
        },
        subaccounts: [
          {
            id: paymentAccount.external_account_id,
          },
        ],
        meta: {
          eventId,
          userId: userId || null,
          seatIds: seatIds || [],
          sessionId: sessionId || null,
        },
      }),
    });

    const data = await flutterwaveRes.json();

    if (data.status !== 'success' || !data.data?.link) {
      console.error('Flutterwave checkout creation failed:', data);
      return res.status(502).json({ error: 'Failed to create payment session' });
    }

    return res.status(200).json({ sessionUrl: data.data.link, txRef });
  } catch (error) {
    console.error('Error creating Flutterwave checkout:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}