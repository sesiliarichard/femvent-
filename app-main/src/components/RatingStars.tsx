/**
 * RatingStars Component
 * Reusable star rating component for display and input
 */

import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface RatingStarsProps {
    rating: number;
    maxRating?: number;
    size?: number;
    interactive?: boolean;
    onRatingChange?: (rating: number) => void;
    color?: string;
}

export const RatingStars: React.FC<RatingStarsProps> = ({
    rating,
    maxRating = 5,
    size = 20,
    interactive = false,
    onRatingChange,
    color = '#F59E0B',
}) => {
    const handlePress = (value: number) => {
        if (interactive && onRatingChange) {
            onRatingChange(value);
        }
    };

    const renderStar = (index: number) => {
        const starValue = index + 1;
        const isFilled = starValue <= Math.floor(rating);
        const isHalf = starValue === Math.ceil(rating) && rating % 1 !== 0;

        const StarComponent = interactive ? TouchableOpacity : View;

        return (
            <StarComponent
                key={index}
                onPress={() => handlePress(starValue)}
                style={styles.starContainer}
                activeOpacity={0.7}
            >
                <Ionicons
                    name={isFilled ? 'star' : isHalf ? 'star-half' : 'star-outline'}
                    size={size}
                    color={isFilled || isHalf ? color : '#D1D5DB'}
                />
            </StarComponent>
        );
    };

    return (
        <View style={styles.container}>
            {Array.from({ length: maxRating }, (_, i) => renderStar(i))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    starContainer: {
        marginHorizontal: 2,
    },
});

export default RatingStars;
