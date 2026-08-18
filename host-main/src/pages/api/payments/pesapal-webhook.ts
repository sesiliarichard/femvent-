import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { sendEmail } from '@/lib/email';

const PESAPAL_BASE = 'https://pay.pesapal.com/v3';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { OrderTrackingId, OrderMerchantReference } = req.query;

  if (!OrderTrackingId || typeof OrderTrackingId !== 'string') {
    return res.status(400).json({ error: 'Missing OrderTrackingId' });
  }

  try {
    // Get a fresh auth token
    const authRes = await fetch(`${PESAPAL_BASE}/api/Auth/RequestToken`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        consumer_key: process.env.PESAPAL_LIVE_CONSUMER_KEY,
        consumer_secret: process.env.PESAPAL_LIVE_CONSUMER_SECRET,
      }),
    });
    const authData = await authRes.json();
    const token = authData?.token;

    if (!token) {
      console.error('Pesapal webhook auth failed:', authData);
      return res.status(502).json({ error: 'Failed to authenticate with Pesapal' });
    }

    // Verify the real transaction status directly with Pesapal — never trust the IPN alone
    const statusRes = await fetch(
      `${PESAPAL_BASE}/api/Transactions/GetTransactionStatus?orderTrackingId=${OrderTrackingId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const statusData = await statusRes.json();

    console.log('Pesapal transaction status:', JSON.stringify(statusData));

    if (statusData.payment_status_description !== 'Completed') {
      return res.status(200).json({ received: true, ignored: statusData.payment_status_description });
    }

    const orderId = OrderMerchantReference || statusData.merchant_reference;

    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('meta->>order_id', orderId)
      .maybeSingle();

    if (paymentError) throw paymentError;
    if (!payment) {
      console.error('No matching payment found for Pesapal order_id:', orderId);
      return res.status(404).json({ error: 'Payment record not found' });
    }

    if (payment.status === 'confirmed') {
      return res.status(200).json({ received: true, duplicate: true });
    }

    await supabaseAdmin.from('payments').update({ status: 'confirmed' }).eq('id', payment.id);

    const { data: ticket, error: ticketError } = await supabaseAdmin
      .from('tickets')
      .update({ status: 'confirmed', confirmed_at: new Date().toISOString() })
      .eq('payment_id', payment.id)
      .select('*, event:events(title, event_date, venue)')
      .single();

    if (ticketError) throw ticketError;

    try {
      const recipientEmail = ticket.guest_email;
      if (recipientEmail && ticket.event) {
        await sendEmail({
          to: recipientEmail,
          subject: `Your ticket for ${ticket.event.title}`,
          body: `Thanks for registering! Your payment of $${ticket.payment_amount} was confirmed for ${ticket.event.title}.`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1>Ticket Confirmed!</h1>
              <p>Thank you for registering for <strong>${ticket.event.title}</strong></p>
              ${ticket.event.event_date ? `<p><strong>Date:</strong> ${new Date(ticket.event.event_date).toLocaleDateString()}</p>` : ''}
              ${ticket.event.venue ? `<p><strong>Venue:</strong> ${ticket.event.venue}</p>` : ''}
              <p><strong>Amount Paid:</strong> $${ticket.payment_amount}</p>
              <p>See you there!</p>
            </div>
          `,
        });
      }
    } catch (emailError) {
      console.error('Confirmation email failed (payment still confirmed):', emailError);
    }

    const { data: confirmedTickets } = await supabaseAdmin
      .from('tickets')
      .select('user_id')
      .eq('event_id', ticket.event_id)
      .eq('status', 'confirmed');

    const uniqueUserIds = new Set((confirmedTickets || []).map((t: any) => t.user_id).filter(Boolean));

    await supabaseAdmin.from('events').update({ tickets_sold: uniqueUserIds.size }).eq('id', ticket.event_id);

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Pesapal webhook processing error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}