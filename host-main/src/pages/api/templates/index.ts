import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'GET') {
        try {
            const { hostId } = req.query;

            if (!hostId || typeof hostId !== 'string') {
                return res.status(400).json({ error: 'Host ID is required' });
            }

            const { data, error } = await supabaseAdmin
                .from('event_templates')
                .select('*')
                .eq('host_id', hostId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            return res.status(200).json(data ?? []);
        } catch (error: any) {
            console.error('Error fetching templates:', error);
            return res.status(500).json({ error: error.message || 'Failed to fetch templates' });
        }
    }

    if (req.method === 'POST') {
        try {
            const templateData = req.body;

            if (!templateData.hostId) {
                return res.status(400).json({ error: 'Host ID is required' });
            }

            const { data: template, error } = await supabaseAdmin
                .from('event_templates')
                .insert({
                    host_id: templateData.hostId,
                    usage_count: 0,
                    data: templateData,
                })
                .select()
                .single();

            if (error) throw error;

            return res.status(201).json(template);
        } catch (error: any) {
            console.error('Error creating template:', error);
            return res.status(500).json({ error: error.message || 'Failed to create template' });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
}