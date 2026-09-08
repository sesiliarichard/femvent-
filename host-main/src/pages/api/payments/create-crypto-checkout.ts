import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const ALLOWED_ORIGIN = 'https://femvents.core23lab.org';

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

  const { eventId, amount, email, name, userId, ticketTypeName } = req.body;

  if (!eventId || !amount || amount <= 0) {
    return res.status(400).json({ error: 'eventId and a valid amount are required' });
  }
  if (!email) {
    return res.status(400).json({ error: 'Customer email is required' });
  }

  try {
    const orderId = `femvents-${eventId}-${Date.now()}`;
    const origin = req.headers.origin || process.env.NEXT_PUBLIC_ATTENDEE_SITE_URL;

    const { data: cryptoSettings } = await supabaseAdmin
      .from('platform_payment_settings')
      .select('credentials')
      .eq('provider', 'crypto')
      .maybeSingle();

    const payoutAddress = cryptoSettings?.credentials?.cryptoAddress;
    const payoutCurrency = cryptoSettings?.credentials?.payoutCurrency;

    if (!payoutAddress || !payoutCurrency) {
      console.error('No crypto payout address configured in platform_payment_settings');
      return res.status(500).json({ error: 'Crypto payments are not configured' });
    }

    const npRes = await fetch('https://api.nowpayments.io/v1/invoice', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.NOWPAYMENTS_API_KEY as string,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        price_amount: amount,
        price_currency: 'usd',
        pay_currency: payoutCurrency,
        order_id: orderId,
        order_description: `Ticket purchase for event ${eventId}${ticketTypeName ? ` (${ticketTypeName})` : ''}`,
        ipn_callback_url: `https://femvents.core23lab.org/host/api/payments/nowpayments-webhook`,
        success_url: `${origin}/events/${eventId}/payment-status?crypto=success&order_id=${orderId}`,
        cancel_url: `${origin}/events/${eventId}/payment-status?crypto=cancelled`,
      }),
    });

    const data = await npRes.json();

    if (!npRes.ok || !data.invoice_url) {
      console.error('NOWPayments invoice creation failed:', data);
      return res.status(502).json({ error: 'Failed to create crypto payment session' });
    }

       // Custody mode is enabled on this NOWPayments account — funds route automatically
    // to the wallet registered under Settings > Payments > Payout wallets, so no
    // per-transaction payout_address call is needed (or allowed) here.

    // Create pending payments + ticket rows now — the webhook flips them to confirmed
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('payments')
      .insert({
        event_id: eventId,
        user_id: userId || null,
        amount: Math.round(amount),
        status: 'pending',
        payment_method: 'crypto',
        type: 'ticket',
        currency: 'USD',
        meta: { order_id: orderId },
      })
      .select()
      .single();

    if (paymentError) throw paymentError;

    const { error: ticketError } = await supabaseAdmin.from('tickets').insert({
      event_id: eventId,
      user_id: userId || null,
      guest_name: userId ? null : name || null,
      guest_email: userId ? null : email || null,
      status: 'pending',
      payment_id: payment.id,
      payment_amount: amount,
      payment_method: 'crypto',
      ticket_type: ticketTypeName || 'Standard',
      check_in_status: 'not-checked-in',
    });

    if (ticketError) throw ticketError;

    return res.status(200).json({ sessionUrl: data.invoice_url, orderId });
  } catch (error) {
    console.error('Error creating crypto checkout:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}