import React, { useState } from 'react';
import { TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { addEventToCalendar, removeEventFromCalendar } from '../services/calendar';

interface AddToCalendarButtonProps {
    event: {
        id: string;
        title: string;
        description?: string;
        location?: string;
        date: Date;
        endDate?: Date;
    };
    onSuccess?: (calendarEventId: string) => void;
    onRemove?: () => void;
    calendarEventId?: string | null;
    variant?: 'full' | 'icon';
}

export const AddToCalendarButton: React.FC<AddToCalendarButtonProps> = ({
    event,
    onSuccess,
    onRemove,
    calendarEventId,
    variant = 'full',
}) => {
    const [loading, setLoading] = useState(false);
    const isAdded = !!calendarEventId;

    const handlePress = async () => {
        setLoading(true);

        try {
            if (isAdded && calendarEventId) {
                // Remove from calendar
                const success = await removeEventFromCalendar(calendarEventId);
                if (success) {
                    onRemove?.();
                }
            } else {
                // Add to calendar
                const newCalendarEventId = await addEventToCalendar(event);
                if (newCalendarEventId) {
                    onSuccess?.(newCalendarEventId);
                }
            }
        } finally {
            setLoading(false);
        }
    };

    if (variant === 'icon') {
        return (
            <TouchableOpacity
                style={[styles.iconButton, isAdded && styles.iconButtonAdded]}
                onPress={handlePress}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator size="small" color={isAdded ? '#10b981' : '#667eea'} />
                ) : (
                    <Ionicons
                        name={isAdded ? 'calendar' : 'calendar-outline'}
                        size={24}
                        color={isAdded ? '#10b981' : '#667eea'}
                    />
                )}
            </TouchableOpacity>
        );
    }

    return (
        <TouchableOpacity
            style={styles.button}
            onPress={handlePress}
            disabled={loading}
            activeOpacity={0.8}
        >
            <LinearGradient
                colors={isAdded ? ['#10b981', '#059669'] : ['#667eea', '#764ba2']}
                style={styles.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                ) : (
                    <>
                        <Ionicons
                            name={isAdded ? 'checkmark-circle' : 'calendar'}
                            size={20}
                            color="#fff"
                        />
                        <Text style={styles.buttonText}>
                            {isAdded ? 'Added to Calendar' : 'Add to Calendar'}
                        </Text>
                    </>
                )}
            </LinearGradient>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
    gradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 20,
        gap: 8,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    iconButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconButtonAdded: {
        backgroundColor: '#d1fae5',
    },
});
