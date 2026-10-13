import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireUser } from '@/lib/requireUser';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const user = await requireUser(req, res);
        if (!user) return;

        const eventId = String(req.query.id || '');
        const { attendeeIds, reason } = req.body;

        if (!eventId) {
            return res.status(400).json({ error: 'Event id is missing from the URL' });
        }
        if (!attendeeIds || !Array.isArray(attendeeIds) || attendeeIds.length === 0) {
            return res.status(400).json({ error: 'Attendee IDs are required' });
        }

        // Only the event's host (or an admin) may refund its tickets
        const { data: eventRow } = await supabaseAdmin
            .from('events')
            .select('host_id')
            .eq('id', eventId)
            .maybeSingle();

        if (!eventRow) {
            return res.status(404).json({ error: 'Event not found' });
        }

        if (eventRow.host_id !== user.id) {
            const { data: me } = await supabaseAdmin
                .from('users')
                .select('role')
                .eq('id', user.id)
                .maybeSingle();
            if (me?.role !== 'admin') {
                return res.status(403).json({ error: 'You do not have permission to refund these tickets' });
            }
        }

        const { data: tickets, error: ticketsError } = await supabaseAdmin
            .from('tickets')
            .select('id, payment_id, amount, payment_amount')
            .in('id', attendeeIds)
            .eq('event_id', eventId)
            .in('status', ['confirmed', 'pending']);

        if (ticketsError) throw ticketsError;

        const now = new Date().toISOString();
        const refundReason = reason || 'Bulk refund';

        const refundPromises = (tickets ?? []).map(async (ticket) => {
            try {
                const { error: ticketError } = await supabaseAdmin
                    .from('tickets')
                    .update({
                        status: 'cancelled',
                        refund_reason: refundReason,
                        refunded_at: now,
                        updated_at: now,
                    })
                    .eq('id', ticket.id);

                if (ticketError) throw ticketError;

                if (ticket.payment_id) {
                    const { error: paymentError } = await supabaseAdmin
                        .from('payments')
                        .update({ status: 'refunded', refunded_at: now, refund_reason: refundReason })
                        .eq('id', ticket.payment_id);

                    if (paymentError) console.log('Payment record not found or already updated');
                }

                const refundAmount = ticket.amount || ticket.payment_amount || 0;

                // TODO: Process actual payment refund via Stripe
                console.log(`💰 Refund processed for ticket ${ticket.id}: $${refundAmount}`);

                return { success: true, ticketId: ticket.id, amount: refundAmount };
            } catch (error) {
                console.error(`Failed to refund ticket ${ticket.id}:`, error);
                return { success: false, ticketId: ticket.id, error };
            }
        });

        const results = await Promise.all(refundPromises);
        const successCount = results.filter((r) => r?.success).length;
        const totalAmount = results
            .filter((r) => r?.success)
            .reduce((sum, r: any) => sum + (r?.amount || 0), 0);

        console.log(`✅ Processed ${successCount} refunds totaling $${totalAmount}`);

        return res.status(200).json({
            success: true,
            total: attendeeIds.length,
            refunded: successCount,
            failed: attendeeIds.length - successCount,
            totalAmount,
            results,
            note: 'Tickets were cancelled and marked refunded. No money was sent automatically: refund each buyer through your payment provider or bank.',
        });
    } catch (error: any) {
        console.error('Error processing refunds:', error);
        return res.status(500).json({ error: error.message || 'Failed to process refunds' });
    }
}