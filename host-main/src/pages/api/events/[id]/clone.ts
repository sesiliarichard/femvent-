import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { id } = req.query;
        const eventId = id as string;
        const { newTitle, editBeforePublish, publishImmediately } = req.body;

        console.log('Clone request:', { eventId, newTitle, editBeforePublish, publishImmediately });

        if (!eventId || typeof eventId !== 'string') {
            return res.status(400).json({ error: 'Event ID is required' });
        }
        if (!newTitle || typeof newTitle !== 'string') {
            return res.status(400).json({ error: 'New event title is required' });
        }

        console.log('Fetching event:', eventId);
        const { data: originalEvent, error: fetchError } = await supabaseAdmin
            .from('events')
            .select('*')
            .eq('id', eventId)
            .single();

        if (fetchError || !originalEvent) {
            console.error('Event not found:', eventId);
            return res.status(404).json({ error: 'Event not found' });
        }

        console.log('Original event fetched:', originalEvent.title);

        const now = new Date().toISOString();
        const { id: _omit, ...rest } = originalEvent;

        const clonedEventData = {
            ...rest,
            title: newTitle.trim(),
            created_at: now,
            updated_at: now,
            status: editBeforePublish ? 'draft' : publishImmediately ? 'published' : 'draft',
            published: publishImmediately || false,
            view_count: 0,
            tickets_sold: 0,
            total_revenue: 0,
            current_attendees: 0,
            cloned_from: eventId,
            cloned_at: now,
            analytics: {},
            customization: originalEvent.customization || {},
        };

        console.log('Creating cloned event...');
        const { data: newEvent, error: insertError } = await supabaseAdmin
            .from('events')
            .insert(clonedEventData)
            .select('id')
            .single();

        if (insertError) throw insertError;

        console.log(`✅ Event cloned successfully: ${eventId} → ${newEvent.id}`);

        return res.status(200).json({
            success: true,
            newEventId: newEvent.id,
            message: editBeforePublish
                ? 'Event cloned as draft. You can edit it before publishing.'
                : 'Event cloned successfully',
        });
    } catch (error: any) {
        console.error('Error cloning event - Full error:', error);
        console.error('Error message:', error.message);
        return res.status(500).json({
            error: error.message || 'Failed to clone event',
            details: error.toString(),
        });
    }
}