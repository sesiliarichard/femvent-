import * as Sharing from 'expo-sharing';
import { Share, Platform, Linking } from 'react-native';

interface Event {
    id: string;
    title: string;
    date: Date;
    location?: string;
    description?: string;
}

/**
 * Generate share message for an event
 */
export const generateShareMessage = (event: Event): string => {
    const dateStr = event.date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    });

    return `🎉 Check out this event on KUZA Events!\n\n📌 ${event.title}\n📅 ${dateStr}${event.location ? `\n📍 ${event.location}` : ''
        }\n\n👉 Join me and register now!`;
};

/**
 * Share event using native share sheet
 */
export const shareEvent = async (event: Event): Promise<boolean> => {
    try {
        const message = generateShareMessage(event);

        const result = await Share.share({
            message,
            title: `Check out: ${event.title}`,
        });

        if (result.action === Share.sharedAction) {
            console.log('Event shared successfully');
            return true;
        } else if (result.action === Share.dismissedAction) {
            console.log('Share dismissed');
            return false;
        }

        return false;
    } catch (error) {
        console.error('Error sharing event:', error);
        return false;
    }
};

/**
 * Share event directly to WhatsApp
 */
export const shareToWhatsApp = async (event: Event): Promise<void> => {
    try {
        const message = generateShareMessage(event);
        const url = `whatsapp://send?text=${encodeURIComponent(message)}`;

        const canOpen = await Linking.canOpenURL(url);
        if (canOpen) {
            await Linking.openURL(url);
        } else {
            // Fallback to regular share if WhatsApp not installed
            await shareEvent(event);
        }
    } catch (error) {
        console.error('Error sharing to WhatsApp:', error);
        // Fallback to regular share
        await shareEvent(event);
    }
};

/**
 * Share event via SMS
 */
export const shareViaSMS = async (event: Event): Promise<void> => {
    try {
        const message = generateShareMessage(event);
        const separator = Platform.OS === 'ios' ? '&' : '?';
        const url = `sms:${separator}body=${encodeURIComponent(message)}`;

        await Linking.openURL(url);
    } catch (error) {
        console.error('Error sharing via SMS:', error);
    }
};

/**
 * Share event via email
 */
export const shareViaEmail = async (event: Event): Promise<void> => {
    try {
        const message = generateShareMessage(event);
        const subject = `Check out: ${event.title}`;
        const url = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
            message
        )}`;

        await Linking.openURL(url);
    } catch (error) {
        console.error('Error sharing via email:', error);
    }
};

/**
 * Copy event link to clipboard
 */
export const copyEventLink = (event: Event): string => {
    // In a real app, this would be a deep link
    // For now, return a shareable message
    return generateShareMessage(event);
};
