import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

async function updateAttendeeCount(eventId: string) {
    const { data, error } = await supabaseAdmin
        .from('tickets')
        .select('user_id')
        .eq('event_id', eventId)
        .eq('status', 'confirmed');

    if (error) throw error;

    const uniqueUserIds = new Set((data ?? []).map((t) => t.user_id).filter(Boolean));

    const { error: updateError } = await supabaseAdmin
        .from('events')
        .update({ current_attendees: uniqueUserIds.size })
        .eq('id', eventId);

    if (updateError) throw updateError;

    return uniqueUserIds.size;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { eventId } = req.query;
        const { attendeeIds, status } = req.body;

        if (!eventId || typeof eventId !== 'string') {
            return res.status(400).json({ error: 'Event ID is required' });
        }
        if (!attendeeIds || !Array.isArray(attendeeIds) || attendeeIds.length === 0) {
            return res.status(400).json({ error: 'Attendee IDs are required' });
        }
        if (!status || !['confirmed', 'pending', 'cancelled'].includes(status)) {
            return res.status(400).json({ error: 'Valid status is required' });
        }

        const { error } = await supabaseAdmin
            .from('tickets')
            .update({ status, updated_at: new Date().toISOString() })
            .in('id', attendeeIds);

        if (error) throw error;

        if (status === 'confirmed' || status === 'cancelled') {
            try {
                await updateAttendeeCount(eventId);
            } catch (countError) {
                console.error('Error updating attendee count:', countError);
            }
        }

        console.log(`✅ Updated ${attendeeIds.length} tickets to status: ${status}`);

        return res.status(200).json({
            success: true,
            updated: attendeeIds.length,
            status,
        });
    } catch (error: any) {
        console.error('Error updating status:', error);
        return res.status(500).json({ error: error.message || 'Failed to update status' });
    }
}