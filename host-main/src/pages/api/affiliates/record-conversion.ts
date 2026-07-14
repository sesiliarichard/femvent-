import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const {
            sessionId,
            orderId,
            ticketId,
            eventId,
            customerId,
            orderTotal,
            currency = 'USD'
        } = req.body;

        if (!sessionId || !orderId || !ticketId || !orderTotal) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data: click, error: clickError } = await supabase
            .from('affiliate_clicks')
            .select('*')
            .eq('session_id', sessionId)
            .eq('converted', false)
            .gte('clicked_at', thirtyDaysAgo.toISOString())
            .limit(1)
            .maybeSingle();

        if (clickError) throw clickError;

        if (!click) {
            return res.status(200).json({
                success: true,
                affiliate: false,
                message: 'No affiliate attribution'
            });
        }

        const { data: affiliate, error: affiliateError } = await supabase
            .from('affiliates')
            .select('*')
            .eq('id', click.affiliate_id)
            .single();

        if (affiliateError || !affiliate) {
            return res.status(404).json({ error: 'Affiliate not found' });
        }

        let commissionAmount = 0;
        if (affiliate.commission_type === 'percentage') {
            commissionAmount = orderTotal * affiliate.commission_rate;
        } else {
            commissionAmount = affiliate.commission_rate;
        }
        commissionAmount = Math.round(commissionAmount * 100) / 100;

        const { error: updateClickError } = await supabase
            .from('affiliate_clicks')
            .update({
                converted: true,
                ticket_id: ticketId,
                order_id: orderId,
                revenue: orderTotal,
                commission_earned: commissionAmount,
                converted_at: new Date().toISOString(),
            })
            .eq('id', click.id);

        if (updateClickError) throw updateClickError;

        const { data: commission, error: commissionError } = await supabase
            .from('commissions')
            .insert({
                affiliate_id: click.affiliate_id,
                click_id: click.id,
                order_id: orderId,
                ticket_id: ticketId,
                event_id: eventId,
                customer_id: customerId,
                order_total: orderTotal,
                commission_rate: affiliate.commission_rate,
                commission_amount: commissionAmount,
                currency,
                status: 'pending',
            })
            .select()
            .single();

        if (commissionError) throw commissionError;

        const newConversions = (affiliate.stats?.totalConversions || 0) + 1;
        const newRevenue = (affiliate.stats?.totalRevenue || 0) + orderTotal;
        const newCommission = (affiliate.stats?.totalCommission || 0) + commissionAmount;
        const totalClicks = affiliate.stats?.totalClicks || 1;
        const conversionRate = (newConversions / totalClicks) * 100;
        const averageOrderValue = newRevenue / newConversions;

        const { error: updateAffiliateError } = await supabase
            .from('affiliates')
            .update({
                stats: {
                    ...affiliate.stats,
                    totalConversions: newConversions,
                    totalRevenue: newRevenue,
                    totalCommission: newCommission,
                    conversionRate: Math.round(conversionRate * 100) / 100,
                    averageOrderValue: Math.round(averageOrderValue * 100) / 100,
                },
                updated_at: new Date().toISOString(),
            })
            .eq('id', click.affiliate_id);

        if (updateAffiliateError) throw updateAffiliateError;

        return res.status(200).json({
            success: true,
            affiliate: true,
            affiliateId: click.affiliate_id,
            commissionId: commission.id,
            commissionAmount,
            message: 'Conversion recorded successfully'
        });

    } catch (error: any) {
        console.error('Error recording conversion:', error);
        return res.status(500).json({ error: error.message || 'Failed to record conversion' });
    }
}