/**
 * FEATURE 11: Recording & Playback
 * 
 * Type Definitions
 * ================
 */

type Timestamp = string; // ISO date string, matches Supabase/Postgres timestamps

export interface EventRecording {
    id: string;
    eventId: string;
    virtualEventId: string;

    // Recording details
    title: string;
    duration: number; // seconds
    fileSize: number; // bytes
    format: 'mp4' | 'webm';

    // Storage
    storageProvider: 'firebase' | 's3' | 'cloudinary' | 'zoom';
    videoUrl: string;
    downloadUrl?: string;
    thumbnailUrl?: string;

    // Access control
    accessType: 'public' | 'ticket_holders' | 'paid';
    price?: number; // If paid access
    allowedTicketTypes?: string[];
    expiresAt?: Timestamp;

    // Processing
    status: 'processing' | 'ready' | 'failed' | 'expired';
    processingProgress?: number; // 0-100

    // Analytics
    stats: {
        views: number;
        downloads: number;
        averageWatchTime: number;
        completionRate: number;
    };

    // Timestamps
    recordedAt: Timestamp;
    uploadedAt: Timestamp;
    publishedAt?: Timestamp;
    createdAt: Timestamp;
}

export interface RecordingView {
    id: string;
    recordingId: string;
    userId?: string;
    sessionId: string;

    // Playback data
    watchTime: number; // seconds
    completed: boolean;
    progress: number; // 0-100

    // Device
    device: 'desktop' | 'mobile' | 'tablet';

    viewedAt: Timestamp;
}
