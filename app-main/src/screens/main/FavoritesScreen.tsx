import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../services/AuthContext';
import { subscribeToFavorites } from '../../services/favorites';
import { FavoriteButton } from '../../components/FavoriteButton';

interface Event {
    id: string;
    title: string;
    date: Date;
    location: string;
    imageUrl?: string;
    price?: number;
}

export const FavoritesScreen: React.FC = () => {
    const navigation = useNavigation();
    const { user } = useAuth();
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

    useEffect(() => {
        if (!user?.id) return;

        // Subscribe to favorites changes
        const unsubscribe = subscribeToFavorites(
            user.id,
            (eventIds) => {
                setFavoriteIds(eventIds);
                loadFavoriteEvents(eventIds);
            },
            (error) => console.error('Favorites subscription error:', error)
        );

        return () => unsubscribe();
    }, [user?.id]);

    const loadFavoriteEvents = async (eventIds: string[]) => {
        if (eventIds.length === 0) {
            setEvents([]);
            setLoading(false);
            setRefreshing(false);
            return;
        }

        try {
          // Postgres 'in' has no 10-item limit, so no batching needed
          const { data, error } = await supabase
          .from('events')
          .select('*')
          .in('id', eventIds);

      if (error) throw error;

      const allEvents: Event[] = (data || []).map((row) => ({
          id: row.id,
          title: row.title || 'Untitled Event',
          date: row.event_date ? new Date(row.event_date) : new Date(),
          location: row.location || row.venue?.name || row.venue || 'No location',
          imageUrl: row.image_url || row.poster_url,
          price: row.price || (row.price_options?.[0]?.price || 0),
      }));

            // Sort by date (nearest first)
            allEvents.sort((a, b) => a.date.getTime() - b.date.getTime());
            setEvents(allEvents);
        } catch (error) {
            console.error('Error loading favorite events:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        loadFavoriteEvents(favoriteIds);
    };

    const handleEventPress = (event: Event) => {
        navigation.navigate('EventDetail' as never, { eventId: event.id } as never);
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#667eea" />
                    <Text style={styles.loadingText}>Loading favorites...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <LinearGradient
                colors={['#667eea', '#764ba2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <View style={styles.headerContent}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={styles.backButton}
                    >
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>My Favorites</Text>
                    <View style={{ width: 40 }} />
                </View>
            </LinearGradient>

            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                }
            >
                {events.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <View style={styles.emptyIcon}>
                            <Ionicons name="heart-outline" size={64} color="#cbd5e0" />
                        </View>
                        <Text style={styles.emptyTitle}>No Favorites Yet</Text>
                        <Text style={styles.emptyDescription}>
                            Start adding events to your favorites by tapping the heart icon on events you love!
                        </Text>
                    </View>
                ) : (
                    <View style={styles.eventsContainer}>
                        <Text style={styles.sectionTitle}>
                            {events.length} {events.length === 1 ? 'Event' : 'Events'}
                        </Text>
                        {events.map((event) => (
                            <TouchableOpacity
                                key={event.id}
                                style={styles.eventCard}
                                onPress={() => handleEventPress(event)}
                                activeOpacity={0.7}
                            >
                                <LinearGradient
                                    colors={['#f093fb', '#f5576c']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={styles.eventGradient}
                                >
                                    <Ionicons name="heart" size={32} color="#fff" />
                                </LinearGradient>

                                <View style={styles.eventInfo}>
                                    <Text style={styles.eventTitle} numberOfLines={2}>
                                        {event.title}
                                    </Text>
                                    <View style={styles.eventDetails}>
                                        <View style={styles.eventDetailRow}>
                                            <Ionicons name="calendar" size={16} color="#667eea" />
                                            <Text style={styles.eventDetailText}>
                                                {event.date.toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric',
                                                })}
                                            </Text>
                                        </View>
                                        <View style={styles.eventDetailRow}>
                                            <Ionicons name="location" size={16} color="#f093fb" />
                                            <Text style={styles.eventDetailText} numberOfLines={1}>
                                                {event.location}
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                <FavoriteButton
                                    eventId={event.id}
                                    size={24}
                                    color="#ff6b6b"
                                    style={styles.favoriteButton}
                                />
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 24,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 10,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#fff',
    },
    scrollView: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        fontWeight: '600',
        color: '#666',
    },
    eventsContainer: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#666',
        marginBottom: 16,
    },
    eventCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    eventGradient: {
        width: 64,
        height: 64,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    eventInfo: {
        flex: 1,
        marginLeft: 16,
    },
    eventTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1a1a1a',
        marginBottom: 8,
    },
    eventDetails: {
        gap: 4,
    },
    eventDetailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    eventDetailText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
        flex: 1,
    },
    favoriteButton: {
        marginLeft: 8,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 80,
        paddingHorizontal: 40,
    },
    emptyIcon: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    emptyTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#1a1a1a',
        marginBottom: 12,
        textAlign: 'center',
    },
    emptyDescription: {
        fontSize: 16,
        fontWeight: '500',
        color: '#666',
        textAlign: 'center',
        lineHeight: 24,
    },
});
