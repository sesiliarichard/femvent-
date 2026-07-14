/**
 * OAuth API - Google Calendar Connection
 * GET /api/integrations/google-calendar/connect
 * 
 * Initiates OAuth flow for Google Calendar
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/integrations/google-calendar/callback`
);

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Generate authorization URL
    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: [
            'https://www.googleapis.com/auth/calendar',
            'https://www.googleapis.com/auth/calendar.events'
        ],
        state: req.query.userId as string || '', // Pass user context
    });

    return res.redirect(authUrl);
}
