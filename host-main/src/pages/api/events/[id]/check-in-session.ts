import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { eventId } = req.query;
        const { ticketId, sessionId, checkedInBy } = req.body;

        if (!ticketId || !sessionId) {
            return res.status(400).json({ error: 'Ticket ID and Session ID are required' });
        }

        const { data, error } = await supabaseAdmin
            .rpc('check_in_ticket', {
                p_ticket_id: ticketId,
                p_event_id: eventId,
                p_session_id: sessionId,
                p_checked_in_by: checkedInBy || 'system',
            })
            .single();

        if (error) {
            if (error.message?.includes('ticket_not_found')) {
                return res.status(404).json({ error: 'Ticket not found' });
            }
            throw error;
        }

        const result = data as { already_checked_in: boolean; wrong_event: boolean };

        if (result.wrong_event) {
            return res.status(403).json({ error: 'Ticket does not belong to this event' });
        }
        if (result.already_checked_in) {
            return res.status(400).json({ error: 'Already checked in for this session' });
        }

        console.log(`✅ Checked in ticket ${ticketId} for session ${sessionId}`);

        return res.status(200).json({
            success: true,
            message: 'Checked in successfully',
            sessionId,
            ticketId,
        });
    } catch (error: any) {
        console.error('Error checking in:', error);
        return res.status(500).json({ error: error.message || 'Failed to check in' });
    }
}