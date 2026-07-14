import { Ticket } from '../types';

/**
 * Generate QR code data for a ticket
 * Returns a JSON string containing ticket verification data
 */
export const generateTicketQRData = (ticket: Ticket): string => {
    const qrData = {
        ticketId: ticket.id,
        eventId: ticket.eventId,
        userId: ticket.userId,
        qrCodeId: ticket.qrCodeId || `qr_${ticket.id}`,
        timestamp: Date.now(),
    };

    return JSON.stringify(qrData);
};

/**
 * Parse QR code data
 * Returns parsed data or null if invalid
 */
export const parseTicketQRData = (qrDataString: string): {
    ticketId: string;
    eventId: string;
    userId: string;
    qrCodeId: string;
    timestamp: number;
} | null => {
    try {
        const data = JSON.parse(qrDataString);

        if (!data.ticketId || !data.eventId || !data.userId || !data.qrCodeId) {
            return null;
        }

        return data;
    } catch (error) {
        console.error('Error parsing QR data:', error);
        return null;
    }
};

/**
 * Validate QR code timestamp (prevent old QR codes from being reused)
 * Returns true if timestamp is within acceptable range (e.g., 24 hours)
 */
export const isQRTimestampValid = (timestamp: number, maxAgeHours: number = 24): boolean => {
    const now = Date.now();
    const maxAge = maxAgeHours * 60 * 60 * 1000; // Convert hours to milliseconds

    return (now - timestamp) <= maxAge;
};
