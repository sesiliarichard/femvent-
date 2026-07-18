/**
 * Event Insurance API - Get Quote
 * POST /api/insurance/get-quote
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { eventId, coverageType, eventCost, attendeeCount } = req.body;

        if (!eventId || !coverageType || !eventCost || !attendeeCount) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        let baseRate = 0;
        let deductible = 0;

        switch (coverageType) {
            case 'cancellation':
                baseRate = 0.05;
                deductible = eventCost * 0.1;
                break;
            case 'liability':
                baseRate = 0.03;
                deductible = 500;
                break;
            case 'weather':
                baseRate = 0.04;
                deductible = eventCost * 0.15;
                break;
            case 'comprehensive':
                baseRate = 0.08;
                deductible = eventCost * 0.1;
                break;
            default:
                return res.status(400).json({ error: 'Invalid coverage type' });
        }

        if (attendeeCount > 500) {
            baseRate *= 1.3;
        } else if (attendeeCount > 200) {
            baseRate *= 1.15;
        }

        const premium = Math.round(eventCost * baseRate * 100) / 100;
        const coverageAmount = eventCost;
        const validUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

        const { data: quote, error } = await supabaseAdmin
            .from('insurance_quotes')
            .insert({
                event_id: eventId,
                coverage_type: coverageType,
                event_cost: eventCost,
                attendee_count: attendeeCount,
                premium,
                coverage_amount: coverageAmount,
                deductible,
                valid_until: validUntil,
            })
            .select('id')
            .single();

        if (error) throw error;

        return res.json({
            success: true,
            quoteId: quote.id,
            quote: {
                premium,
                coverageAmount,
                deductible,
                coverageType,
                validUntil,
            },
        });
    } catch (error: any) {
        console.error('Error calculating insurance quote:', error);
        return res.status(500).json({ error: error.message });
    }
}