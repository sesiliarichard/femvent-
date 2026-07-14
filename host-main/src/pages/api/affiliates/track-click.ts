import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const {
            referralCode,
            eventId,
            sessionId,
            landingPage,
            referrer,
            utmSource,
            utmMedium,
            utmCampaign,
        } = req.body;

        if (!referralCode || !sessionId || !landingPage) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const { data: affiliate, error: affiliateError } = await supabase
            .from('affiliates')
            .select('*')
            .eq('code', referralCode.toUpperCase())
            .eq('status', 'active')
            .limit(1)
            .maybeSingle();

        if (affiliateError) throw affiliateError;
        if (!affiliate) {
            return res.status(404).json({ error: 'Invalid referral code' });
        }

        // Check if affiliate can promote this event
        if (eventId && affiliate.event_ids?.length > 0) {
            if (!affiliate.event_ids.includes(eventId)) {
                return res.status(403).json({ error: 'Affiliate not authorized for this event' });
            }
        }

        const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
        const userAgent = req.headers['user-agent'] || 'unknown';

        const { data: click, error: clickError } = await supabase
            .from('affiliate_clicks')
            .insert({
                affiliate_id: affiliate.id,
                referral_code: referralCode.toUpperCase(),
                event_id: eventId,
                session_id: sessionId,
                ip_address: ipAddress.toString(),
                user_agent: userAgent,
                referrer,
                landing_page: landingPage,
                utm_source: utmSource,
                utm_medium: utmMedium,
                utm_campaign: utmCampaign,
                converted: false,
            })
            .select()
            .single();

        if (clickError) throw clickError;

        const { error: updateError } = await supabase
            .from('affiliates')
            .update({
                stats: { ...affiliate.stats, totalClicks: (affiliate.stats?.totalClicks || 0) + 1 },
                updated_at: new Date().toISOString(),
            })
            .eq('id', affiliate.id);

        if (updateError) throw updateError;

        return res.status(200).json({
            success: true,
            clickId: click.id,
            message: 'Click tracked successfully'
        });

    } catch (error: any) {
        console.error('Error tracking affiliate click:', error);
        return res.status(500).json({ error: error.message || 'Failed to track click' });
    }
}