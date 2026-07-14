import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { eventId } = req.query;
        const { attendeeIds, subject, body } = req.body;

        if (!eventId || typeof eventId !== 'string') {
            return res.status(400).json({ error: 'Event ID is required' });
        }
        if (!attendeeIds || !Array.isArray(attendeeIds) || attendeeIds.length === 0) {
            return res.status(400).json({ error: 'Attendee IDs are required' });
        }
        if (!subject || !body) {
            return res.status(400).json({ error: 'Subject and body are required' });
        }

        const { data: eventData, error: eventError } = await supabaseAdmin
            .from('events')
            .select('title, start_at')
            .eq('id', eventId)
            .single();

        if (eventError || !eventData) {
            return res.status(404).json({ error: 'Event not found' });
        }

        const { data: tickets, error: ticketsError } = await supabaseAdmin
            .from('tickets')
            .select('id, attendee_name, attendee_email')
            .in('id', attendeeIds);

        if (ticketsError) throw ticketsError;

        const dateStr = eventData.start_at ? new Date(eventData.start_at).toLocaleDateString() : '';

        const results = (tickets ?? []).map((attendee) => {
            const personalizedSubject = subject
                .replace(/{{name}}/g, attendee.attendee_name || '')
                .replace(/{{event}}/g, eventData.title || '')
                .replace(/{{date}}/g, dateStr);

            const personalizedBody = body
                .replace(/{{name}}/g, attendee.attendee_name || '')
                .replace(/{{event}}/g, eventData.title || '')
                .replace(/{{date}}/g, dateStr);

            // TODO: Integrate email service (SendGrid, Nodemailer, etc.)
            console.log(`========== EMAIL PREVIEW ==========`);
            console.log(`To: ${attendee.attendee_email}`);
            console.log(`Subject: ${personalizedSubject}`);
            console.log(`Body: ${personalizedBody}`);
            console.log(`===================================`);
            return { success: true, email: attendee.attendee_email };
        });

        const successCount = results.filter((r) => r?.success).length;

        return res.status(200).json({
            success: true,
            total: attendeeIds.length,
            sent: successCount,
            failed: attendeeIds.length - successCount,
            results,
        });
    } catch (error: any) {
        console.error('Error sending bulk emails:', error);
        return res.status(500).json({ error: error.message || 'Failed to send emails' });
    }
}