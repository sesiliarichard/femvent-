import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { reservationId, ticketId, seatIds } = req.body;

        if (!reservationId || !ticketId || !seatIds) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const { data: confirmed, error } = await supabaseAdmin
            .from('seats')
            .update({ status: 'sold', ticket_id: ticketId, held_by: null, hold_expiry: null })
            .in('id', seatIds)
            .eq('status', 'held')
            .select('id');

        if (error) throw error;

        if (!confirmed || confirmed.length !== seatIds.length) {
            return res.status(409).json({ error: 'One or more seats were no longer held — hold may have expired' });
        }

        const { error: resError } = await supabaseAdmin
            .from('seat_reservations')
            .update({ status: 'confirmed', confirmed_at: new Date().toISOString() })
            .eq('id', reservationId);

        if (resError) throw resError;

        return res.status(200).json({
            success: true,
            message: 'Seats confirmed and assigned to ticket',
            seatsConfirmed: seatIds.length,
            ticketId,
        });
    } catch (error: any) {
        console.error('Error confirming seats:', error);
        return res.status(500).json({ error: error.message || 'Failed to confirm seats' });
    }
}