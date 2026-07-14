import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const {
            eventId,
            name,
            hypothesis,
            testType,
            variants,
            trafficAllocation,
            goalMetric,
            confidenceLevel = 95,
            minimumSampleSize = 100
        } = req.body;

        if (!eventId || !name || !variants || !trafficAllocation) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const { data, error } = await supabase
            .from('ab_tests')
            .insert({
                event_id: eventId,
                name,
                description: '',
                hypothesis: hypothesis || '',
                test_type: testType || 'multi_variant',
                variants,
                traffic_allocation: trafficAllocation,
                goal_metric: goalMetric || 'ticket_purchase',
                confidence_level: confidenceLevel,
                minimum_sample_size: minimumSampleSize,
                status: 'running',
            })
            .select()
            .single();

        if (error) throw error;

        return res.status(201).json({
            success: true,
            testId: data.id,
            message: 'A/B test created and started'
        });
    } catch (error: any) {
        console.error('Error creating A/B test:', error);
        return res.status(500).json({ error: error.message });
    }
}