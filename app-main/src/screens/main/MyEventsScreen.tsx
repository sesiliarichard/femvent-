import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../services/AuthContext';
import { useCurrentEvent } from '../../services/EventContext';

interface RegisteredEvent {
    ticketId: string;
    ticketType: string;
    eventId: string;
    title: string;
    eventDate: string | null;
    location: string | null;
}

export const MyEventsScreen: React.FC = () => {
    const navigation = useNavigation();
    const { user } = useAuth();
    const { setCurrentEvent } = useCurrentEvent();
    const [events, setEvents] = useState<RegisteredEvent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user?.id) return;
        loadMyEvents();
    }, [user?.id]);

    const loadMyEvents = async () => {
        try {
            const { data, error } = await supabase
                .from('tickets')
                .select('id, ticket_type, event_id, events(id, title, event_date, location)')
                .eq('user_id', user!.id)
                .eq('status', 'confirmed');

            if (error) throw error;

            const mapped: RegisteredEvent[] = (data || [])
                .filter((row: any) => row.events)
                .map((row: any) => ({
                    ticketId: row.id,
                    ticketType: row.ticket_type,
                    eventId: row.events.id,
                    title: row.events.title,
                    eventDate: row.events.event_date,
                    location: row.events.location,
                }));

            setEvents(mapped);

            // Auto-select if exactly one registered event
            if (mapped.length === 1) {
                await selectEvent(mapped[0]);
            }
        } catch (error) {
            console.error('Error loading my events:', error);
        } finally {
            setLoading(false);
        }
    };

    const selectEvent = async (event: RegisteredEvent) => {
        await setCurrentEvent({ id: event.eventId, title: event.title });
        (navigation as any).navigate('Main', { screen: 'Tabs', params: { screen: 'Home' } });
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#667eea" />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <LinearGradient colors={['#667eea', '#764ba2']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
                <Text style={styles.headerTitle}>My Events</Text>
                <Text style={styles.headerSubtitle}>Events you're registered for</Text>
            </LinearGradient>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {events.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="calendar-outline" size={64} color="#cbd5e0" />
                        <Text style={styles.emptyTitle}>No registered events yet</Text>
                        <Text style={styles.emptyDescription}>
                            Browse events and register to see them here.
                        </Text>
                        <TouchableOpacity
                            style={styles.browseButton}
                            onPress={() => (navigation as any).navigate('Events')}
                        >
                            <Text style={styles.browseButtonText}>Browse Events</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.listContainer}>
                        {events.map((event) => (
                            <TouchableOpacity
                                key={event.ticketId}
                                style={styles.card}
                                onPress={() => selectEvent(event)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.cardIcon}>
                                    <Ionicons name="checkmark-circle" size={22} color="#43e97b" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.eventTitle}>{event.title}</Text>
                                    <Text style={styles.eventMeta}>
                                        {event.ticketType}
                                        {event.location ? ` · ${event.location}` : ''}
                                    </Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color="#999" />
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        paddingHorizontal: 20, paddingTop: 20, paddingBottom: 24,
        borderBottomLeftRadius: 32, borderBottomRightRadius: 32,
        shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 10,
    },
    headerTitle: { fontSize: 24, fontWeight: '800', color: '#fff' },
    headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
    scrollView: { flex: 1 },
    listContainer: { padding: 20 },
    card: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 18,
        padding: 16, marginBottom: 12,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
    },
    cardIcon: { marginRight: 14 },
    eventTitle: { fontSize: 16, fontWeight: '800', color: '#1a1a1a' },
    eventMeta: { fontSize: 13, color: '#666', marginTop: 2 },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 80, paddingHorizontal: 40, gap: 8 },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a1a', marginTop: 8 },
    emptyDescription: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 16 },
    browseButton: { backgroundColor: '#667eea', borderRadius: 16, paddingVertical: 14, paddingHorizontal: 32 },
    browseButtonText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});