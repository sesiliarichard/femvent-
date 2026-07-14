import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { testId, userId, sessionId } = req.body;

        if (!testId || !sessionId) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const { data: existing, error: existingError } = await supabase
            .from('ab_test_assignments')
            .select('*')
            .eq('test_id', testId)
            .eq('session_id', sessionId)
            .maybeSingle();

        if (existingError) throw existingError;

        if (existing) {
            return res.json({ success: true, variantId: existing.variant_id, cached: true });
        }

        const { data: test, error: testError } = await supabase
            .from('ab_tests')
            .select('*')
            .eq('id', testId)
            .single();

        if (testError || !test) {
            return res.status(404).json({ error: 'Test not found' });
        }

        const random = Math.random() * 100;
        let cumulative = 0;
        let assignedVariantId = test.variants[0].id;

        for (const [variantId, percentage] of Object.entries(test.traffic_allocation)) {
            cumulative += Number(percentage);
            if (random <= cumulative) {
                assignedVariantId = variantId;
                break;
            }
        }

        const { error: insertError } = await supabase.from('ab_test_assignments').insert({
            test_id: testId,
            variant_id: assignedVariantId,
            user_id: userId || null,
            session_id: sessionId,
            converted: false,
            page_views: 0,
            time_on_page: 0,
            clicked_cta: false,
            bounced: false,
        });

        if (insertError) throw insertError;

        return res.json({ success: true, variantId: assignedVariantId, cached: false });
    } catch (error: any) {
        console.error('Error assigning variant:', error);
        return res.status(500).json({ error: error.message });
    }
}