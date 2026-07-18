import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'Template ID is required' });
    }

    if (req.method === 'GET') {
        try {
            const { data, error } = await supabaseAdmin
                .from('event_templates')
                .select('*')
                .eq('id', id)
                .maybeSingle();

            if (error) throw error;
            if (!data) return res.status(404).json({ error: 'Template not found' });

            return res.status(200).json(data);
        } catch (error: any) {
            console.error('Error fetching template:', error);
            return res.status(500).json({ error: error.message || 'Failed to fetch template' });
        }
    }

    if (req.method === 'PUT') {
        try {
            const { error } = await supabaseAdmin
                .from('event_templates')
                .update({ ...req.body, updated_at: new Date().toISOString() })
                .eq('id', id);

            if (error) throw error;

            return res.status(200).json({ success: true });
        } catch (error: any) {
            console.error('Error updating template:', error);
            return res.status(500).json({ error: error.message || 'Failed to update template' });
        }
    }

    if (req.method === 'DELETE') {
        try {
            const { error } = await supabaseAdmin.from('event_templates').delete().eq('id', id);
            if (error) throw error;

            return res.status(200).json({ success: true });
        } catch (error: any) {
            console.error('Error deleting template:', error);
            return res.status(500).json({ error: error.message || 'Failed to delete template' });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
}