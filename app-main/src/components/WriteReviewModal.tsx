/**
 * WriteReviewModal Component
 * Modal for submitting event reviews
 */

import React, { useState } from 'react';
import {
    Modal,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RatingStars } from './RatingStars';
import { submitReview } from '../services/reviews';
import { useAuth } from '../services/AuthContext';

interface WriteReviewModalProps {
    visible: boolean;
    eventId: string;
    eventTitle: string;
    onClose: () => void;
    onSubmitSuccess: () => void;
}

export const WriteReviewModal: React.FC<WriteReviewModalProps> = ({
    visible,
    eventId,
    eventTitle,
    onClose,
    onSubmitSuccess,
}) => {
    const { user } = useAuth();
    const [rating, setRating] = useState(0);
    const [reviewText, setReviewText] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (rating === 0) {
            Alert.alert('Rating Required', 'Please select a star rating');
            return;
        }

        if (!reviewText.trim()) {
            Alert.alert('Review Required', 'Please write a review');
            return;
        }

        if (!user) {
            Alert.alert('Error', 'You must be logged in to submit a review');
            return;
        }

        setSubmitting(true);
        try {
            await submitReview(
                eventId,
                user.uid,
                user.displayName || 'Anonymous',
                user.photoURL,
                rating,
                reviewText.trim()
            );

            Alert.alert('Success', 'Your review has been submitted!');
            setRating(0);
            setReviewText('');
            onSubmitSuccess();
            onClose();
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to submit review');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                style={styles.modalContainer}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        {/* Header */}
                        <View style={styles.header}>
                            <View>
                                <Text style={styles.headerTitle}>Write Review</Text>
                                <Text style={styles.headerSubtitle}>{eventTitle}</Text>
                            </View>
                            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                <Ionicons name="close" size={24} color="#64748b" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                            {/* Rating Section */}
                            <View style={styles.section}>
                                <Text style={styles.sectionLabel}>Your Rating</Text>
                                <RatingStars
                                    rating={rating}
                                    size={40}
                                    interactive
                                    onRatingChange={setRating}
                                />
                                {rating > 0 && (
                                    <Text style={styles.ratingText}>
                                        {rating === 5 ? 'Excellent!' : rating === 4 ? 'Great!' : rating === 3 ? 'Good' : rating === 2 ? 'Fair' : 'Poor'}
                                    </Text>
                                )}
                            </View>

                            {/* Review Text */}
                            <View style={styles.section}>
                                <Text style={styles.sectionLabel}>Your Review</Text>
                                <TextInput
                                    style={styles.textInput}
                                    placeholder="Share your experience at this event..."
                                    placeholderTextColor="#94a3b8"
                                    multiline
                                    numberOfLines={6}
                                    value={reviewText}
                                    onChangeText={setReviewText}
                                    maxLength={500}
                                />
                                <Text style={styles.charCount}>{reviewText.length}/500</Text>
                            </View>

                            {/* Tips */}
                            <View style={styles.tipsBox}>
                                <Ionicons name="bulb-outline" size={20} color="#F59E0B" />
                                <Text style={styles.tipsText}>
                                    Help others by sharing what you liked and what could be improved!
                                </Text>
                            </View>
                        </ScrollView>

                        {/* Footer */}
                        <View style={styles.footer}>
                            <TouchableOpacity
                                style={[styles.button, styles.cancelButton]}
                                onPress={onClose}
                                disabled={submitting}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.button,
                                    styles.submitButton,
                                    (submitting || rating === 0) && styles.submitButtonDisabled,
                                ]}
                                onPress={handleSubmit}
                                disabled={submitting || rating === 0}
                            >
                                {submitting ? (
                                    <Text style={styles.submitButtonText}>Submitting...</Text>
                                ) : (
                                    <Text style={styles.submitButtonText}>Submit Review</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '90%',
        paddingBottom: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1E293B',
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#64748B',
        marginTop: 2,
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        padding: 20,
    },
    section: {
        marginBottom: 24,
    },
    sectionLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1E293B',
        marginBottom: 12,
    },
    ratingText: {
        marginTop: 12,
        fontSize: 16,
        fontWeight: '600',
        color: '#F59E0B',
    },
    textInput: {
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        padding: 16,
        fontSize: 15,
        color: '#1E293B',
        textAlignVertical: 'top',
        minHeight: 120,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    charCount: {
        textAlign: 'right',
        marginTop: 8,
        fontSize: 12,
        color: '#94A3B8',
    },
    tipsBox: {
        flexDirection: 'row',
        backgroundColor: '#FEF3C7',
        padding: 12,
        borderRadius: 12,
        alignItems: 'center',
        gap: 12,
    },
    tipsText: {
        flex: 1,
        fontSize: 13,
        color: '#92400E',
    },
    footer: {
        flexDirection: 'row',
        padding: 20,
        gap: 12,
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
    },
    button: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#F1F5F9',
    },
    cancelButtonText: {
        color: '#475569',
        fontSize: 16,
        fontWeight: '600',
    },
    submitButton: {
        backgroundColor: '#6366F1',
    },
    submitButtonDisabled: {
        backgroundColor: '#CBD5E1',
    },
    submitButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default WriteReviewModal;
