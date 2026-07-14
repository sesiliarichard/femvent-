/**
 * FEATURE 10: Virtual Event Hosting (Zoom Integration)
 * 
 * Step 10.1: Type Definitions
 * ===========================
 * 
 * This feature enables:
 * - Virtual/hybrid event creation
 * - Zoom meeting integration
 * - Automatic meeting link generation
 * - Attendee registration → meeting assignment
 * - Waiting room management
 * - Recording access control
 * - Q&A and polls during session
 */

type Timestamp = string; // ISO date string, matches Supabase/Postgres timestamps

// Virtual event configuration
export interface VirtualEvent {
    id: string;
    eventId: string;

    // Platform
    platform: 'zoom' | 'google_meet' | 'teams' | 'custom';
    platformMeetingId: string; // Zoom meeting ID

    // Meeting details
    joinUrl: string; // Public join URL
    startUrl: string; // Host start URL
    password?: string;

    // Settings
    settings: {
        enableWaitingRoom: boolean;
        enableRecording: boolean;
        enableChat: boolean;
        enableQnA: boolean;
        enablePolls: boolean;
        enableBreakoutRooms: boolean;
        muteOnEntry: boolean;
        requireRegistration: boolean;
        maxParticipants: number;
    };

    // Access control
    accessType: 'public' | 'ticket_holders' | 'invite_only';
    allowedTicketTypes?: string[]; // If ticket_holders

    // Recording
    recordingUrl?: string;
    recordingPassword?: string;
    recordingAvailable: boolean;
    recordingExpiresAt?: Timestamp;

    // Analytics
    stats: {
        totalRegistrants: number;
        totalAttendees: number;
        peakConcurrent: number;
        averageDuration: number; // minutes
        chatMessages: number;
        qnaQuestions: number;
    };

    // Status
    status: 'scheduled' | 'in_progress' | 'ended' | 'cancelled';

    // Zoom-specific
    zoomData?: {
        meetingNumber: string;
        timezone: string;
        duration: number; // minutes
        hostEmail: string;
        apiKey?: string; // For SDK
    };

    // Dates
    scheduledStart: Timestamp;
    scheduledEnd: Timestamp;
    actualStart?: Timestamp;
    actualEnd?: Timestamp;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

// Virtual attendee (registered for virtual event)
export interface VirtualAttendee {
    id: string;
    virtualEventId: string;
    eventId: string;
    userId: string;
    ticketId?: string;

    // Personal meeting link
    joinUrl: string;
    uniqueId: string; // For tracking

    // Attendance
    attended: boolean;
    joinTime?: Timestamp;
    leaveTime?: Timestamp;
    duration?: number; // minutes

    // Registration
    registeredAt: Timestamp;
}

// Recording access
export interface RecordingAccess {
    id: string;
    virtualEventId: string;
    userId: string;

    // Access control
    canView: boolean;
    canDownload: boolean;
    expiresAt?: Timestamp;

    // Views
    viewCount: number;
    lastViewedAt?: Timestamp;

    createdAt: Timestamp;
}

// Zoom webhook event
export interface ZoomWebhookEvent {
    event: string; // "meeting.started", "meeting.ended", etc.
    payload: {
        account_id: string;
        object: {
            id: string;
            uuid: string;
            host_id: string;
            topic: string;
            type: number;
            start_time: string;
            duration: number;
            timezone: string;
            participant?: {
                user_id: string;
                user_name: string;
                join_time: string;
                leave_time?: string;
            };
        };
    };
    event_ts: number;
}
