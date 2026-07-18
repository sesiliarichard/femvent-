import type { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/integrations/google-calendar/callback`
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        const { code, state } = req.query;

        if (!code) {
            return res.status(400).json({ error: 'Authorization code missing' });
        }

        const { tokens } = await oauth2Client.getToken(code as string);
        oauth2Client.setCredentials(tokens);

        const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
        const { data: userInfo } = await oauth2.userinfo.get();

        const { error } = await supabaseAdmin.from('oauth_connections').insert({
            user_id: state || null,
            provider: 'google',
            access_token: tokens.access_token!,
            refresh_token: tokens.refresh_token,
            expires_at: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
            scope: tokens.scope?.split(' ') || [],
            provider_user_id: userInfo.id!,
            provider_email: userInfo.email!,
            account_name: userInfo.name || userInfo.email!,
            status: 'active',
            metadata: { userInfo },
        });

        if (error) throw error;

        return res.redirect('/settings/integrations?success=google_calendar');
    } catch (error: any) {
        console.error('OAuth callback error:', error);
        return res.redirect('/settings/integrations?error=oauth_failed');
    }
}