import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'DELETE') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { id } = req.query;

        if (!id || typeof id !== 'string') {
            return res.status(400).json({ error: 'Discount code ID is required' });
        }

        const { data: existing, error: fetchError } = await supabase
            .from('discount_codes')
            .select('id')
            .eq('id', id)
            .maybeSingle();

        if (fetchError) throw fetchError;
        if (!existing) {
            return res.status(404).json({ error: 'Discount code not found' });
        }

        const { error: deleteError } = await supabase.from('discount_codes').delete().eq('id', id);
        if (deleteError) throw deleteError;

        return res.status(200).json({
            success: true,
            message: 'Discount code deleted successfully'
        });
    } catch (error: any) {
        console.error('Error deleting discount code:', error);
        return res.status(500).json({ error: error.message || 'Failed to delete discount code' });
    }
}