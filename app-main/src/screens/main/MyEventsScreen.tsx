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
    ticketStatus: string;
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
                .select('id, ticket_type, status, event_id, events(id, title, event_date, location)')
                .eq('user_id', user!.id)
                .in('status', ['confirmed', 'pending']);

            if (error) throw error;

            const mapped: RegisteredEvent[] = (data || [])
                .filter((row: any) => row.events)
                .map((row: any) => ({
                    ticketId: row.id,
                    ticketType: row.ticket_type,
                    ticketStatus: row.status,
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

    const formatEventDate = (dateStr: string | null) => {
        if (!dateStr) return null;
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return null;
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#5A4485" />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
                                          <LinearGradient colors={['#5A4485', '#3d2d5c']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
                <View style={styles.headerTop}>
                    <View>
                        <Text style={styles.headerTitle}>My Events</Text>
                        <Text style={styles.headerSubtitle}>Events you're registered for</Text>
                    </View>
                    <View style={styles.headerIcon}>
                        <Ionicons name="calendar" size={18} color="#fff" />
                    </View>
                </View>
                {events.length > 0 && (
                    <View style={styles.statPill}>
                        <Ionicons name="ticket-outline" size={13} color="#fff" />
                        <Text style={styles.statPillText}>
                            {events.length} {events.length === 1 ? 'event' : 'events'}
                        </Text>
                    </View>
                )}
            </LinearGradient>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {events.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="calendar-outline" size={64} color="#cbd5e0" />
                        <Text style={styles.emptyTitle}>No registered events yet</Text>
                        <Text style={styles.emptyDescription}>
                            Events you register for will appear here. Sign in with the same email you used to register.
                        </Text>
                    </View>
                ) : (
                    <View style={styles.listContainer}>
                        {events.map((event) => (
                                 <TouchableOpacity
                                 key={event.ticketId}
                                 style={[
                                     styles.card,
                                     { borderLeftColor: event.ticketStatus === 'confirmed' ? '#43e97b' : '#f59e0b' }
                                 ]}
                                 onPress={() => selectEvent(event)}
                                 activeOpacity={0.7}
                             >
                                 <View style={[
                                     styles.cardIcon,
                                     { backgroundColor: event.ticketStatus === 'confirmed' ? '#e8fbf0' : '#fef6e7' }
                                 ]}>
                                     <Ionicons
                                         name={event.ticketStatus === 'confirmed' ? 'checkmark-circle' : 'time-outline'}
                                         size={20}
                                         color={event.ticketStatus === 'confirmed' ? '#10b981' : '#f59e0b'}
                                     />
                                 </View>
                                 <View style={{ flex: 1 }}>
                                     <Text style={styles.eventTitle}>{event.title}</Text>
                                     <View style={styles.metaRow}>
                                         {formatEventDate(event.eventDate) && (
                                             <View style={styles.metaItem}>
                                                 <Ionicons name="calendar-outline" size={12} color="#999" />
                                                 <Text style={styles.metaText}>{formatEventDate(event.eventDate)}</Text>
                                             </View>
                                         )}
                                         {event.location && (
                                             <View style={styles.metaItem}>
                                                 <Ionicons name="location-outline" size={12} color="#999" />
                                                 <Text style={styles.metaText}>{event.location}</Text>
                                             </View>
                                         )}
                                     </View>
                                     <View style={[
                                         styles.statusBadge,
                                         { backgroundColor: event.ticketStatus === 'confirmed' ? '#e8fbf0' : '#fef6e7' }
                                     ]}>
                                         <Text style={[
                                             styles.statusBadgeText,
                                             { color: event.ticketStatus === 'confirmed' ? '#0a9463' : '#b45309' }
                                         ]}>
                                             {event.ticketStatus === 'confirmed' ? 'Confirmed' : 'Pending approval'}
                                         </Text>
                                     </View>
                                 </View>
                                 <Ionicons name="chevron-forward" size={18} color="#c7c7c7" />
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
        padding: 16, marginBottom: 12, borderLeftWidth: 4,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
    },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    headerIcon: {
        width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.18)',
        justifyContent: 'center', alignItems: 'center',
    },
    statPill: {
        flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
        backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 6, marginTop: 14,
    },
    statPillText: { fontSize: 12, fontWeight: '600', color: '#fff' },
    cardIcon: {
        width: 42, height: 42, borderRadius: 14, marginRight: 12,
        justifyContent: 'center', alignItems: 'center',
    },
    eventTitle: { fontSize: 15, fontWeight: '800', color: '#1a1a1a', marginBottom: 4 },
    metaRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaText: { fontSize: 12, color: '#777', fontWeight: '500' },
    statusBadge: { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 9, paddingVertical: 3, marginTop: 6 },
    statusBadgeText: { fontSize: 11, fontWeight: '700' },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 80, paddingHorizontal: 40, gap: 8 },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a1a', marginTop: 8 },
    emptyDescription: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 16 },
    browseButton: { backgroundColor: '#5A4485', borderRadius: 16, paddingVertical: 14, paddingHorizontal: 32 },
    browseButtonText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});