import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';
import axios from 'axios';
import jwt from 'jsonwebtoken';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { eventId, title, description, scheduledStart, duration, settings = {} } = req.body;

        if (!eventId || !title || !scheduledStart || !duration) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const zoomToken = generateZoomJWT();

        const zoomResponse = await axios.post(
            'https://api.zoom.us/v2/users/me/meetings',
            {
                topic: title,
                type: 2,
                start_time: new Date(scheduledStart).toISOString(),
                duration,
                timezone: 'UTC',
                agenda: description,
                settings: {
                    host_video: true,
                    participant_video: true,
                    join_before_host: false,
                    mute_upon_entry: settings.muteOnEntry !== false,
                    waiting_room: settings.enableWaitingRoom !== false,
                    auto_recording: settings.enableRecording ? 'cloud' : 'none',
                    allow_multiple_devices: true,
                    registrants_email_notification: false,
                    meeting_authentication: false,
                },
            },
            { headers: { Authorization: `Bearer ${zoomToken}`, 'Content-Type': 'application/json' } }
        );

        const meeting = zoomResponse.data;
        const scheduledEnd = new Date(new Date(scheduledStart).getTime() + duration * 60000).toISOString();

        const { data: virtualEvent, error } = await supabaseAdmin
            .from('virtual_events')
            .insert({
                event_id: eventId,
                platform: 'zoom',
                platform_meeting_id: meeting.id.toString(),
                join_url: meeting.join_url,
                start_url: meeting.start_url,
                password: meeting.password,
                settings: {
                    enableWaitingRoom: settings.enableWaitingRoom !== false,
                    enableRecording: settings.enableRecording || false,
                    enableChat: settings.enableChat !== false,
                    enableQnA: settings.enableQnA || false,
                    enablePolls: settings.enablePolls || false,
                    enableBreakoutRooms: settings.enableBreakoutRooms || false,
                    muteOnEntry: settings.muteOnEntry !== false,
                    requireRegistration: false,
                    maxParticipants: 100,
                },
                access_type: 'ticket_holders',
                recording_available: false,
                status: 'scheduled',
                zoom_data: {
                    meetingNumber: meeting.id.toString(),
                    timezone: meeting.timezone,
                    duration,
                    hostEmail: meeting.host_email,
                },
                scheduled_start: new Date(scheduledStart).toISOString(),
                scheduled_end: scheduledEnd,
            })
            .select('id')
            .single();

        if (error) throw error;

        return res.status(201).json({
            success: true,
            virtualEventId: virtualEvent.id,
            meetingId: meeting.id,
            joinUrl: meeting.join_url,
            startUrl: meeting.start_url,
            password: meeting.password,
            message: 'Zoom meeting created successfully',
        });
    } catch (error: any) {
        console.error('Error creating Zoom meeting:', error);
        if (error.response) {
            return res.status(error.response.status).json({
                error: error.response.data.message || 'Zoom API error',
            });
        }
        return res.status(500).json({ error: error.message || 'Failed to create Zoom meeting' });
    }
}

function generateZoomJWT(): string {
    const apiKey = process.env.ZOOM_API_KEY;
    const apiSecret = process.env.ZOOM_API_SECRET;

    if (!apiKey || !apiSecret) {
        throw new Error('Zoom API credentials not configured');
    }

    return jwt.sign({ iss: apiKey, exp: Date.now() + 60000 }, apiSecret);
}