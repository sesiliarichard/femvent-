import React, { useState, useEffect } from 'react';
import { TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { toggleFavorite, isFavorited } from '../services/favorites';
import { useAuth } from '../services/AuthContext';

interface FavoriteButtonProps {
    eventId: string;
    size?: number;
    color?: string;
    style?: any;
    onToggle?: (isFavorited: boolean) => void;
}

export const FavoriteButton: React.FC<FavoriteButtonProps> = ({
    eventId,
    size = 28,
    color = '#ff6b6b',
    style,
    onToggle,
}) => {
    const { user } = useAuth();
    const [favorited, setFavorited] = useState(false);
    const [loading, setLoading] = useState(false);
    const scaleValue = React.useRef(new Animated.Value(1)).current;

    useEffect(() => {
        checkFavoriteStatus();
    }, [eventId, user?.id]);

    const checkFavoriteStatus = async () => {
        if (!user?.id) return;

        try {
            const result = await isFavorited(user.id, eventId);
            setFavorited(!!result);
        } catch (error) {
            console.error('Error checking favorite status:', error);
        }
    };

    const handlePress = async () => {
        if (!user?.id || loading) return;

        // Haptic feedback
        try {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } catch (error) {
            // Haptics may not be supported on all devices
        }

        // Animate
        Animated.sequence([
            Animated.timing(scaleValue, {
                toValue: 1.3,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.timing(scaleValue, {
                toValue: 1,
                duration: 100,
                useNativeDriver: true,
            }),
        ]).start();

        setLoading(true);

        try {
            const newState = await toggleFavorite(user.id, eventId);
            setFavorited(newState);
            onToggle?.(newState);
        } catch (error) {
            console.error('Error toggling favorite:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <TouchableOpacity
            style={[styles.button, style]}
            onPress={handlePress}
            disabled={loading}
            activeOpacity={0.7}
        >
            <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
                <Ionicons
                    name={favorited ? 'heart' : 'heart-outline'}
                    size={size}
                    color={color}
                />
            </Animated.View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.9)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
});
