import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { sendEmail } from '@/lib/email';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Log the full raw payload — AzamPay's exact callback field names aren't
  // fully confirmed yet, so check this log after a real test and adjust
  // the field names below if they don't match.
  console.log('AzamPay webhook raw payload:', JSON.stringify(req.body));

  try {
    const body = req.body;

    // Best-guess field names based on available documentation — verify against the log above
    const externalId = body.utilityref || body.reference || body.externalId || body.transactionExternalId;
    const status = body.transactionstatus || body.status;

    if (!externalId) {
      console.error('AzamPay webhook missing external id, full body logged above');
      return res.status(400).json({ error: 'Missing transaction reference' });
    }

    if (status !== 'success' && status !== 'successful' && status !== 'completed') {
      return res.status(200).json({ received: true, ignored: status });
    }

    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('meta->>external_id', externalId)
      .maybeSingle();

    if (paymentError) throw paymentError;
    if (!payment) {
      console.error('No matching payment found for AzamPay external_id:', externalId);
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
    console.error('AzamPay webhook processing error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}