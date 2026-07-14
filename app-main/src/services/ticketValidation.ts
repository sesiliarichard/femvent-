import { supabase } from './supabase';
import { Ticket } from '../types';
import { parseTicketQRData, isQRTimestampValid } from './qrCode';

export interface TicketValidationResult {
    valid: boolean;
    ticket?: Ticket & { id: string };
    message: string;
    alreadyCheckedIn?: boolean;
}

const mapTicketRow = (row: any): Ticket & { id: string } => ({
    id: row.id,
    eventId: row.event_id,
    userId: row.user_id,
    paymentId: row.payment_id,
    status: row.status,
    qrCodeId: row.qr_code_id,
    createdAt: row.created_at ? new Date(row.created_at) : new Date(),
    priceOption: row.price_option,
    userName: row.user_name,
    userEmail: row.user_email,
    userPhotoURL: row.user_photo_url,
    checkInStatus: row.check_in_status,
    checkInTime: row.check_in_time ? new Date(row.check_in_time) : undefined,
} as Ticket & { id: string });

/**
 * Validate a scanned QR code ticket
 * @param qrDataString - The scanned QR code string
 * @param eventId - The ID of the event to validate against
 * @returns Validation result with ticket data if valid
 */
export const validateTicket = async (
    qrDataString: string,
    eventId: string
): Promise<TicketValidationResult> => {
    try {
        // Parse QR code data
        const qrData = parseTicketQRData(qrDataString);

        if (!qrData) {
            return {
                valid: false,
                message: '❌ Invalid QR code format',
            };
        }

        // Verify QR timestamp (prevent very old QR codes)
        if (!isQRTimestampValid(qrData.timestamp, 168)) { // 7 days
            return {
                valid: false,
                message: '⚠️ QR code has expired. Please generate a new one.',
            };
        }

        // Verify event matches
        if (qrData.eventId !== eventId) {
            return {
                valid: false,
                message: '❌ This ticket is for a different event',
            };
        }

        // Fetch ticket from Supabase
        const { data: ticketRow, error } = await supabase
            .from('tickets')
            .select('*')
            .eq('id', qrData.ticketId)
            .maybeSingle();

        if (error) throw error;

        if (!ticketRow) {
            return {
                valid: false,
                message: '❌ Ticket not found in database',
            };
        }

        const ticket = mapTicketRow(ticketRow);

        // Verify ticket belongs to the user in QR code
        if (ticket.userId !== qrData.userId) {
            return {
                valid: false,
                message: '❌ Ticket user mismatch. Possible fraud.',
            };
        }

        // Check ticket status
        if (ticket.status === 'cancelled') {
            return {
                valid: false,
                message: '❌ This ticket has been cancelled',
            };
        }

        if (ticket.status === 'refunded') {
            return {
                valid: false,
                message: '❌ This ticket has been refunded',
            };
        }

        if (ticket.status === 'pending') {
            return {
                valid: false,
                message: '⚠️ Ticket payment is pending. Not yet confirmed.',
            };
        }

        if (ticket.status !== 'confirmed') {
            return {
                valid: false,
                message: `❌ Ticket status: ${ticket.status}`,
            };
        }

        // Check if already checked in
        const alreadyCheckedIn = ticketRow.check_in_status === 'checked-in';

        if (alreadyCheckedIn) {
            const checkInTime = ticketRow.check_in_time ? new Date(ticketRow.check_in_time) : null;
            const timeStr = checkInTime
                ? checkInTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : 'earlier';

            return {
                valid: true,
                ticket,
                alreadyCheckedIn: true,
                message: `✓ Already checked in at ${timeStr}`,
            };
        }

        // Valid ticket, ready for check-in
        return {
            valid: true,
            ticket,
            message: '✅ Valid ticket - Ready for check-in',
            alreadyCheckedIn: false,
        };
    } catch (error) {
        console.error('Error validating ticket:', error);
        return {
            valid: false,
            message: '❌ Error validating ticket. Please try again.',
        };
    }
};

/**
 * Check in an attendee by updating their ticket
 * @param ticketId - The ID of the ticket to check in
 * @returns Success boolean
 */
export const checkInAttendee = async (ticketId: string): Promise<boolean> => {
    try {
        const { error } = await supabase
            .from('tickets')
            .update({
                check_in_status: 'checked-in',
                check_in_time: new Date().toISOString(),
            })
            .eq('id', ticketId);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error checking in attendee:', error);
        return false;
    }
};

/**
 * Undo check-in for an attendee
 * @param ticketId - The ID of the ticket to undo check-in
 * @returns Success boolean
 */
export const undoCheckIn = async (ticketId: string): Promise<boolean> => {
    try {
        const { error } = await supabase
            .from('tickets')
            .update({
                check_in_status: 'not-checked-in',
                check_in_time: null,
            })
            .eq('id', ticketId);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error undoing check-in:', error);
        return false;
    }
};

/**
 * Get ticket details by ID
 * @param ticketId - The ID of the ticket
 * @returns Ticket data or null
 */
export const getTicketById = async (ticketId: string): Promise<(Ticket & { id: string }) | null> => {
    try {
        const { data, error } = await supabase
            .from('tickets')
            .select('*')
            .eq('id', ticketId)
            .maybeSingle();

        if (error) throw error;
        if (!data) return null;

        return mapTicketRow(data);
    } catch (error) {
        console.error('Error fetching ticket:', error);
        return null;
    }
};