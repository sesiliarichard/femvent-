/**
 * FEATURE 2: Reserved Seating / Seat Maps
 * 
 * Step 2.1: Database Schema & Types
 * ==================================
 * 
 * This feature allows event organizers to:
 * - Create custom seat maps for venues
 * - Define sections, rows, and individual seats
 * - Set pricing by section
 * - Allow customers to select specific seats
 * - Implement 10-minute seat holds during checkout
 * - Support accessibility seating
 * 
 * Database Design:
 * - seatMaps: Venue layout configuration
 * - seatReservations: Temporary holds during checkout
 * - Seat status tracked in real-time via Firebase Realtime Database
 */

type Timestamp = string; // ISO date string, matches Supabase/Postgres timestamps
// Main seat map configuration
export interface SeatMap {
    id: string;
    eventId: string;
    name: string; // "Main Hall", "VIP Section"
    totalCapacity: number;
    layout: {
        width: number; // Canvas width in pixels
        height: number; // Canvas height in pixels
        sections: Section[];
    };
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

// A section of the venue (Orchestra, Balcony, VIP, etc.)
export interface Section {
    id: string;
    name: string; // "Orchestra", "Balcony", "VIP"
    color: string; // Hex color for visual distinction
    basePrice: number; // Base price for this section
    position: {
        x: number; // X coordinate on canvas
        y: number; // Y coordinate on canvas
    };
    rows: Row[];
}

// A row within a section
export interface Row {
    id: string;
    label: string; // "A", "B", "1", "2"
    seats: Seat[];
}

// Individual seat
export interface Seat {
    id: string;
    number: string | number; // Seat number within row
    type: 'standard' | 'accessible' | 'companion' | 'blocked';
    status: 'available' | 'reserved' | 'sold' | 'held';
    price: number; // Calculated from section base price
    holdExpiry?: Timestamp; // When the hold expires (10 min)
    ticketId?: string; // If sold, reference to ticket
    position?: {
        x: number; // For visual display
        y: number;
    };
}

// Temporary seat reservation during checkout
export interface SeatReservation {
    id: string;
    eventId: string;
    seatMapId: string;
    userId: string;
    seatIds: string[]; // Array of seat IDs being held
    status: 'held' | 'confirmed' | 'released' | 'expired';
    expiresAt: Timestamp; // Automatically release after 10 minutes
    createdAt: Timestamp;
}

// Real-time seat lock (Firebase Realtime Database)
export interface SeatLock {
    userId: string;
    expiresAt: number; // Unix timestamp
    sessionId: string; // Unique session identifier
}

// Seat selection result
export interface SeatSelectionResult {
    seats: Seat[];
    totalPrice: number;
    section: string;
    canProceed: boolean;
    errors?: string[];
}

export const SEAT_HOLD_DURATION_MS = 10 * 60 * 1000; // 10 minutes
export const SEAT_COLORS = {
    available: '#10B981', // Green
    selected: '#3B82F6', // Blue
    sold: '#6B7280', // Gray
    held: '#F59E0B', // Yellow
    accessible: '#8B5CF6', // Purple
    blocked: '#EF4444', // Red
};
