import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { eventId } = req.query;
        const { userId, userEmail, userName } = req.body;

        if (!eventId || typeof eventId !== 'string') {
            return res.status(400).json({ error: 'Event ID is required' });
        }

        if (!userId || !userEmail || !userName) {
            return res.status(400).json({ error: 'User information is required' });
        }

        const { data, error } = await supabaseAdmin
            .rpc('join_waitlist', {
                p_event_id: eventId,
                p_user_id: userId,
                p_email: userEmail,
                p_name: userName,
            })
            .single();

        if (error) throw error;

        const result = data as { entry_id: string; entry_position: number; already_joined: boolean };

        if (result.already_joined) {
            return res.status(400).json({
                error: 'Already on waitlist',
                position: result.entry_position,
            });
        }

        console.log(`✅ User ${userName} added to waitlist for event ${eventId} at position ${result.entry_position}`);

        return res.status(200).json({
            success: true,
            entryId: result.entry_id,
            position: result.entry_position,
            message: 'Successfully joined waitlist',
        });
    } catch (error: any) {
        console.error('Error joining waitlist:', error);
        return res.status(500).json({ error: error.message || 'Failed to join waitlist' });
    }
}