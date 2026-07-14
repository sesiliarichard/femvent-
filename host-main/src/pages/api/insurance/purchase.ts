/**
 * Event Insurance API - Purchase Policy
 * POST /api/insurance/purchase
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { quoteId, userId } = req.body;

        if (!quoteId || !userId || !req.body.paymentId) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const { data: quote, error: quoteError } = await supabaseAdmin
            .from('insurance_quotes')
            .select('*')
            .eq('id', quoteId)
            .single();

        if (quoteError || !quote) {
            return res.status(404).json({ error: 'Quote not found' });
        }

        if (new Date(quote.valid_until) < new Date()) {
            return res.status(400).json({ error: 'Quote has expired' });
        }

        const policyNumber = `POL-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        const now = new Date().toISOString();
        const effectiveUntil = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

        const { data: policy, error: policyError } = await supabaseAdmin
            .from('event_insurance')
            .insert({
                event_id: quote.event_id,
                user_id: userId,
                policy_number: policyNumber,
                provider: 'event_helper',
                coverage_type: quote.coverage_type,
                coverage_amount: quote.coverage_amount,
                premium: quote.premium,
                currency: 'USD',
                effective_from: now,
                effective_until: effectiveUntil,
                terms: `Event insurance policy covering ${quote.coverage_type}. Coverage amount: $${quote.coverage_amount}. Deductible: $${quote.deductible}.`,
                status: 'active',
                claim_filed: false,
                purchased_at: now,
            })
            .select('id')
            .single();

        if (policyError) throw policyError;

        // TODO: Generate PDF policy document
        // TODO: Send confirmation email

        return res.json({
            success: true,
            policyId: policy.id,
            policyNumber,
            message: 'Insurance policy purchased successfully',
        });
    } catch (error: any) {
        console.error('Error purchasing insurance:', error);
        return res.status(500).json({ error: error.message });
    }
}