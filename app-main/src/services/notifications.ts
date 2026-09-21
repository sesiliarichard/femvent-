import { Platform } from 'react-native';
import Constants from 'expo-constants';
import type * as NotificationsType from 'expo-notifications';

const isExpoGo = Constants.appOwnership === 'expo';

// expo-notifications' native module registers a push-token listener as a
// side effect of simply being imported. On Android in Expo Go (SDK 53+)
// that throws the "runtime not ready" error immediately — so we avoid
// importing the module at all in Expo Go, and only require() it lazily
// in a dev build / standalone build.
const Notifications: typeof NotificationsType | null = isExpoGo
    ? null
    : require('expo-notifications');

if (Notifications) {
    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
            shouldShowBanner: true,
            shouldShowList: true,
        }),
    });
}

export const requestNotificationPermissions = async (): Promise<boolean> => {
    if (!Notifications) {
        console.log('Skipping notification permissions: not supported in Expo Go (SDK 53+)');
        return false;
    }
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

export const getExpoPushToken = async (): Promise<string | null> => {
    if (!Notifications) {
        return null;
    }
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

export const sendLocalNotification = async (
    title: string,
    body: string,
    data?: any
): Promise<void> => {
    if (!Notifications) {
        console.log('Skipping local notification: not supported in Expo Go (SDK 53+)');
        return;
    }
    try {
        console.log('Attempting to send notification:', title);

        Notifications.scheduleNotificationAsync({
            content: {
                title,
                body,
                data,
                sound: true,
            },
            trigger: null,
        }).then(id => console.log('Notification scheduled:', id))
            .catch(err => console.error('Notification error:', err));

        console.log('Notification initiated');
        return Promise.resolve();
    } catch (error) {
        console.error('Error sending local notification:', error);
        throw error;
    }
};

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

export const sendCheckInNotification = async (
    eventTitle: string
): Promise<void> => {
    await sendLocalNotification(
        '✅ Checked In!',
        `You've successfully checked in to "${eventTitle}". Enjoy the event!`,
        { type: 'checked_in' }
    );
};

export const scheduleEventReminder = async (
    eventTitle: string,
    eventDate: Date,
    eventId: string
): Promise<void> => {
    if (!Notifications) {
        return;
    }
    try {
        const reminderTime = new Date(eventDate.getTime() - 60 * 60 * 1000);

        if (reminderTime > new Date()) {
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: '⏰ Event Starting Soon!',
                    body: `"${eventTitle}" starts in 1 hour. Don't forget to bring your QR code!`,
                    data: { eventId, type: 'event_reminder' },
                    sound: true,
                },
                trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.DATE,
                    date: reminderTime,
                },
            });
        }
    } catch (error) {
        console.error('Error scheduling event reminder:', error);
    }
};

export const cancelEventNotifications = async (eventId: string): Promise<void> => {
    if (!Notifications) {
        return;
    }
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

export const dismissAllNotifications = async (): Promise<void> => {
    if (!Notifications) {
        return;
    }
    try {
        await Notifications.dismissAllNotificationsAsync();
    } catch (error) {
        console.error('Error dismissing notifications:', error);
    }
};

export const setupNotificationListeners = (
    onNotificationReceived?: (notification: NotificationsType.Notification) => void,
    onNotificationTapped?: (response: NotificationsType.NotificationResponse) => void
) => {
    if (!Notifications) {
        return () => {};
    }

    const receivedSubscription = Notifications.addNotificationReceivedListener(
        (notification) => {
            console.log('Notification received:', notification);
            onNotificationReceived?.(notification);
        }
    );

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