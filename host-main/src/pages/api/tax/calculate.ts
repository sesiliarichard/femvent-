/**
 * Tax API - Calculate Tax
 * POST /api/tax/calculate
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import type { TaxCalculationRequest, TaxCalculationResult, TaxRate } from '@/types/tax';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<TaxCalculationResult | { error: string }>
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { amount, country, state, city }: TaxCalculationRequest = req.body;

        if (!amount || !country) {
            return res.status(400).json({ error: 'Amount and country are required' });
        }

        const taxRates = await fetchApplicableTaxRates(country, state, city);

        if (taxRates.length === 0) {
            return res.json({
                subtotal: amount,
                taxAmount: 0,
                total: amount,
                breakdown: [],
                appliedRates: [],
            });
        }

        let totalTaxRate = 0;
        const breakdown = taxRates.map((rate) => {
            totalTaxRate += rate.rate;
            const taxAmount = amount * rate.rate;

            return {
                jurisdiction: rate.name,
                rate: rate.rate,
                amount: Math.round(taxAmount * 100) / 100,
                type: rate.type,
            };
        });

        const taxAmount = Math.round(amount * totalTaxRate * 100) / 100;
        const total = Math.round((amount + taxAmount) * 100) / 100;

        return res.json({
            subtotal: amount,
            taxAmount,
            total,
            breakdown,
            appliedRates: taxRates,
        });
    } catch (error: any) {
        console.error('Error calculating tax:', error);
        return res.status(500).json({ error: error.message || 'Failed to calculate tax' });
    }
}

async function fetchApplicableTaxRates(
    country: string,
    state?: string,
    city?: string
): Promise<TaxRate[]> {
    let query = supabaseAdmin
        .from('tax_rates')
        .select('*')
        .eq('country', country)
        .eq('is_active', true);

    if (state) {
        query = query.eq('state', state);
    }

    const { data, error } = await query;
    if (error) throw error;

    const now = new Date();

    return (data ?? [])
        .filter((rate: any) => {
            const validFrom = new Date(rate.valid_from);
            const validUntil = rate.valid_until ? new Date(rate.valid_until) : null;
            return validFrom <= now && (!validUntil || validUntil >= now);
        })
        .map((rate: any) => ({
            id: rate.id,
            name: rate.name,
            country: rate.country,
            state: rate.state,
            rate: rate.rate,
            type: rate.type,
            validFrom: rate.valid_from,
            validUntil: rate.valid_until,
        })) as TaxRate[];
}