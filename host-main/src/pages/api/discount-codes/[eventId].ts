import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { eventId } = req.query;

        if (!eventId || typeof eventId !== 'string') {
            return res.status(400).json({ error: 'Event ID is required' });
        }

        const { data, error } = await supabase
            .from('discount_codes')
            .select('*')
            .eq('event_id', eventId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return res.status(200).json({
            success: true,
            discountCodes: data || [],
            count: data?.length || 0
        });
    } catch (error: any) {
        console.error('Error fetching discount codes:', error);
        return res.status(500).json({ error: error.message || 'Failed to fetch discount codes' });
    }
}