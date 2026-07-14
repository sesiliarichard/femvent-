import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Configure notification behavior
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

/**
 * Request notification permissions
 */
export const requestNotificationPermissions = async (): Promise<boolean> => {
    try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.log('Notification permission not granted');
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error requesting notification permissions:', error);
        return false;
    }
};

/**
 * Get Expo push token for sending notifications
 */
export const getExpoPushToken = async (): Promise<string | null> => {
    try {
        const hasPermission = await requestNotificationPermissions();
        if (!hasPermission) {
            return null;
        }

        const token = await Notifications.getExpoPushTokenAsync({
            projectId: Constants.expoConfig?.extra?.eas?.projectId,
        });

        console.log('Expo Push Token:', token.data);
        return token.data;
    } catch (error) {
        console.error('Error getting push token:', error);
        return null;
    }
};

/**
 * Send a local notification (for immediate feedback)
 */
export const sendLocalNotification = async (
    title: string,
    body: string,
    data?: any
): Promise<void> => {
    try {
        console.log('Attempting to send notification:', title);

        // Don't await - Expo Go SDK 53 promise may hang
        Notifications.scheduleNotificationAsync({
            content: {
                title,
                body,
                data,
                sound: true,
            },
            trigger: null, // Send immediately
        }).then(id => console.log('Notification scheduled:', id))
            .catch(err => console.error('Notification error:', err));

        console.log('Notification initiated');
        // Resolve immediately after scheduling
        return Promise.resolve();
    } catch (error) {
        console.error('Error sending local notification:', error);
        throw error;
    }
};

/**
 * Send ticket confirmation notification
 */
export const sendTicketConfirmationNotification = async (
    eventTitle: string,
    ticketId: string
): Promise<void> => {
    await sendLocalNotification(
        '🎫 Ticket Confirmed!',
        `Your ticket for "${eventTitle}" has been confirmed. Tap to view your QR code.`,
        { ticketId, type: 'ticket_confirmed' }
    );
};

/**
 * Send check-in success notification
 */
export const sendCheckInNotification = async (
    eventTitle: string
): Promise<void> => {
    await sendLocalNotification(
        '✅ Checked In!',
        `You've successfully checked in to "${eventTitle}". Enjoy the event!`,
        { type: 'checked_in' }
    );
};

/**
 * Send event reminder notification
 */
export const scheduleEventReminder = async (
    eventTitle: string,
    eventDate: Date,
    eventId: string
): Promise<void> => {
    try {
        // Schedule notification 1 hour before event
        const reminderTime = new Date(eventDate.getTime() - 60 * 60 * 1000);

        if (reminderTime > new Date()) {
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: '⏰ Event Starting Soon!',
                    body: `"${eventTitle}" starts in 1 hour. Don't forget to bring your QR code!`,
                    data: { eventId, type: 'event_reminder' },
                    sound: true,
                },
                trigger: { type: 'date', date: reminderTime } as const,
            });
        }
    } catch (error) {
        console.error('Error scheduling event reminder:', error);
    }
};

/**
 * Cancel all notifications for a specific event
 */
export const cancelEventNotifications = async (eventId: string): Promise<void> => {
    try {
        const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();

        for (const notification of scheduledNotifications) {
            if (notification.content.data?.eventId === eventId) {
                await Notifications.cancelScheduledNotificationAsync(notification.identifier);
            }
        }
    } catch (error) {
        console.error('Error cancelling event notifications:', error);
    }
};

/**
 * Setup notification listeners
 * Call this in your App.tsx or main component
 */
export const setupNotificationListeners = (
    onNotificationReceived?: (notification: Notifications.Notification) => void,
    onNotificationTapped?: (response: Notifications.NotificationResponse) => void
) => {
    // Listen for notifications received while app is foregrounded
    const receivedSubscription = Notifications.addNotificationReceivedListener(
        (notification) => {
            console.log('Notification received:', notification);
            onNotificationReceived?.(notification);
        }
    );

    // Listen for user tapping on notifications
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(
        (response) => {
            console.log('Notification tapped:', response);
            onNotificationTapped?.(response);
        }
    );

    return () => {
        receivedSubscription.remove();
        responseSubscription.remove();
    };
};
