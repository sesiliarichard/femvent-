import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ valid: false, error: 'Method not allowed' });
    }

    try {
        const { code, eventId, totalPrice, ticketType } = req.body;

        if (!code || !eventId || totalPrice == null) {
            return res.status(400).json({ valid: false, error: 'Missing required fields' });
        }

        const normalizedCode = code.toUpperCase().trim();

        const { data: discount, error } = await supabase
            .from('discount_codes')
            .select('*')
            .eq('event_id', eventId)
            .eq('code', normalizedCode)
            .maybeSingle();

        if (error) throw error;

        if (!discount) {
            return res.json({ valid: false, error: 'Invalid discount code' });
        }

        if (discount.status !== 'active') {
            return res.json({ valid: false, error: 'This discount code is no longer active' });
        }

        const now = new Date();
        if (discount.start_date && new Date(discount.start_date) > now) {
            return res.json({ valid: false, error: 'This discount code is not yet valid' });
        }
        if (discount.end_date && new Date(discount.end_date) < now) {
            return res.json({ valid: false, error: 'This discount code has expired' });
        }

        if (discount.max_uses !== null && discount.current_uses >= discount.max_uses) {
            return res.json({ valid: false, error: 'This discount code has reached its usage limit' });
        }

        if (discount.minimum_purchase && totalPrice < discount.minimum_purchase) {
            return res.json({
                valid: false,
                error: `Minimum purchase of $${discount.minimum_purchase} required`
            });
        }

        if (discount.applicable_ticket_types && discount.applicable_ticket_types.length > 0) {
            if (ticketType && !discount.applicable_ticket_types.includes(ticketType)) {
                return res.json({
                    valid: false,
                    error: 'This discount code is not applicable to this ticket type'
                });
            }
        }

        let discountAmount = 0;
        let finalPrice = totalPrice;

        if (discount.type === 'percentage') {
            discountAmount = (totalPrice * discount.value) / 100;
            finalPrice = totalPrice - discountAmount;
        } else if (discount.type === 'fixed') {
            discountAmount = Math.min(discount.value, totalPrice);
            finalPrice = totalPrice - discountAmount;
        } else if (discount.type === 'free') {
            discountAmount = totalPrice;
            finalPrice = 0;
        }

        finalPrice = Math.max(0, finalPrice);
        discountAmount = totalPrice - finalPrice;

        return res.json({
            valid: true,
            discount: {
                code: discount.code,
                type: discount.type,
                value: discount.value,
                discountAmount: Math.round(discountAmount * 100) / 100,
                finalPrice: Math.round(finalPrice * 100) / 100,
            }
        });
    } catch (error: any) {
        console.error('Error validating discount code:', error);
        return res.status(500).json({ valid: false, error: 'Failed to validate discount code' });
    }
}