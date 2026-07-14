import * as Calendar from 'expo-calendar';
import { Platform, Alert } from 'react-native';

/**
 * Request calendar permissions
 */
export const requestCalendarPermissions = async (): Promise<boolean> => {
    try {
        const { status } = await Calendar.requestCalendarPermissionsAsync();

        if (status !== 'granted') {
            Alert.alert(
                'Permission Required',
                'Please enable calendar access in your device settings to add events to your calendar.',
                [{ text: 'OK' }]
            );
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error requesting calendar permissions:', error);
        return false;
    }
};

/**
 * Get the default calendar for the device
 */
export const getDefaultCalendar = async (): Promise<string | null> => {
    try {
        const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);

        // Try to find the primary calendar
        let defaultCalendar = calendars.find((cal) => cal.isPrimary);

        // If no primary calendar, use the first one
        if (!defaultCalendar && calendars.length > 0) {
            defaultCalendar = calendars[0];
        }

        return defaultCalendar?.id || null;
    } catch (error) {
        console.error('Error getting default calendar:', error);
        return null;
    }
};

interface EventData {
    id: string;
    title: string;
    description?: string;
    location?: string;
    date: Date;
    endDate?: Date;
}

/**
 * Add event to device calendar
 */
export const addEventToCalendar = async (event: EventData): Promise<string | null> => {
    try {
        // Request permissions
        const hasPermission = await requestCalendarPermissions();
        if (!hasPermission) {
            return null;
        }

        // Get default calendar
        const calendarId = await getDefaultCalendar();
        if (!calendarId) {
            Alert.alert('Error', 'Could not find a calendar to add the event to.');
            return null;
        }

        // Calculate end time (default to 2 hours after start if not specified)
        const endDate = event.endDate || new Date(event.date.getTime() + 2 * 60 * 60 * 1000);

        // Create calendar event
        const calendarEventId = await Calendar.createEventAsync(calendarId, {
            title: event.title,
            startDate: event.date,
            endDate: endDate,
            location: event.location,
            notes: event.description,
            timeZone: 'UTC',
            alarms: [
                { relativeOffset: -60 }, // 1 hour before
                { relativeOffset: -1440 }, // 1 day before
            ],
        });

        return calendarEventId;
    } catch (error) {
        console.error('Error adding event to calendar:', error);
        Alert.alert('Error', 'Failed to add event to calendar. Please try again.');
        return null;
    }
};

/**
 * Remove event from calendar
 */
export const removeEventFromCalendar = async (calendarEventId: string): Promise<boolean> => {
    try {
        await Calendar.deleteEventAsync(calendarEventId);
        return true;
    } catch (error) {
        console.error('Error removing event from calendar:', error);
        Alert.alert('Error', 'Failed to remove event from calendar.');
        return false;
    }
};

/**
 * Check if event is already in calendar
 * (This is just a helper to track in local state/Firestore)
 */
export const isEventInCalendar = (eventId: string, calendarEventId: string | null): boolean => {
    return !!calendarEventId;
};
