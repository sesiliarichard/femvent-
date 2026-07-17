import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export const FeedbackScreen: React.FC = () => {
    const navigation = useNavigation();
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async () => {
        if (rating === 0) {
            Alert.alert('Add a rating', 'Please select a star rating before submitting.');
            return;
        }

        setSubmitting(true);
        try {
            // TODO: replace with Supabase insert once a `feedback` table exists
            // await supabase.from('feedback').insert({ event_id: eventId, user_id: user.id, rating, comment });
            await new Promise((resolve) => setTimeout(resolve, 600));
            setSubmitted(true);
        } catch (error) {
            console.error('Error submitting feedback:', error);
            Alert.alert('Error', 'Failed to submit feedback. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (submitted) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.successContainer}>
                    <View style={styles.successIcon}>
                        <Ionicons name="checkmark-circle" size={72} color="#43e97b" />
                    </View>
                    <Text style={styles.successTitle}>Thank you!</Text>
                    <Text style={styles.successText}>Your feedback helps us make future events better.</Text>
                    <TouchableOpacity style={styles.doneButton} onPress={() => navigation.goBack()}>
                        <Text style={styles.doneButtonText}>Done</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <LinearGradient colors={['#667eea', '#764ba2']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Feedback</Text>
                    <View style={{ width: 40 }} />
                </View>
            </LinearGradient>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                <View style={styles.section}>
                    <Text style={styles.prompt}>How was your experience?</Text>
                    <View style={styles.starsRow}>
                        {[1, 2, 3, 4, 5].map((star) => (
                            <TouchableOpacity key={star} onPress={() => setRating(star)}>
                                <Ionicons
                                    name={star <= rating ? 'star' : 'star-outline'}
                                    size={40}
                                    color="#fbbf24"
                                    style={{ marginHorizontal: 4 }}
                                />
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={styles.label}>Tell us more (optional)</Text>
                    <TextInput
                        style={styles.textArea}
                        placeholder="What went well? What could be improved?"
                        placeholderTextColor="#999"
                        value={comment}
                        onChangeText={setComment}
                        multiline
                        numberOfLines={6}
                    />

                    <TouchableOpacity
                        style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                        onPress={handleSubmit}
                        disabled={submitting}
                    >
                        {submitting ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Text style={styles.submitButtonText}>Submit Feedback</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    header: {
        paddingHorizontal: 20, paddingTop: 20, paddingBottom: 24,
        borderBottomLeftRadius: 32, borderBottomRightRadius: 32,
        shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 10,
    },
    headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 24, fontWeight: '800', color: '#fff' },
    scrollView: { flex: 1 },
    section: { padding: 24 },
    prompt: { fontSize: 18, fontWeight: '800', color: '#1a1a1a', textAlign: 'center', marginBottom: 20 },
    starsRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 32 },
    label: { fontSize: 13, fontWeight: '700', color: '#666', marginBottom: 10 },
    textArea: {
        backgroundColor: '#fff', borderRadius: 16, padding: 16, fontSize: 15, color: '#1a1a1a',
        height: 140, textAlignVertical: 'top', marginBottom: 24,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
    },
    submitButton: {
        backgroundColor: '#667eea', borderRadius: 16, paddingVertical: 16, alignItems: 'center',
    },
    submitButtonDisabled: { opacity: 0.7 },
    submitButtonText: { fontSize: 16, fontWeight: '700', color: '#fff' },
    successContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    successIcon: { marginBottom: 20 },
    successTitle: { fontSize: 24, fontWeight: '800', color: '#1a1a1a', marginBottom: 8 },
    successText: { fontSize: 15, color: '#666', textAlign: 'center', marginBottom: 32, lineHeight: 22 },
    doneButton: { backgroundColor: '#667eea', borderRadius: 16, paddingVertical: 14, paddingHorizontal: 48 },
    doneButtonText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});