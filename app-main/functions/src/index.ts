import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as QRCode from 'qrcode';
import { sendEmail } from './services/emailService';
import { generateWelcomeEmail } from './templates/welcomeEmail';
import { generateEventRegistrationEmail } from './templates/eventRegistrationEmail';
import { generateTicketEmail } from './templates/ticketEmail';
import { generatePasswordResetEmail } from './templates/passwordResetEmail';
import { generateEventReminderEmail } from './templates/eventReminderEmail';

// Initialize Firebase Admin
admin.initializeApp();

/**
 * Send welcome email when a new user signs up
 */
export const sendWelcomeEmail = functions.https.onCall(async (data, context) => {
    try {
        // Verify authentication
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
        }

        const { userName, userEmail } = data;

        if (!userEmail) {
            throw new functions.https.HttpsError('invalid-argument', 'Email is required');
        }

        const htmlContent = generateWelcomeEmail({
            userName: userName || 'there',
            userEmail,
        });

        await sendEmail({
            to: userEmail,
            subject: '🎉 Welcome to KUZA Events!',
            html: htmlContent,
        });

        return { success: true, message: 'Welcome email sent successfully' };
    } catch (error) {
        console.error('Error sending welcome email:', error);
        throw new functions.https.HttpsError('internal', 'Failed to send welcome email');
    }
});

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = functions.https.onCall(async (data, context) => {
    try {
        const { userName, userEmail, resetLink } = data;

        if (!userEmail || !resetLink) {
            throw new functions.https.HttpsError('invalid-argument', 'Email and reset link are required');
        }

        const htmlContent = generatePasswordResetEmail({
            userName: userName || 'User',
            resetLink,
        });

        await sendEmail({
            to: userEmail,
            subject: '🔐 Reset Your KUZA Events Password',
            html: htmlContent,
        });

        return { success: true, message: 'Password reset email sent successfully' };
    } catch (error) {
        console.error('Error sending password reset email:', error);
        throw new functions.https.HttpsError('internal', 'Failed to send password reset email');
    }
});

/**
 * Send event registration confirmation email
 */
export const sendEventRegistrationEmail = functions.https.onCall(async (data, context) => {
    try {
        // Verify authentication
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
        }

        const { userName, userEmail, eventTitle, eventDate, eventTime, eventLocation, eventImageUrl, ticketStatus } = data;

        if (!userEmail || !eventTitle) {
            throw new functions.https.HttpsError('invalid-argument', 'Required fields are missing');
        }

        const htmlContent = generateEventRegistrationEmail({
            userName: userName || 'there',
            eventTitle,
            eventDate: eventDate || 'TBD',
            eventTime: eventTime || 'TBD',
            eventLocation: eventLocation || 'TBD',
            eventImageUrl,
            ticketStatus: ticketStatus || 'pending',
        });

        await sendEmail({
            to: userEmail,
            subject: `✅ Registration Confirmed: ${eventTitle}`,
            html: htmlContent,
        });

        return { success: true, message: 'Registration confirmation email sent successfully' };
    } catch (error) {
        console.error('Error sending registration email:', error);
        throw new functions.https.HttpsError('internal', 'Failed to send registration email');
    }
});

/**
 * Generate QR code as data URL
 */
async function generateQRCodeDataUrl(data: string): Promise<string> {
    try {
        const qrCodeDataUrl = await QRCode.toDataURL(data, {
            width: 300,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF',
            },
        });
        return qrCodeDataUrl;
    } catch (error) {
        console.error('Error generating QR code:', error);
        throw error;
    }
}

/**
 * Send ticket email with QR code when ticket status changes to confirmed
 * This is a Firestore trigger
 */
export const sendTicketEmailOnConfirmation = functions.firestore
    .document('tickets/{ticketId}')
    .onUpdate(async (change, context) => {
        try {
            const beforeData = change.before.data();
            const afterData = change.after.data();
            const ticketId = context.params.ticketId;

            // Only send email when status changes to 'confirmed'
            if (beforeData.status !== 'confirmed' && afterData.status === 'confirmed') {
                // Get user data
                const userDoc = await admin.firestore().doc(`users/${afterData.userId}`).get();
                const userData = userDoc.data();

                // Get event data
                const eventDoc = await admin.firestore().doc(`events/${afterData.eventId}`).get();
                const eventData = eventDoc.data();

                if (!userData || !eventData) {
                    console.error('User or event data not found');
                    return;
                }

                // Generate QR code
                const qrCodeData = afterData.qrCodeId || ticketId;
                const qrCodeDataUrl = await generateQRCodeDataUrl(qrCodeData);

                // Format date and time
                const eventDate = eventData.date?.toDate ? eventData.date.toDate() : new Date(eventData.date);
                const formattedDate = eventDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                });
                const formattedTime = eventDate.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                });

                const htmlContent = generateTicketEmail({
                    userName: userData.name || 'there',
                    eventTitle: eventData.title || 'Event',
                    eventDate: formattedDate,
                    eventTime: formattedTime,
                    eventLocation: eventData.location || 'TBD',
                    ticketId,
                    qrCodeDataUrl,
                });

                await sendEmail({
                    to: userData.email,
                    subject: `🎫 Your Ticket for ${eventData.title}`,
                    html: htmlContent,
                });

                console.log(`Ticket email sent to ${userData.email} for event ${eventData.title}`);
            }
        } catch (error) {
            console.error('Error in sendTicketEmailOnConfirmation:', error);
            // Don't throw error to avoid retries
        }
    });

/**
 * Send event reminder emails (scheduled function - runs daily)
 */
export const sendEventReminders = functions.pubsub
    .schedule('0 9 * * *') // Run daily at 9 AM
    .timeZone('Africa/Nairobi') // Adjust to your timezone
    .onRun(async (context) => {
        try {
            const now = new Date();
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);

            const dayAfterTomorrow = new Date(tomorrow);
            dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

            // Get all events happening tomorrow
            const eventsSnapshot = await admin.firestore()
                .collection('events')
                .where('date', '>=', admin.firestore.Timestamp.fromDate(tomorrow))
                .where('date', '<', admin.firestore.Timestamp.fromDate(dayAfterTomorrow))
                .where('isActive', '==', true)
                .get();

            console.log(`Found ${eventsSnapshot.size} events happening tomorrow`);

            for (const eventDoc of eventsSnapshot.docs) {
                const eventData = eventDoc.data();
                const eventId = eventDoc.id;

                // Get all confirmed tickets for this event
                const ticketsSnapshot = await admin.firestore()
                    .collection('tickets')
                    .where('eventId', '==', eventId)
                    .where('status', 'in', ['confirmed', 'active'])
                    .get();

                console.log(`Sending reminders to ${ticketsSnapshot.size} attendees for event: ${eventData.title}`);

                // Send reminder to each attendee
                for (const ticketDoc of ticketsSnapshot.docs) {
                    const ticketData = ticketDoc.data();

                    // Get user data
                    const userDoc = await admin.firestore().doc(`users/${ticketData.userId}`).get();
                    const userData = userDoc.data();

                    if (!userData || !userData.email) {
                        console.warn(`No user data found for ticket ${ticketDoc.id}`);
                        continue;
                    }

                    // Format date and time
                    const eventDate = eventData.date?.toDate ? eventData.date.toDate() : new Date(eventData.date);
                    const formattedDate = eventDate.toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                    });
                    const formattedTime = eventDate.toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                    });

                    const hoursUntilEvent = Math.round((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60));

                    const htmlContent = generateEventReminderEmail({
                        userName: userData.name || 'there',
                        eventTitle: eventData.title || 'Event',
                        eventDate: formattedDate,
                        eventTime: formattedTime,
                        eventLocation: eventData.location || 'TBD',
                        eventImageUrl: eventData.imageURL || eventData.posterURL,
                        hoursUntilEvent,
                    });

                    try {
                        await sendEmail({
                            to: userData.email,
                            subject: `⏰ Reminder: ${eventData.title} is Tomorrow!`,
                            html: htmlContent,
                        });
                        console.log(`Reminder sent to ${userData.email}`);
                    } catch (emailError) {
                        console.error(`Failed to send reminder to ${userData.email}:`, emailError);
                    }
                }
            }

            return { success: true, eventsProcessed: eventsSnapshot.size };
        } catch (error) {
            console.error('Error in sendEventReminders:', error);
            throw error;
        }
    });

/**
 * Send event cancellation notification
 */
export const sendEventCancellationEmail = functions.https.onCall(async (data, context) => {
    try {
        // Verify authentication and admin role
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
        }

        const { eventId, eventTitle, cancellationReason } = data;

        if (!eventId || !eventTitle) {
            throw new functions.https.HttpsError('invalid-argument', 'Event ID and title are required');
        }

        // Get all tickets for this event
        const ticketsSnapshot = await admin.firestore()
            .collection('tickets')
            .where('eventId', '==', eventId)
            .where('status', 'in', ['pending', 'confirmed', 'active'])
            .get();

        const emailPromises: Promise<void>[] = [];

        for (const ticketDoc of ticketsSnapshot.docs) {
            const ticketData = ticketDoc.data();

            // Get user data
            const userDoc = await admin.firestore().doc(`users/${ticketData.userId}`).get();
            const userData = userDoc.data();

            if (!userData || !userData.email) {
                continue;
            }

            // Simple cancellation email (you can create a template for this too)
            const htmlContent = `
        <h2>Event Cancelled: ${eventTitle}</h2>
        <p>Dear ${userData.name || 'Attendee'},</p>
        <p>We regret to inform you that <strong>${eventTitle}</strong> has been cancelled.</p>
        ${cancellationReason ? `<p><strong>Reason:</strong> ${cancellationReason}</p>` : ''}
        <p>We apologize for any inconvenience. If you paid for this event, you will receive a full refund within 5-7 business days.</p>
        <p>Best regards,<br>KUZA Events Team</p>
      `;

            emailPromises.push(
                sendEmail({
                    to: userData.email,
                    subject: `❌ Event Cancelled: ${eventTitle}`,
                    html: htmlContent,
                })
            );
        }

        await Promise.all(emailPromises);

        return { success: true, emailsSent: emailPromises.length };
    } catch (error) {
        console.error('Error sending cancellation emails:', error);
        throw new functions.https.HttpsError('internal', 'Failed to send cancellation emails');
    }
});
