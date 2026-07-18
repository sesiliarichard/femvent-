import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { reservationId, seatIds } = req.body;

        if (!reservationId || !seatIds || !Array.isArray(seatIds)) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const { error } = await supabaseAdmin
            .from('seats')
            .update({ status: 'available', held_by: null, hold_expiry: null })
            .in('id', seatIds)
            .eq('status', 'held');

        if (error) throw error;

        const { error: resError } = await supabaseAdmin
            .from('seat_reservations')
            .update({ status: 'released', released_at: new Date().toISOString() })
            .eq('id', reservationId);

        if (resError) throw resError;

        return res.status(200).json({
            success: true,
            message: 'Seats released successfully',
            seatsReleased: seatIds.length,
        });
    } catch (error: any) {
        console.error('Error releasing seats:', error);
        return res.status(500).json({ error: error.message || 'Failed to release seats' });
    }
}