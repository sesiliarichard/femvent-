import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { eventId, name, trigger, steps, status = 'draft', stats, settings } = req.body;

        if (!eventId || !name || !trigger || !steps) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const { data: workflow, error } = await supabaseAdmin
            .from('email_workflows')
            .insert({
                event_id: eventId,
                name,
                description: '',
                trigger,
                steps,
                status,
                stats: stats || {
                    sent: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0, unsubscribed: 0,
                },
                settings: settings || { timezone: 'UTC', skipWeekends: false },
                created_by: null, // TODO: pull from auth session
            })
            .select('id')
            .single();

        if (error) throw error;

        return res.status(201).json({
            success: true,
            workflowId: workflow.id,
            message: 'Workflow created successfully',
        });
    } catch (error: any) {
        console.error('Error creating workflow:', error);
        return res.status(500).json({ error: error.message });
    }
}