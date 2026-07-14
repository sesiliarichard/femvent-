import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const {
            eventId,
            code,
            type,
            value,
            maxUses,
            startDate,
            endDate,
            minimumPurchase,
            applicableTicketTypes,
            createdBy,
            affiliateId,
            description
        } = req.body;

        if (!eventId || !code || !type || value == null || !createdBy) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const normalizedCode = code.toUpperCase().trim();

        const { data: existing, error: existingError } = await supabase
            .from('discount_codes')
            .select('id')
            .eq('event_id', eventId)
            .eq('code', normalizedCode)
            .maybeSingle();

        if (existingError) throw existingError;
        if (existing) {
            return res.status(400).json({ error: 'This discount code already exists for this event' });
        }

        const { data, error } = await supabase
            .from('discount_codes')
            .insert({
                event_id: eventId,
                code: normalizedCode,
                type,
                value: Number(value),
                max_uses: maxUses ? Number(maxUses) : null,
                current_uses: 0,
                start_date: startDate ? new Date(startDate).toISOString() : new Date().toISOString(),
                end_date: new Date(endDate).toISOString(),
                minimum_purchase: minimumPurchase ? Number(minimumPurchase) : null,
                applicable_ticket_types: applicableTicketTypes || null,
                status: 'active',
                created_by: createdBy,
                affiliate_id: affiliateId || null,
                description: description || null,
            })
            .select()
            .single();

        if (error) throw error;

        return res.status(201).json({
            success: true,
            discountCodeId: data.id,
            code: normalizedCode
        });
    } catch (error: any) {
        console.error('Error creating discount code:', error);
        return res.status(500).json({ error: error.message || 'Failed to create discount code' });
    }
}