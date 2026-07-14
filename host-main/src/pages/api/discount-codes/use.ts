import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const {
            discountCodeId,
            code,
            userId,
            eventId,
            ticketId,
            originalPrice,
            discountAmount,
            finalPrice
        } = req.body;

        if (!discountCodeId || !userId || !eventId || !ticketId) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const { error: usageError } = await supabase.from('discount_usage').insert({
            discount_code_id: discountCodeId,
            code,
            user_id: userId,
            event_id: eventId,
            ticket_id: ticketId,
            original_price: Number(originalPrice),
            discount_amount: Number(discountAmount),
            final_price: Number(finalPrice),
        });

        if (usageError) throw usageError;

        const { data: current, error: fetchError } = await supabase
            .from('discount_codes')
            .select('current_uses')
            .eq('id', discountCodeId)
            .single();

        if (fetchError) throw fetchError;

        const { error: updateError } = await supabase
            .from('discount_codes')
            .update({
                current_uses: (current?.current_uses || 0) + 1,
                updated_at: new Date().toISOString(),
            })
            .eq('id', discountCodeId);

        if (updateError) throw updateError;

        return res.status(200).json({
            success: true,
            message: 'Discount code usage recorded'
        });
    } catch (error: any) {
        console.error('Error recording discount usage:', error);
        return res.status(500).json({ error: error.message || 'Failed to record usage' });
    }
}