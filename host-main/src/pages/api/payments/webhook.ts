import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { sendEmail } from '@/lib/email';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify this request really came from Flutterwave
  const signature = req.headers['verif-hash'];
  if (!signature || signature !== process.env.FLUTTERWAVE_WEBHOOK_SECRET) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const event = req.body;

  try {
    const transactionId = event?.data?.id;
    if (!transactionId) {
      return res.status(400).json({ error: 'Missing transaction id' });
    }

    // Never trust the webhook payload alone — verify directly with Flutterwave
    const verifyRes = await fetch(
      `https://api.flutterwave.com/v3/transactions/${transactionId}/verify`,
      {
        headers: {
          Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
        },
      }
    );
    const verifyData = await verifyRes.json();

    if (verifyData.status !== 'success' || verifyData.data?.status !== 'successful') {
      console.error('Transaction verification failed:', verifyData);
      return res.status(400).json({ error: 'Transaction not verified as successful' });
    }

    const tx = verifyData.data;
    const meta = tx.meta || {};
    const eventId = meta.eventId;
    const userId = meta.userId || null;
    const guestName = tx.customer?.name || null;
    const guestEmail = tx.customer?.email || null;

    if (!eventId) {
      console.error('No eventId in transaction meta:', tx);
      return res.status(400).json({ error: 'Missing eventId in transaction meta' });
    }

    // Avoid creating a duplicate ticket if Flutterwave retries the webhook
    const { data: existingTicket } = await supabaseAdmin
      .from('tickets')
      .select('id')
      .eq('payment_id', String(tx.id))
      .maybeSingle();

    if (existingTicket) {
      return res.status(200).json({ received: true, duplicate: true });
    }

    const { error: insertError } = await supabaseAdmin.from('tickets').insert({
        event_id: eventId,
        user_id: userId,
        guest_name: userId ? null : guestName,
        guest_email: userId ? null : guestEmail,
        status: 'confirmed',
        payment_id: String(tx.id),
        payment_amount: tx.amount,
        payment_method: tx.payment_type || 'card',
        confirmed_at: new Date().toISOString(),
        ticket_type: 'Standard',
        check_in_status: 'not-checked-in',
      });
      if (insertError) throw insertError;

      // Send confirmation email (best-effort — don't fail the webhook if this fails)
      try {
        const { data: eventDetails } = await supabaseAdmin
          .from('events')
          .select('title, event_date, venue')
          .eq('id', eventId)
          .maybeSingle();
  
        const recipientEmail = tx.customer?.email;
        if (recipientEmail && eventDetails) {
            const emailSent = await sendEmail({
              to: recipientEmail,
              subject: `Your ticket for ${eventDetails.title}`,
              body: `Thanks for registering! Your payment of $${tx.amount} was confirmed for ${eventDetails.title}.`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h1>Ticket Confirmed!</h1>
                  <p>Thank you for registering for <strong>${eventDetails.title}</strong></p>
                  ${eventDetails.event_date ? `<p><strong>Date:</strong> ${new Date(eventDetails.event_date).toLocaleDateString()}</p>` : ''}
                  ${eventDetails.venue ? `<p><strong>Venue:</strong> ${eventDetails.venue}</p>` : ''}
                  <p><strong>Amount Paid:</strong> $${tx.amount}</p>
                  <p>See you there!</p>
                </div>
              `,
            });
  
            if (!emailSent) {
              console.error(`Confirmation email failed to send for ticket (event ${eventId}, tx ${tx.id})`);
            }
          }
        } catch (emailError) {
          console.error('Unexpected error sending confirmation email (payment still succeeded):', emailError);
        }
  
      // Recalculate tickets_sold on the event
    const { data: confirmedTickets } = await supabaseAdmin
      .from('tickets')
      .select('user_id')
      .eq('event_id', eventId)
      .eq('status', 'confirmed');

    const uniqueUserIds = new Set(
      (confirmedTickets || []).map((t: any) => t.user_id).filter(Boolean)
    );

    await supabaseAdmin
      .from('events')
      .update({ tickets_sold: uniqueUserIds.size })
      .eq('id', eventId);

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}