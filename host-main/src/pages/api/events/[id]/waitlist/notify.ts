import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { sendEmail } from '@/lib/email';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { eventId } = req.query;
        const { count = 1 } = req.body;

        if (!eventId || typeof eventId !== 'string') {
            return res.status(400).json({ error: 'Event ID is required' });
        }

        const { data: eventData, error: eventError } = await supabaseAdmin
            .from('events')
            .select('title')
            .eq('id', eventId)
            .single();

        if (eventError || !eventData) {
            return res.status(404).json({ error: 'Event not found' });
        }

        const { data: entries, error: waitlistError } = await supabaseAdmin
            .from('waitlist')
            .select('*')
            .eq('event_id', eventId)
            .eq('notified', false)
            .eq('converted_to_ticket', false)
            .order('priority', { ascending: false })
            .order('added_at', { ascending: true })
            .limit(count);

        if (waitlistError) throw waitlistError;

        if (!entries || entries.length === 0) {
            return res.status(200).json({
                success: true,
                notified: 0,
                message: 'No one on waitlist to notify',
            });
        }

        const notificationPromises = entries.map(async (entry) => {
            try {
                await supabaseAdmin
                    .from('waitlist')
                    .update({ notified: true, notified_at: new Date().toISOString() })
                    .eq('id', entry.id);

                const claimUrl = `${process.env.APP_URL || 'http://localhost:3000'}/events/${eventId}/waitlist/claim?entryId=${entry.id}`;

                await sendEmail({
                    to: entry.user_email,
                    subject: `🎉 Spot Available: ${eventData.title}`,
                    body: `Hi ${entry.user_name},\n\nGood news! A spot just opened up for ${eventData.title}.\n\nClaim your spot now: ${claimUrl}\n\nThis link expires in 24 hours.\n\nBest regards,\nHostdweb Team`,
                    html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #10b981;">🎉 Spot Available!</h2>
              <p>Hi ${entry.user_name},</p>
              <p>Good news! A spot just opened up for <strong>${eventData.title}</strong>.</p>
              <a href="${claimUrl}" style="display: inline-block; background: linear-gradient(to right, #10b981, #059669); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 20px 0;">
                Claim Your Spot Now
              </a>
              <p style="color: #ef4444; font-size: 14px;"><strong>⏰ This link expires in 24 hours.</strong></p>
              <p>Best regards,<br>Hostdweb Team</p>
            </div>
          `,
                });

                console.log(`✅ Notified ${entry.user_name} about available spot`);
                return { success: true, email: entry.user_email };
            } catch (error) {
                console.error(`Failed to notify ${entry.user_email}:`, error);
                return { success: false, email: entry.user_email, error };
            }
        });

        const results = await Promise.all(notificationPromises);
        const successCount = results.filter((r) => r.success).length;

        return res.status(200).json({
            success: true,
            notified: successCount,
            total: entries.length,
            results,
        });
    } catch (error: any) {
        console.error('Error notifying waitlist:', error);
        return res.status(500).json({ error: error.message || 'Failed to notify waitlist' });
    }
}