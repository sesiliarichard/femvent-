/**
 * Smart Reminder Service
 * Handles intelligent event reminders based on time, location, and user preferences
 */

import notifee, { AndroidImportance, TriggerType, TimestampTrigger } from '@notifee/react-native';
import * as Location from 'expo-location';

export interface ReminderPreferences {
    enabled: boolean;
    intervals: number[]; // Hours before event: [24, 1, 0.25]
    travelTimeBuffer: number; // Minutes to add for travel
    quietHours: {
        start: string; // "22:00"
        end: string; // "08:00"
    };
}

const DEFAULT_PREFERENCES: ReminderPreferences = {
    enabled: true,
    intervals: [24, 1], // 24 hours and 1 hour before
    travelTimeBuffer: 15, // 15 minutes
    quietHours: {
        start: '22:00',
        end: '08:00',
    },
};

/**
 * Schedule smart reminders for an event
 */
export const scheduleEventReminders = async (
    eventId: string,
    eventTitle: string,
    eventDate: Date,
    eventLocation?: string,
    preferences: ReminderPreferences = DEFAULT_PREFERENCES
): Promise<void> => {
    if (!preferences.enabled) return;

    try {
        // Request notification permissions
        await notifee.requestPermission();

        // Create notification channel (Android)
        const channelId = await notifee.createChannel({
            id: 'event-reminders',
            name: 'Event Reminders',
            importance: AndroidImportance.HIGH,
        });

        // Calculate travel time if location provided
        let travelTime = 0;
        if (eventLocation) {
            travelTime = await estimateTravelTime(eventLocation);
        }

        // Schedule notifications for each interval
        for (const hours of preferences.intervals) {
            const reminderTime = new Date(eventDate.getTime() - hours * 60 * 60 * 1000);

            // Adjust for travel time on 1-hour reminder
            if (hours === 1) {
                reminderTime.setMinutes(reminderTime.getMinutes() - (travelTime + preferences.travelTimeBuffer));
            }

            // Skip if reminder time is in the past
            if (reminderTime <= new Date()) continue;

            // Check quiet hours
            if (isInQuietHours(reminderTime, preferences.quietHours)) {
                continue; // Skip reminders during quiet hours
            }

            // Create notification
            const trigger: TimestampTrigger = {
                type: TriggerType.TIMESTAMP,
                timestamp: reminderTime.getTime(),
            };

            await notifee.createTriggerNotification(
                {
                    id: `event-${eventId}-${hours}h`,
                    title: getSmartTitle(hours, eventTitle),
                    body: getSmartBody(hours, eventTitle, travelTime),
                    android: {
                        channelId,
                        smallIcon: 'ic_notification',
                        pressAction: {
                            id: 'default',
                            launchActivity: 'default',
                        },
                    },
                    ios: {
                        sound: 'default',
                    },
                    data: {
                        eventId,
                        type: 'event-reminder',
                    },
                },
                trigger
            );
        }

        console.log(`Scheduled ${preferences.intervals.length} reminders for event ${eventId}`);
    } catch (error) {
        console.error('Error scheduling reminders:', error);
        throw error;
    }
};

/**
 * Cancel all reminders for an event
 */
export const cancelEventReminders = async (eventId: string): Promise<void> => {
    try {
        const notifications = await notifee.getTriggerNotifications();

        for (const notification of notifications) {
            if (notification.notification.data?.eventId === eventId) {
                await notifee.cancelNotification(notification.notification.id!);
            }
        }

        console.log(`Cancelled reminders for event ${eventId}`);
    } catch (error) {
        console.error('Error cancelling reminders:', error);
    }
};

/**
 * Estimate travel time to event location
 */
const estimateTravelTime = async (eventLocation: string): Promise<number> => {
    try {
        // Get user's current location
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return 0;

        const userLocation = await Location.getCurrentPositionAsync({});

        // Simple estimation: 30 minutes per 15km (can be enhanced with Google Maps API)
        // For now, return default 15 minutes
        return 15;
    } catch (error) {
        console.error('Error estimating travel time:', error);
        return 0;
    }
};

/**
 * Check if time is within quiet hours
 */
const isInQuietHours = (
    time: Date,
    quietHours: { start: string; end: string }
): boolean => {
    const timeStr = `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`;
    return timeStr >= quietHours.start || timeStr <= quietHours.end;
};

/**
 * Generate smart reminder title
 */
const getSmartTitle = (hours: number, eventTitle: string): string => {
    if (hours >= 24) {
        return `Tomorrow: ${eventTitle}`;
    } else if (hours === 1) {
        return `Soon: ${eventTitle}`;
    } else if (hours < 1) {
        return `Starting Soon: ${eventTitle}`;
    }
    return `Reminder: ${eventTitle}`;
};

/**
 * Generate smart reminder body
 */
const getSmartBody = (
    hours: number,
    eventTitle: string,
    travelTime: number
): string => {
    if (hours >= 24) {
        return `Your event "${eventTitle}" is tomorrow. Don't forget to prepare!`;
    } else if (hours === 1) {
        if (travelTime > 0) {
            return `Your event starts in 1 hour. Leave in ${travelTime} minutes to arrive on time!`;
        }
        return `Your event starts in 1 hour. Get ready!`;
    } else if (hours < 1) {
        return `Your event is starting in ${Math.round(hours * 60)} minutes!`;
    }
    return `Your event "${eventTitle}" is coming up.`;
};

/**
 * Update reminder preferences
 */
export const updateReminderPreferences = async (
    userId: string,
    preferences: Partial<ReminderPreferences>
): Promise<void> => {
    // Store in AsyncStorage or Firestore
    // Implementation depends on your storage strategy
    console.log('Updating reminder preferences for user:', userId, preferences);
};

/**
 * Get reminder preferences
 */
export const getReminderPreferences = async (
    userId: string
): Promise<ReminderPreferences> => {
    // Retrieve from AsyncStorage or Firestore
    // For now, return defaults
    return DEFAULT_PREFERENCES;
};
