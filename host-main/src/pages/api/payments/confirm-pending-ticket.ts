import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { sendEmail } from '@/lib/email';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { ticketId, organizerId } = req.body;

  if (!ticketId || !organizerId) {
    return res.status(400).json({ error: 'ticketId and organizerId are required' });
  }

  try {
    const { data: ticket, error: ticketError } = await supabaseAdmin
      .from('tickets')
      .select('*, event:events(title, event_date, venue, host_id)')
      .eq('id', ticketId)
      .maybeSingle();

    if (ticketError) throw ticketError;
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Only the organizer who owns this event can confirm the payment
    if (ticket.event?.host_id !== organizerId) {
      return res.status(403).json({ error: 'Not authorized to confirm this ticket' });
    }

    if (ticket.status === 'confirmed') {
      return res.status(200).json({ alreadyConfirmed: true });
    }

    const { error: updateError } = await supabaseAdmin
      .from('tickets')
      .update({
        status: 'confirmed',
        confirmed_at: new Date().toISOString(),
      })
      .eq('id', ticketId);

    if (updateError) throw updateError;

    // Best-effort confirmation email — mirrors webhook.ts's approach
    try {
      const recipientEmail = ticket.guest_email;
      if (recipientEmail && ticket.event) {
        await sendEmail({
          to: recipientEmail,
          subject: `Your ticket for ${ticket.event.title}`,
          body: `Thanks for registering! Your payment of ${ticket.payment_amount} was confirmed for ${ticket.event.title}.`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1>Ticket Confirmed!</h1>
              <p>Thank you for registering for <strong>${ticket.event.title}</strong></p>
              ${ticket.event.event_date ? `<p><strong>Date:</strong> ${new Date(ticket.event.event_date).toLocaleDateString()}</p>` : ''}
              ${ticket.event.venue ? `<p><strong>Venue:</strong> ${ticket.event.venue}</p>` : ''}
              <p><strong>Amount Paid:</strong> ${ticket.payment_amount}</p>
              <p>See you there!</p>
            </div>
          `,
        });
      }
    } catch (emailError) {
      console.error('Confirmation email failed (payment still confirmed):', emailError);
    }

    // Recalculate tickets_sold, same logic as webhook.ts
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

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error confirming pending ticket:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}