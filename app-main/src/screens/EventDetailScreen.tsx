import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  TouchableOpacity,
  Dimensions,
  Animated,
  BackHandler,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  Card,
  Text,
  Chip,
  Button,
  Divider,
  ActivityIndicator,
  Surface,
} from 'react-native-paper';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useAuth } from '../services/AuthContext';
import { registerForEvent, checkEventRegistration } from '../services/registration';
import { supabase } from '../services/supabase';
import { EventSplashScreen } from '../components/EventSplashScreen';
import { WaitlistButton } from '../components/WaitlistButton';
import { VenueLocationCard } from '../components/VenueLocationCard';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

interface EventDetailScreenProps {
  route: {
    params: {
      eventId: string;
    };
  };
  navigation: any;
}

export default function EventDetailScreen({ route, navigation }: EventDetailScreenProps) {
  const { eventId } = route.params;
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(false);
  const { user } = useAuth();
  const [isRegistered, setIsRegistered] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [attendeeCount, setAttendeeCount] = useState({ total: 0, confirmed: 0, pending: 0 });
  const [expandedSchedule, setExpandedSchedule] = useState<number | null>(null);
  const insets = useSafeAreaInsets();
  const scrollY = new Animated.Value(0);

  // Handle hardware back button
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
        return true; // Prevent default back behavior
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [navigation])
  );

// Real-time event listener for live updates
useEffect(() => {
  if (!eventId) {
    Alert.alert('Error', 'No event ID provided');
    navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    return;
  }

  const applyEventRow = (row: any) => {
    const updatedEvent = {
      id: row.id,
      ...row,
      createdAt: row.created_at ? new Date(row.created_at) : undefined,
      date: row.event_date ? new Date(row.event_date) : (row.start_at ? new Date(row.start_at) : undefined),
      startAt: row.start_at ? new Date(row.start_at) : undefined,
      endAt: row.end_at ? new Date(row.end_at) : undefined,
      // Field mapping for compatibility
      location: row.location || row.venue?.name || row.venue || 'Online',
      maxAttendees: row.max_attendees || row.capacity || 0,
      currentAttendees: row.current_attendees || 0,
      price: row.price || (row.price_options?.[0]?.price || 0),
      currency: row.currency || row.price_options?.[0]?.currency || 'USD',
      category: row.category || row.type || 'general',
      tags: row.tags || [],
      organizerName: row.organizer_name || 'Event Organizer',
      isActive: row.is_active !== undefined ? row.is_active : (row.is_published !== false),
      posterURL: row.poster_url,
    };
    setEvent(updatedEvent);
    setAttendeeCount({
      total: row.current_attendees || 0,
      confirmed: row.current_attendees || 0,
      pending: 0,
    });
    if (loading) {
      setShowSplash(true);
    }
    setLoading(false);
  };

  const fetchEvent = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        applyEventRow(data);
      } else {
        Alert.alert('Error', 'Event not found');
        navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
        setLoading(false);
      }
    } catch (error: any) {
      console.error('Error loading event:', error);
      Alert.alert('Error', `Failed to load event: ${error.message || 'Unknown error'}`, [
        { text: 'Go Back', onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Main' }] }) },
        { text: 'Retry', onPress: () => setLoading(true) },
      ]);
      setLoading(false);
    }
  };

  fetchEvent();

  const channel = supabase
    .channel(`event-detail-${eventId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'events', filter: `id=eq.${eventId}` },
      (payload) => {
        if (payload.new) {
          applyEventRow(payload.new);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [eventId, navigation]);

  useEffect(() => {
    const checkRegistration = async () => {
      if (user?.id && event?.id) {
        try {
          const registered = await checkEventRegistration(event.id, user.id);
          setIsRegistered(registered);

          // Set attendee count from event data (same for all users)
          setAttendeeCount({
            total: event.currentAttendees || 0,
            confirmed: event.currentAttendees || 0,
            pending: 0,
          });
        } catch (error) {
          console.error('Error checking registration:', error);
        }
      }
    };

    checkRegistration();
  }, [user, event]);

  const handleRegister = async () => {
    if (!user) {
      Alert.alert('Login Required', 'You must be logged in to register for events');
      return;
    }

    if (isRegistered) {
      Alert.alert('Already Registered', 'You are already registered for this event');
      return;
    }

    if (!event?.id) {
      Alert.alert('Error', 'Event information is not available');
      return;
    }

    setIsRegistering(true);
    try {
      await registerForEvent({
        eventId: event.id,
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        userPhotoURL: user.photoURL,
      });

      setIsRegistered(true);
      // Note: Attendee count will be updated when admin confirms payment on web
      // We don't update it here because ticket is pending

      Alert.alert(
        'Registration Submitted',
        'Your registration has been submitted successfully! Admin will process your payment and confirm your ticket.',
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      console.error('Registration error:', error);
      
      // Provide specific error messages
      let errorMessage = 'Failed to register for event. Please try again.';
      if (error.code === 'unavailable') {
        errorMessage = 'No internet connection. Please check your network and try again.';
      } else if (error.code === 'permission-denied') {
        errorMessage = 'You do not have permission to register for this event.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Registration Failed', errorMessage);
    } finally {
      setIsRegistering(false);
    }
  };

  const toggleFavorite = () => {
    setIsFavorited(!isFavorited);
    Alert.alert(
      isFavorited ? 'Removed' : 'Added',
      isFavorited
        ? 'Event removed from favorites'
        : 'Event added to your favorites'
    );
  };

  if (showSplash && event && !loading) {
    return (
      <EventSplashScreen
        event={{
          id: event.id,
          title: event.title,
          description: event.description,
          posterURL: event.posterURL,
          logoURL: event.logoURL,
        }}
        onContinue={() => setShowSplash(false)}
        onSkip={() => setShowSplash(false)}
      />
    );
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading event details...</Text>
        </View>
      </View>
    );
  }

  if (!event) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Ionicons name="calendar-outline" size={64} color="#cbd5e1" />
        <Text style={styles.emptyStateText}>Event not found</Text>
        <Button mode="contained" onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Main' }] })} style={styles.goBackButton}>
          Go Back
        </Button>
      </View>
    );
  }

  const scheduleItems = [
    { id: 1, time: '08:00 AM', title: 'Registration Opens', desc: 'Welcome and registration desk opens for all attendees', color: '#8b5cf6' },
    { id: 2, time: '09:00 AM', title: 'Welcome Keynote', desc: 'Opening keynote by Dr. Sarah Johnson exploring future trends', color: '#6366f1' },
    { id: 3, time: '10:10 AM', title: 'AI Innovation Panel', desc: 'Interactive discussion on creative approaches to artificial intelligence', color: '#10b981' },
    { id: 4, time: '11:30 AM', title: 'Workshop Session', desc: 'Hands-on workshop: Building AI systems in real-time', color: '#f59e0b' },
  ];

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      {/* Enhanced Animated Header */}
      <Animated.View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 12,
            opacity: headerOpacity,
          }
        ]}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Main' }] })}
          >
            <Ionicons name="arrow-back" size={22} color="#1e293b" />
          </TouchableOpacity>

          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle} numberOfLines={1}>{event.title}</Text>
          </View>

          <TouchableOpacity
            style={styles.headerButton}
            onPress={toggleFavorite}
          >
            <Ionicons
              name={isFavorited ? "heart" : "heart-outline"}
              size={22}
              color={isFavorited ? "#ef4444" : "#64748b"}
            />
          </TouchableOpacity>
        </View>
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
      >
        {/* Hero Section with Gradient */}
        <LinearGradient
          colors={['#6366f1', '#8b5cf6', '#ec4899']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroGradient}
        >
          <View style={styles.heroContent}>
            <View style={styles.heroBadge}>
              <Ionicons name="calendar" size={14} color="#6366f1" />
              <Text style={styles.heroBadgeText}>{event.category || 'EVENT'}</Text>
            </View>
            <Text style={styles.heroTitle}>{event.title}</Text>
            <View style={styles.heroMeta}>
              <View style={styles.heroMetaItem}>
                <Ionicons name="time-outline" size={16} color="rgba(255,255,255,0.9)" />
                <Text style={styles.heroMetaText}>
                  {event.startAt ? new Date(event.startAt.seconds * 1000).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                  }) : 'TBD'}
                </Text>
              </View>
              <View style={styles.heroMetaDivider} />
              <View style={styles.heroMetaItem}>
                <Ionicons name="location-outline" size={16} color="rgba(255,255,255,0.9)" />
                <Text style={styles.heroMetaText}>{event.location || 'Online'}</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          {/* Quick Stats Card */}
          <View style={styles.statsCard}>
            <View style={styles.statBox}>
              <View style={[styles.statIconContainer, { backgroundColor: '#eff6ff' }]}>
                <Ionicons name="people" size={24} color="#3b82f6" />
              </View>
              <Text style={styles.statValue}>{attendeeCount.total || 0}</Text>
              <Text style={styles.statLabel}>Attendees</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statBox}>
              <View style={[styles.statIconContainer, { backgroundColor: '#f0fdf4' }]}>
                <Ionicons name="pricetag" size={24} color="#22c55e" />
              </View>
              <Text style={styles.statValue}>
                {event.price ? `${event.currency || '$'}${event.price}` : 'Free'}
              </Text>
              <Text style={styles.statLabel}>Price</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statBox}>
              <View style={[styles.statIconContainer, { backgroundColor: '#fef3c7' }]}>
                <Ionicons name="calendar" size={24} color="#f59e0b" />
              </View>
              <Text style={styles.statValue}>
                {event.startAt ? new Date(event.startAt.seconds * 1000).toLocaleDateString('en-US', {
                  day: 'numeric'
                }) : '—'}
              </Text>
              <Text style={styles.statLabel}>Day</Text>
            </View>
          </View>

          {/* Registration CTA */}
          <TouchableOpacity
            style={[
              styles.ctaButton,
              isRegistered && styles.ctaButtonRegistered
            ]}
            onPress={handleRegister}
            disabled={isRegistering || isRegistered}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={isRegistered ? ['#10b981', '#059669'] : ['#6366f1', '#8b5cf6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaGradient}
            >
              <View style={styles.ctaContent}>
                <Ionicons
                  name={isRegistered ? "checkmark-circle" : "ticket"}
                  size={24}
                  color="#ffffff"
                />
                <Text style={styles.ctaText}>
                  {isRegistered ? 'Already Registered' : isRegistering ? 'Processing...' : 'Register Now'}
                </Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Waitlist Button (shows when sold out) */}
          <WaitlistButton
            eventId={event.id}
            eventTitle={event.title}
            isSoldOut={event.soldOut || event.currentAttendees >= event.maxAttendees}
          />

          {/* Venue Location Section */}
          <View style={styles.section}>
            <VenueLocationCard
              venue={event.venue}
              location={event.location}
              eventTitle={event.title}
            />
          </View>

          {/* About Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About Event</Text>
            <View style={styles.aboutCard}>
              <Text style={styles.aboutText}>
                {event.description || 'Join us for an exciting event exploring the intersection of technology and innovation. Network with industry leaders and discover the latest trends.'}
              </Text>
            </View>
          </View>

          {/* Event Schedule */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Event Schedule</Text>
              <Chip
                mode="outlined"
                style={styles.scheduleChip}
                textStyle={styles.scheduleChipText}
              >
                {scheduleItems.length} Sessions
              </Chip>
            </View>

            <View style={styles.scheduleList}>
              {scheduleItems.map((item, index) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.scheduleItemContainer}
                  onPress={() => setExpandedSchedule(expandedSchedule === index ? null : index)}
                  activeOpacity={0.7}
                >
                  <View style={styles.scheduleItemLeft}>
                    <View style={[styles.scheduleTimeBadge, { backgroundColor: item.color }]}>
                      <Text style={styles.scheduleTime}>{item.time}</Text>
                    </View>
                    {index < scheduleItems.length - 1 && (
                      <View style={[styles.scheduleConnector, { backgroundColor: item.color + '40' }]} />
                    )}
                  </View>

                  <View style={styles.scheduleItemRight}>
                    <View style={styles.scheduleItemCard}>
                      <View style={styles.scheduleItemHeader}>
                        <Text style={styles.scheduleItemTitle}>{item.title}</Text>
                        <Ionicons
                          name={expandedSchedule === index ? "chevron-up" : "chevron-down"}
                          size={20}
                          color="#94a3b8"
                        />
                      </View>
                      {expandedSchedule === index && (
                        <Text style={styles.scheduleItemDesc}>{item.desc}</Text>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Quick Navigation */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Explore More</Text>
            <View style={styles.quickNavGrid}>
              <TouchableOpacity
                style={styles.quickNavItem}
                onPress={() => navigation.navigate('Schedule', { eventId: event.id })}
              >
                <View style={[styles.quickNavIcon, { backgroundColor: '#eff6ff' }]}>
                  <Ionicons name="calendar-outline" size={24} color="#3b82f6" />
                </View>
                <Text style={styles.quickNavLabel}>Full Schedule</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickNavItem}
                onPress={() => navigation.navigate('SpeakersList', { eventId: event.id })}
              >
                <View style={[styles.quickNavIcon, { backgroundColor: '#f0fdf4' }]}>
                  <Ionicons name="people-outline" size={24} color="#22c55e" />
                </View>
                <Text style={styles.quickNavLabel}>Speakers</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickNavItem}
                onPress={() => navigation.navigate('Sponsor', { eventId: event.id })}
              >
                <View style={[styles.quickNavIcon, { backgroundColor: '#fef3c7' }]}>
                  <Ionicons name="business-outline" size={24} color="#f59e0b" />
                </View>
                <Text style={styles.quickNavLabel}>Partners</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickNavItem}
                onPress={() => navigation.navigate('Chat', { eventId: event.id })}
              >
                <View style={[styles.quickNavIcon, { backgroundColor: '#fce7f3' }]}>
                  <Ionicons name="chatbubble-outline" size={24} color="#ec4899" />
                </View>
                <Text style={styles.quickNavLabel}>Chat</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Event Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Event Information</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <View style={[styles.infoIcon, { backgroundColor: '#eff6ff' }]}>
                  <Ionicons name="calendar-outline" size={20} color="#3b82f6" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Date & Time</Text>
                  <Text style={styles.infoValue}>
                    {event.date ? new Date(event.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : 'To be announced'}
                  </Text>
                </View>
              </View>

              <Divider style={styles.infoDivider} />

              <View style={styles.infoRow}>
                <View style={[styles.infoIcon, { backgroundColor: '#f0fdf4' }]}>
                  <Ionicons name="person-outline" size={20} color="#22c55e" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Organized By</Text>
                  <Text style={styles.infoValue}>{event.organizerName || 'Event Host'}</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.bottomSpacer} />
        </View>
      </ScrollView>

      {/* Enhanced Bottom Navigation */}
      <View style={[styles.bottomNav, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity style={[styles.navItem, styles.navItemActive]}>
          <Ionicons name="home" size={24} color="#6366f1" />
          <Text style={[styles.navLabel, styles.navLabelActive]}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('Schedule', { eventId: event.id })}
        >
          <Ionicons name="calendar-outline" size={24} color="#94a3b8" />
          <Text style={styles.navLabel}>Schedule</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('SpeakersList', { eventId: event.id })}
        >
          <Ionicons name="people-outline" size={24} color="#94a3b8" />
          <Text style={styles.navLabel}>Speakers</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('Sponsor', { eventId: event.id })}
        >
          <Ionicons name="business-outline" size={24} color="#94a3b8" />
          <Text style={styles.navLabel}>Partners</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('Chat', { eventId: event.id })}
        >
          <Ionicons name="chatbubble-outline" size={24} color="#94a3b8" />
          <Text style={styles.navLabel}>Chat</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#475569',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyStateText: {
    color: '#475569',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 24,
  },
  goBackButton: {
    borderRadius: 12,
    paddingHorizontal: 24,
  },
  header: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 12,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
    marginHorizontal: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  scrollView: {
    flex: 1,
  },
  heroGradient: {
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 40,
  },
  heroContent: {
    alignItems: 'center',
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
  },
  heroBadgeText: {
    color: '#6366f1',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
    letterSpacing: 1,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 36,
  },
  heroMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroMetaText: {
    color: 'rgba(255,255,255,0.95)',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  heroMetaDivider: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.5)',
    marginHorizontal: 12,
  },
  content: {
    paddingHorizontal: 16,
    marginTop: -20,
  },
  statsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 16,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    height: '100%',
    backgroundColor: '#e2e8f0',
    marginHorizontal: 8,
  },
  ctaButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  ctaButtonRegistered: {
    shadowColor: '#10b981',
  },
  ctaGradient: {
    paddingVertical: 18,
    paddingHorizontal: 24,
  },
  ctaContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
    marginLeft: 12,
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1e293b',
  },
  scheduleChip: {
    backgroundColor: '#f1f5f9',
    borderColor: '#e2e8f0',
  },
  scheduleChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  aboutCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  aboutText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#475569',
    fontWeight: '400',
  },
  scheduleList: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  scheduleItemContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  scheduleItemLeft: {
    alignItems: 'center',
    marginRight: 16,
    width: 80,
  },
  scheduleTimeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    minWidth: 80,
  },
  scheduleTime: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  scheduleConnector: {
    width: 2,
    flex: 1,
    marginTop: 8,
    minHeight: 24,
  },
  scheduleItemRight: {
    flex: 1,
  },
  scheduleItemCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  scheduleItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scheduleItemTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
    flex: 1,
  },
  scheduleItemDesc: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 8,
    lineHeight: 20,
  },
  quickNavGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  quickNavItem: {
    width: '50%',
    padding: 6,
  },
  quickNavIcon: {
    width: '100%',
    height: 100,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  quickNavLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 15,
    color: '#1e293b',
    fontWeight: '600',
  },
  infoDivider: {
    backgroundColor: '#e2e8f0',
    marginVertical: 16,
  },
  bottomSpacer: {
    height: 120,
  },
  bottomNav: {
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingTop: 12,
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
  navItem: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    minWidth: 70,
  },
  navItemActive: {
    backgroundColor: '#eff6ff',
  },
  navLabel: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 4,
    fontWeight: '600',
  },
  navLabelActive: {
    color: '#6366f1',
    fontWeight: '700',
  },
});