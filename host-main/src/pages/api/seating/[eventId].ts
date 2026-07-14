import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { eventId } = req.query;

        if (!eventId || typeof eventId !== 'string') {
            return res.status(400).json({ error: 'Event ID is required' });
        }

        const { data: seatMap, error: mapError } = await supabaseAdmin
            .from('seat_maps')
            .select('*, seat_sections(*, seats(*))')
            .eq('event_id', eventId)
            .maybeSingle();

        if (mapError) throw mapError;
        if (!seatMap) return res.status(404).json({ error: 'Seat map not found for this event' });

        // Expired holds read as available even if not yet cleaned up
        const now = new Date().toISOString();
        for (const section of seatMap.seat_sections) {
            for (const seat of section.seats) {
                if (seat.status === 'held' && seat.hold_expiry && seat.hold_expiry < now) {
                    seat.status = 'available';
                }
            }
        }

        return res.status(200).json({ success: true, seatMap });
    } catch (error: any) {
        console.error('Error fetching seat map:', error);
        return res.status(500).json({ error: error.message || 'Failed to fetch seat map' });
    }
}