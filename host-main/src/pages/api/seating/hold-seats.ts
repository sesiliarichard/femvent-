import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { SEAT_HOLD_DURATION_MS } from '@/types/seating';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { eventId, seatMapId, userId, seatIds } = req.body;

        if (!eventId || !seatMapId || !userId || !seatIds || !Array.isArray(seatIds)) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const { data: heldSeats, error } = await supabaseAdmin.rpc('hold_seats', {
            p_seat_ids: seatIds,
            p_user_id: userId,
            p_hold_minutes: 10,
        });

        if (error) throw error;

        const heldIds = (heldSeats ?? []).map((s: any) => s.seat_id);
        const unavailableSeats = seatIds.filter((id: string) => !heldIds.includes(id));

        if (unavailableSeats.length > 0) {
            // Release whatever we did manage to grab — partial hold isn't valid
            if (heldIds.length > 0) {
                await supabaseAdmin
                    .from('seats')
                    .update({ status: 'available', held_by: null, hold_expiry: null })
                    .in('id', heldIds)
                    .eq('held_by', userId);
            }
            return res.status(409).json({
                error: 'Some seats are already held by another user',
                unavailableSeats,
            });
        }

        const expiryTime = new Date(Date.now() + SEAT_HOLD_DURATION_MS).toISOString();

        const { data: reservation, error: resError } = await supabaseAdmin
            .from('seat_reservations')
            .insert({
                event_id: eventId,
                seat_map_id: seatMapId,
                user_id: userId,
                seat_ids: seatIds,
                status: 'held',
                expires_at: expiryTime,
            })
            .select()
            .single();

        if (resError) throw resError;

        return res.status(200).json({
            success: true,
            reservationId: reservation.id,
            expiresAt: expiryTime,
            expiresIn: SEAT_HOLD_DURATION_MS,
            message: `Seats held for ${SEAT_HOLD_DURATION_MS / 1000 / 60} minutes`,
        });
    } catch (error: any) {
        console.error('Error holding seats:', error);
        return res.status(500).json({ error: error.message || 'Failed to hold seats' });
    }
}