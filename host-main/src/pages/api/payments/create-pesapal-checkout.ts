import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const ALLOWED_ORIGIN = 'https://femvents.netlify.app';
const PESAPAL_BASE = 'https://cybqa.pesapal.com/pesapalv3';

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

  const { eventId, amount, email, name, phone, userId, ticketTypeName } = req.body;

  if (!eventId || !amount || amount <= 0) {
    return res.status(400).json({ error: 'eventId and a valid amount are required' });
  }
  if (!email) {
    return res.status(400).json({ error: 'Customer email is required' });
  }

  try {
    // Step 1: get an auth token
    const authRes = await fetch(`${PESAPAL_BASE}/api/Auth/RequestToken`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        consumer_key: process.env.PESAPAL_CONSUMER_KEY,
        consumer_secret: process.env.PESAPAL_CONSUMER_SECRET,
      }),
    });

    const authData = await authRes.json();
    const token = authData?.token;

    if (!token) {
      console.error('Pesapal auth failed:', authData);
      return res.status(502).json({ error: 'Failed to authenticate with Pesapal' });
    }

    const orderId = `femvents-${eventId}-${Date.now()}`;
    const origin = req.headers.origin || process.env.NEXT_PUBLIC_ATTENDEE_SITE_URL;

    // Step 2: submit the order
    const orderRes = await fetch(`${PESAPAL_BASE}/api/Transactions/SubmitOrderRequest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        id: orderId,
        currency: 'USD',
        amount,
        description: `Ticket purchase for event ${eventId}${ticketTypeName ? ` (${ticketTypeName})` : ''}`,
        callback_url: `${origin}/events/${eventId}/payment-status?pesapal=1&order_id=${orderId}`,
        notification_id: process.env.PESAPAL_IPN_ID,
        billing_address: {
          email_address: email,
          phone_number: phone || '',
          country_code: 'TZ',
          first_name: (name || 'FemVents Attendee').split(' ')[0],
          last_name: (name || '').split(' ').slice(1).join(' ') || 'Attendee',
        },
      }),
    });

    const orderData = await orderRes.json();

    if (!orderData.redirect_url) {
      console.error('Pesapal order submission failed:', orderData);
      return res.status(502).json({ error: 'Failed to create Pesapal payment session' });
    }

    // Create pending payments + ticket rows — webhook flips them to confirmed
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('payments')
      .insert({
        event_id: eventId,
        user_id: userId || null,
        amount: Math.round(amount),
        status: 'pending',
        payment_method: 'pesapal',
        type: 'ticket',
        currency: 'USD',
        meta: { order_id: orderId, order_tracking_id: orderData.order_tracking_id },
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
      payment_method: 'pesapal',
      ticket_type: ticketTypeName || 'Standard',
      check_in_status: 'not-checked-in',
    });

    if (ticketError) throw ticketError;

    return res.status(200).json({ sessionUrl: orderData.redirect_url, orderId });
  } catch (error) {
    console.error('Error creating Pesapal checkout:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}