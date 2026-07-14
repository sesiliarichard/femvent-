import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://yourplatform.com';

        const { data: events, error } = await supabaseAdmin
            .from('events')
            .select('id, updated_at, created_at')
            .eq('is_published', true)
            .eq('is_deleted', false);

        if (error) throw error;

        let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
        sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

        sitemap += '  <url>\n';
        sitemap += `    <loc>${baseUrl}</loc>\n`;
        sitemap += '    <changefreq>daily</changefreq>\n';
        sitemap += '    <priority>1.0</priority>\n';
        sitemap += '  </url>\n';

        sitemap += '  <url>\n';
        sitemap += `    <loc>${baseUrl}/events</loc>\n`;
        sitemap += '    <changefreq>hourly</changefreq>\n';
        sitemap += '    <priority>0.9</priority>\n';
        sitemap += '  </url>\n';

        (events ?? []).forEach((event) => {
            const eventUrl = `${baseUrl}/events/${event.id}`;
            const lastMod = (event.updated_at || event.created_at)?.split('T')[0];

            sitemap += '  <url>\n';
            sitemap += `    <loc>${eventUrl}</loc>\n`;
            sitemap += `    <lastmod>${lastMod}</lastmod>\n`;
            sitemap += '    <changefreq>weekly</changefreq>\n';
            sitemap += '    <priority>0.8</priority>\n';
            sitemap += '  </url>\n';
        });

        sitemap += '</urlset>';

        res.setHeader('Content-Type', 'application/xml');
        res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');

        return res.status(200).send(sitemap);
    } catch (error: any) {
        console.error('Error generating sitemap:', error);
        return res.status(500).json({ error: error.message || 'Failed to generate sitemap' });
    }
}