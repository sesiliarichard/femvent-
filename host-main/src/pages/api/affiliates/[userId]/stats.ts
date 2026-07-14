import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { userId } = req.query;

        const { data: affiliate, error: affiliateError } = await supabase
            .from('affiliates')
            .select('id')
            .eq('user_id', userId)
            .maybeSingle();

        if (affiliateError) throw affiliateError;
        if (!affiliate) {
            return res.status(404).json({ error: 'Affiliate not found' });
        }

        const { data: recentCommissions, error: commissionsError } = await supabase
            .from('commissions')
            .select('*')
            .eq('affiliate_id', affiliate.id)
            .order('earned_at', { ascending: false })
            .limit(20);

        if (commissionsError) throw commissionsError;

        return res.json({ success: true, recentCommissions: recentCommissions || [] });
    } catch (error: any) {
        console.error('Error fetching affiliate stats:', error);
        return res.status(500).json({ error: error.message });
    }
}