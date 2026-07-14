/**
 * Email notification service
 * NOTE: These previously called Firebase Cloud Functions. That backend no
 * longer exists. These are now no-ops until a Supabase Edge Function (or
 * other email service) is wired up to replace them.
 */

interface WelcomeEmailData {
    userName: string;
    userEmail: string;
}

interface PasswordResetEmailData {
    userName: string;
    userEmail: string;
    resetLink: string;
}

interface EventRegistrationEmailData {
    userName: string;
    userEmail: string;
    eventTitle: string;
    eventDate: string;
    eventTime: string;
    eventLocation: string;
    eventImageUrl?: string;
    ticketStatus: string;
}

interface EventCancellationEmailData {
    eventId: string;
    eventTitle: string;
    cancellationReason?: string;
}

export const sendWelcomeEmail = async (data: WelcomeEmailData): Promise<void> => {
    console.log('[emailNotifications] sendWelcomeEmail is a no-op (no email backend configured yet)', data.userEmail);
};

export const sendPasswordResetEmail = async (data: PasswordResetEmailData): Promise<void> => {
    console.log('[emailNotifications] sendPasswordResetEmail is a no-op', data.userEmail);
};

export const sendEventRegistrationEmail = async (data: EventRegistrationEmailData): Promise<void> => {
    console.log('[emailNotifications] sendEventRegistrationEmail is a no-op', data.userEmail);
};

export const sendEventCancellationEmail = async (data: EventCancellationEmailData): Promise<void> => {
    console.log('[emailNotifications] sendEventCancellationEmail is a no-op', data.eventId);
};

export const formatEventDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};

export const formatEventTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
    });
};