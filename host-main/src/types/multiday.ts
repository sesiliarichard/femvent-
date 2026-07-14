/**
 * Multi-Day Event & Session Schema
 */

export interface EventSession {
    id: string;
    eventId: string;
    name: string; // "Day 1", "Session A", "Morning Workshop"
    description?: string;
    date: Date;
    startTime: string; // "09:00"
    endTime: string; // "17:00"
    venue?: string;
    capacity?: number;
    requiresCheckIn: boolean;
    order: number; // For sorting
}

export interface MultiDayTicket {
    id: string;
    eventId: string;
    ticketType: 'single-day' | 'multi-day' | 'session-specific' | 'all-access';
    allowedSessions: string[]; // Session IDs
    checkIns: {
        [sessionId: string]: {
            checkedIn: boolean;
            checkedInAt?: Date;
            checkedInBy?: string;
        };
    };
}

export interface DayPass {
    id: string;
    eventId: string;
    day: number; // Day 1, 2, 3, etc.
    date: Date;
    price: number;
    ticketsSold: number;
    capacity: number;
}
