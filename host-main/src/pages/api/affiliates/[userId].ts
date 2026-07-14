import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { userId } = req.query;

        const { data, error } = await supabase
            .from('affiliates')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();

        if (error) throw error;
        if (!data) {
            return res.status(404).json({ error: 'Affiliate not found' });
        }

        return res.json({ success: true, affiliate: data });
    } catch (error: any) {
        console.error('Error fetching affiliate:', error);
        return res.status(500).json({ error: error.message });
    }
}