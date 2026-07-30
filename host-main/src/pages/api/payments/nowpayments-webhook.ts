import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { sendEmail } from '@/lib/email';

export const config = {
  api: { bodyParser: false },
};

function readRawBody(req: NextApiRequest): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => (data += chunk));
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

function sortObject(obj: any): any {
  if (Array.isArray(obj)) return obj.map(sortObject);
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj)
      .sort()
      .reduce((result: any, key) => {
        result[key] = sortObject(obj[key]);
        return result;
      }, {});
  }
  return obj;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const rawBody = await readRawBody(req);
  const signature = req.headers['x-nowpayments-sig'];

  if (!signature) {
    return res.status(401).json({ error: 'Missing signature' });
  }

  const parsed = JSON.parse(rawBody);
  const sortedBody = JSON.stringify(sortObject(parsed));

  const expectedSignature = crypto
    .createHmac('sha512', process.env.NOWPAYMENTS_IPN_SECRET as string)
    .update(sortedBody)
    .digest('hex');

  if (expectedSignature !== signature) {
    console.error('NOWPayments signature mismatch');
    return res.status(401).json({ error: 'Invalid signature' });
  }

  try {
    const { order_id, payment_status } = parsed;

    if (!order_id) {
      return res.status(400).json({ error: 'Missing order_id' });
    }

    // Only act on final confirmation — ignore waiting/confirming/etc.
    if (payment_status !== 'finished') {
      return res.status(200).json({ received: true, ignored: payment_status });
    }

    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('meta->>order_id', order_id)
      .maybeSingle();

    if (paymentError) throw paymentError;
    if (!payment) {
      console.error('No matching payment found for order_id:', order_id);
      return res.status(404).json({ error: 'Payment record not found' });
    }

    if (payment.status === 'confirmed') {
      return res.status(200).json({ received: true, duplicate: true });
    }

    await supabaseAdmin
      .from('payments')
      .update({ status: 'confirmed' })
      .eq('id', payment.id);

    const { data: ticket, error: ticketError } = await supabaseAdmin
      .from('tickets')
      .update({ status: 'confirmed', confirmed_at: new Date().toISOString() })
      .eq('payment_id', payment.id)
      .select('*, event:events(title, event_date, venue)')
      .single();

    if (ticketError) throw ticketError;

    // Best-effort confirmation email
    try {
      const recipientEmail = ticket.guest_email;
      if (recipientEmail && ticket.event) {
        await sendEmail({
          to: recipientEmail,
          subject: `Your ticket for ${ticket.event.title}`,
          body: `Thanks for registering! Your crypto payment of $${ticket.payment_amount} was confirmed for ${ticket.event.title}.`,
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

    // Recalculate tickets_sold
    const { data: confirmedTickets } = await supabaseAdmin
      .from('tickets')
      .select('user_id')
      .eq('event_id', ticket.event_id)
      .eq('status', 'confirmed');

    const uniqueUserIds = new Set((confirmedTickets || []).map((t: any) => t.user_id).filter(Boolean));

    await supabaseAdmin
      .from('events')
      .update({ tickets_sold: uniqueUserIds.size })
      .eq('id', ticket.event_id);

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('NOWPayments webhook processing error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}