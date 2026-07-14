/**
 * WaitlistButton Component
 * Allows users to join/leave event waitlist when sold out
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    StyleSheet
} from 'react-native';
import { useAuth } from '../services/AuthContext';
import {
    joinWaitlist,
    leaveWaitlist,
    checkWaitlistStatus,
    getWaitlistPosition,
    WaitlistEntry
} from '../services/waitlist';

interface WaitlistButtonProps {
    eventId: string;
    eventTitle: string;
    isSoldOut: boolean;
}

export const WaitlistButton: React.FC<WaitlistButtonProps> = ({
    eventId,
    eventTitle,
    isSoldOut,
}) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [onWaitlist, setOnWaitlist] = useState<WaitlistEntry | null>(null);
    const [position, setPosition] = useState<number>(0);

    useEffect(() => {
        if (user && isSoldOut) {
            checkStatus();
        }
    }, [user, eventId, isSoldOut]);

    const checkStatus = async () => {
        if (!user) return;

        try {
            const status = await checkWaitlistStatus(eventId, user.uid);
            setOnWaitlist(status);

            if (status) {
                const pos = await getWaitlistPosition(eventId, user.uid);
                setPosition(pos);
            }
        } catch (error) {
            console.error('Error checking waitlist status:', error);
        }
    };

    const handleJoinWaitlist = async () => {
        if (!user) {
            Alert.alert('Sign In Required', 'Please sign in to join the waitlist');
            return;
        }

        setLoading(true);
        try {
            await joinWaitlist(
                eventId,
                user.uid,
                user.email || '',
                user.displayName || 'Guest'
            );

            Alert.alert(
                'Added to Waitlist! ✅',
                `You'll receive a notification if a spot opens up for "${eventTitle}".`
            );

            await checkStatus();
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to join waitlist');
        } finally {
            setLoading(false);
        }
    };

    const handleLeaveWaitlist = async () => {
        if (!user) return;

        Alert.alert(
            'Leave Waitlist?',
            'Are you sure you want to leave the waitlist?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Leave',
                    style: 'destructive',
                    onPress: async () => {
                        setLoading(true);
                        try {
                            await leaveWaitlist(eventId, user.uid);
                            Alert.alert('Left Waitlist', 'You have been removed from the waitlist');
                            setOnWaitlist(null);
                            setPosition(0);
                        } catch (error) {
                            Alert.alert('Error', 'Failed to leave waitlist');
                        } finally {
                            setLoading(false);
                        }
                    },
                },
            ]
        );
    };

    if (!isSoldOut) {
        return null; // Don't show button if not sold out
    }

    if (loading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="small" color="#007AFF" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {onWaitlist ? (
                <View>
                    <TouchableOpacity
                        style={[styles.button, styles.leaveButton]}
                        onPress={handleLeaveWaitlist}
                    >
                        <Text style={styles.leaveButtonText}>Leave Waitlist</Text>
                    </TouchableOpacity>
                    {position > 0 && (
                        <Text style={styles.positionText}>
                            Position #{position} in line
                        </Text>
                    )}
                </View>
            ) : (
                <TouchableOpacity
                    style={[styles.button, styles.joinButton]}
                    onPress={handleJoinWaitlist}
                >
                    <Text style={styles.joinButtonText}>📋 Join Waitlist</Text>
                </TouchableOpacity>
            )}
            <Text style={styles.infoText}>
                We'll notify you if a spot opens up
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginVertical: 16,
    },
    button: {
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 8,
    },
    joinButton: {
        backgroundColor: '#007AFF',
    },
    leaveButton: {
        backgroundColor: '#FFFFFF',
        borderWidth: 2,
        borderColor: '#FF3B30',
    },
    joinButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    leaveButtonText: {
        color: '#FF3B30',
        fontSize: 16,
        fontWeight: '600',
    },
    positionText: {
        textAlign: 'center',
        color: '#007AFF',
        fontSize: 14,
        fontWeight: '500',
        marginTop: 4,
    },
    infoText: {
        textAlign: 'center',
        color: '#8E8E93',
        fontSize: 12,
        marginTop: 4,
    },
});

export default WaitlistButton;
