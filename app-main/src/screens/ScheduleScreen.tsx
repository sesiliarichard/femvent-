import React, { useState, useEffect } from 'react';
import { BackHandler } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  TextInput,
  Alert,
  Animated,
} from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../services/supabase';

const { width } = Dimensions.get('window');

interface Session {
  id: string;
  time: string;
  duration: string;
  type: 'Keynote' | 'Workshop' | 'Break' | 'Panel' | 'Networking';
  title: string;
  speaker: string;
  location: string;
  description?: string;
  isFavorite?: boolean;
}

interface ScheduleScreenProps {
  navigation: any;
  route?: {
    params?: {
      eventId?: string;
    };
  };
}

export default function ScheduleScreen({ navigation, route }: ScheduleScreenProps) {
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

  const [selectedDay, setSelectedDay] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [eventData, setEventData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const insets = useSafeAreaInsets();
  const scrollY = new Animated.Value(0);

  // Sample schedule data - fallback when no event data
  const sampleScheduleData: Session[] = [
    {
      id: '1',
      time: '9:15 AM - 9:35 AM',
      duration: '20 min',
      type: 'Keynote',
      title: 'Decolonizing AI: Bureaucratic Elites, Feminist Ethos, and Embodied Epistemologies',
      speaker: 'Lilian Njeri Mbuthi',
      location: 'Main Hall',
      description: 'Exploring the intersection of AI development and feminist methodologies in modern technology landscapes.',
    },
    {
      id: '2',
      time: '9:40 AM - 10:40 AM',
      duration: '55 min',
      type: 'Workshop',
      title: 'Story of Self and Power Analysis - A Grounding Exercise',
      speaker: 'Bridget Rhinohart',
      location: 'Main Hall',
      description: 'Interactive workshop on personal narrative and power dynamics in organizational settings.',
    },
    {
      id: '3',
      time: '10:40 AM - 11:25 AM',
      duration: '45 min',
      type: 'Break',
      title: 'Coffee Break & Networking',
      speaker: '',
      location: 'Lobby',
      description: 'Enjoy refreshments and connect with fellow attendees.',
    },
    {
      id: '4',
      time: '11:25 AM - 12:25 PM',
      duration: '60 min',
      type: 'Panel',
      title: 'AI Ethics in Practice: Real-world Challenges',
      speaker: 'Dr. Sarah Johnson, Dr. Maria Rodriguez',
      location: 'Conference Room A',
      description: 'Panel discussion on implementing AI ethics in various industries and addressing contemporary challenges.',
    },
    {
      id: '5',
      time: '12:25 PM - 1:25 PM',
      duration: '60 min',
      type: 'Break',
      title: 'Lunch Break',
      speaker: '',
      location: 'Dining Hall',
      description: 'Lunch and networking opportunities.',
    },
    {
      id: '6',
      time: '1:25 PM - 2:25 PM',
      duration: '60 min',
      type: 'Workshop',
      title: 'Building Inclusive AI Teams',
      speaker: 'Alex Chen',
      location: 'Workshop Room B',
      description: 'Hands-on workshop on creating diverse and inclusive AI development teams for better innovation.',
    },
  ];

// Real-time event data listener
useEffect(() => {
  if (!route?.params?.eventId) {
    setLoading(false);
    return;
  }

  const eventId = route.params.eventId;

  const applyEventRow = (row: any) => {
    try {
      setEventData({
        id: row.id,
        ...row,
        startAt: row.start_at ? new Date(row.start_at) : undefined,
        endAt: row.end_at ? new Date(row.end_at) : undefined,
        createdAt: row.created_at ? new Date(row.created_at) : undefined,
        // Agenda items are stored as jsonb; time values are plain strings/ISO dates
        agenda: row.agenda?.map((item: any) => ({
          ...item,
          time: item.time,
        })) || [],
      });
      setLoading(false);
    } catch (dataError) {
      console.error('Error processing event data:', dataError);
      Alert.alert('Error', 'Failed to process event data');
      setLoading(false);
    }
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
        setLoading(false);
      }
    } catch (error) {
      console.error('Error loading event:', error);
      Alert.alert('Error', 'Failed to load event data. Please check your connection and try again.');
      setLoading(false);
    }
  };

  fetchEvent();

  const channel = supabase
    .channel(`schedule-event-${eventId}`)
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
}, [route?.params?.eventId]);

   // Convert event agenda to session format with improved error handling
   const convertAgendaToSessions = (): Session[] => {
     try {
       // Validate eventData and agenda
       if (!eventData) {
         console.warn('No event data available, using sample schedule');
         return sampleScheduleData;
       }
       
       if (!eventData.agenda) {
         console.warn('No agenda data available, using sample schedule');
         return sampleScheduleData;
       }

       if (!Array.isArray(eventData.agenda)) {
         console.error('Agenda is not an array:', typeof eventData.agenda);
         return sampleScheduleData;
       }

       if (eventData.agenda.length === 0) {
         console.warn('Agenda is empty, using sample schedule');
         return sampleScheduleData;
       }
       
       // Convert each agenda item with comprehensive error handling
       const convertedSessions: Session[] = [];
       
       for (let index = 0; index < eventData.agenda.length; index++) {
         const item = eventData.agenda[index];
         
         try {
           // Validate item structure
           if (!item || typeof item !== 'object') {
             console.warn(`Invalid agenda item at index ${index}, skipping`);
             continue;
           }

           // Handle time conversion - can be Timestamp, Date, or string
           let timeString = 'TBA';
           let timeDate: Date | null = null;
           
           if (item.time) {
             try {
               if (item.time.toDate && typeof item.time.toDate === 'function') {
                 // Firestore Timestamp
                 timeDate = item.time.toDate();
                 if (timeDate instanceof Date && !isNaN(timeDate.getTime())) {
                   timeString = timeDate.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
                   });
                 }
               } else if (item.time instanceof Date) {
                 // Date object
                 timeDate = item.time;
                 if (!isNaN(timeDate.getTime())) {
                   timeString = timeDate.toLocaleTimeString('en-US', {
                     hour: '2-digit',
                     minute: '2-digit',
                     hour12: true
                   });
                 }
               } else if (typeof item.time === 'string') {
                 // Already a string - validate it's a valid time format
                 const testDate = new Date(`2000-01-01 ${item.time}`);
                 if (!isNaN(testDate.getTime())) {
                   timeString = item.time;
                   timeDate = testDate;
                 } else {
                   console.warn(`Invalid time string format at index ${index}: ${item.time}`);
                 }
               } else if (item.time.seconds && typeof item.time.seconds === 'number') {
                 // Timestamp with seconds property
                 timeDate = new Date(item.time.seconds * 1000);
                 if (!isNaN(timeDate.getTime())) {
                   timeString = timeDate.toLocaleTimeString('en-US', {
                     hour: '2-digit',
                     minute: '2-digit',
                     hour12: true
                   });
                 }
               } else if (typeof item.time === 'number') {
                 // Unix timestamp in milliseconds
                 timeDate = new Date(item.time);
                 if (!isNaN(timeDate.getTime())) {
                   timeString = timeDate.toLocaleTimeString('en-US', {
                     hour: '2-digit',
                     minute: '2-digit',
                     hour12: true
                   });
                 }
               }
             } catch (timeError) {
               console.error(`Error parsing time at index ${index}:`, timeError);
             }
           }

           // Format time range if duration is available and we have a valid time
           if (item.duration && timeString !== 'TBA' && timeDate) {
             try {
               let durationMinutes = 30; // Default duration
               
               if (typeof item.duration === 'string') {
                 // Try to parse duration string (e.g., "1:30", "90 min", "1h 30m")
                 const durationStr = item.duration.trim();
                 
                 // Check for "HH:MM" format
                 if (durationStr.includes(':')) {
                   const parts = durationStr.split(':');
                   const hours = parseInt(parts[0] || '0', 10);
                   const mins = parseInt(parts[1] || '0', 10);
                   if (!isNaN(hours) && !isNaN(mins)) {
                     durationMinutes = hours * 60 + mins;
                   }
                 } else {
                   // Try to extract numbers (e.g., "90 min" -> 90, "1h 30m" -> 90)
                   const numbers = durationStr.match(/\d+/g);
                   if (numbers && numbers.length > 0) {
                     if (durationStr.toLowerCase().includes('h') && numbers.length >= 2) {
                       // "1h 30m" format
                       durationMinutes = parseInt(numbers[0], 10) * 60 + parseInt(numbers[1], 10);
                     } else if (durationStr.toLowerCase().includes('min')) {
                       // "90 min" format
                       durationMinutes = parseInt(numbers[0], 10);
                     } else {
                       // Just a number, assume minutes
                       durationMinutes = parseInt(numbers[0], 10);
                     }
                   }
                 }
               } else if (typeof item.duration === 'number') {
                 // Duration in minutes
                 durationMinutes = item.duration;
               }

               // Validate duration
               if (isNaN(durationMinutes) || durationMinutes <= 0) {
                 durationMinutes = 30; // Fallback to default
               }

               // Calculate end time
               const endTime = new Date(timeDate.getTime() + durationMinutes * 60000);
               const endTimeString = endTime.toLocaleTimeString('en-US', {
                 hour: '2-digit',
                 minute: '2-digit',
                 hour12: true
               });
               timeString = `${timeString} - ${endTimeString}`;
             } catch (durationError) {
               console.warn(`Error parsing duration at index ${index}:`, durationError);
               // Keep original timeString if duration parsing fails
             }
           }

           // Build session object with validated data
           const session: Session = {
             id: item.id || `session-${index}`,
             time: timeString,
            duration: item.duration || '30 min',
             type: (item.type || 'Session') as Session['type'],
            title: item.title || 'Untitled Session',
             speaker: item.speaker || item.speakers?.[0]?.name || 'TBA',
             location: eventData.venue?.name || 
                      (typeof eventData.venue === 'string' ? eventData.venue : 'Main Hall') ||
                      item.location || 
                      'Main Hall',
             description: item.description || item.details || '',
          };

           convertedSessions.push(session);
         } catch (itemError) {
           console.error(`Error converting agenda item at index ${index}:`, itemError, item);
           // Add a fallback session for this item
           convertedSessions.push({
             id: `session-${index}`,
            time: 'TBA',
            duration: '30 min',
            type: 'Session',
             title: item?.title || 'Untitled Session',
             speaker: item?.speaker || 'TBA',
             location: eventData.venue?.name || 
                      (typeof eventData.venue === 'string' ? eventData.venue : 'Main Hall') ||
                      'Main Hall',
             description: item?.description || '',
           });
        }
       }

       // Return converted sessions or fallback to sample data if empty
       if (convertedSessions.length === 0) {
         console.warn('No valid sessions converted, using sample schedule');
         return sampleScheduleData;
       }

       return convertedSessions;
     } catch (error) {
       console.error('Error converting agenda:', error);
       return sampleScheduleData;
     }
  };

  const scheduleData = convertAgendaToSessions() || [];

  const days = [
    { id: 1, label: 'Day 1', date: 'Dec 4' },
    { id: 2, label: 'Day 2', date: 'Dec 5' },
    { id: 3, label: 'Day 3', date: 'Dec 6' },
  ];

  const filteredSessions = (scheduleData || []).filter(session => {
    try {
      return (
        session?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        session?.speaker?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        session?.location?.toLowerCase().includes(searchQuery.toLowerCase())
      );
     } catch (error) {
       return false;
     }
  });

  const toggleFavorite = (sessionId: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(sessionId)) {
      newFavorites.delete(sessionId);
      Alert.alert('Removed', 'Session removed from favorites');
    } else {
      newFavorites.add(sessionId);
      Alert.alert('Added', 'Session added to favorites');
    }
    setFavorites(newFavorites);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Keynote': return { bg: '#f0f4ff', text: '#6366f1', border: '#6366f1' };
      case 'Workshop': return { bg: '#f0fdf4', text: '#10b981', border: '#10b981' };
      case 'Break': return { bg: '#fef3c7', text: '#f59e0b', border: '#f59e0b' };
      case 'Panel': return { bg: '#fce7f3', text: '#ec4899', border: '#ec4899' };
      case 'Networking': return { bg: '#ecfeff', text: '#06b6d4', border: '#06b6d4' };
      default: return { bg: '#f1f5f9', text: '#64748b', border: '#64748b' };
    }
  };

  const handleAddToCalendar = (session: Session) => {
    Alert.alert(
      'Add to Calendar',
      `Would you like to add "${session.title}" to your calendar?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Add', onPress: () => Alert.alert('Success', 'Session added to calendar') }
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading schedule...</Text>
        </View>
      </View>
    );
  }

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
            <Text style={styles.headerTitle}>Event Schedule</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => {
              Alert.alert('Filter', 'Filter options coming soon!');
            }}
          >
            <Ionicons name="filter" size={22} color="#64748b" />
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
          colors={['#6366f1', '#8b5cf6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroGradient}
        >
          <View style={styles.heroContent}>
            <View style={styles.heroBadge}>
              <Ionicons name="calendar" size={14} color="#6366f1" />
              <Text style={styles.heroBadgeText}>SCHEDULE</Text>
            </View>
            <Text style={styles.heroTitle}>{eventData?.title || 'Event Schedule'}</Text>
            <Text style={styles.heroSubtitle}>
              {filteredSessions.length} sessions • 3 days
            </Text>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          {/* Search Bar */}
          <View style={styles.searchCard}>
            <View style={styles.searchBar}>
              <Ionicons name="search-outline" size={20} color="#94a3b8" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search sessions, speakers, or topics..."
                placeholderTextColor="#94a3b8"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color="#94a3b8" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Day Tabs */}
          <View style={styles.dayTabsContainer}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.dayTabs}
            >
              {days.map((day) => (
                <TouchableOpacity
                  key={day.id}
                  style={[
                    styles.dayTab,
                    selectedDay === day.id && styles.activeDayTab,
                  ]}
                  onPress={() => setSelectedDay(day.id)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.dayTabLabel,
                    selectedDay === day.id && styles.activeDayTabLabel,
                  ]}>
                    {day.label}
                  </Text>
                  <Text style={[
                    styles.dayTabDate,
                    selectedDay === day.id && styles.activeDayTabDate,
                  ]}>
                    {day.date}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Favorites Count */}
          {favorites.size > 0 && (
            <View style={styles.favoritesIndicator}>
              <Ionicons name="star" size={16} color="#fbbf24" />
              <Text style={styles.favoritesText}>
                {favorites.size} {favorites.size === 1 ? 'favorite' : 'favorites'}
              </Text>
            </View>
          )}

          {/* Schedule List */}
          <View style={styles.sessionsList}>
            {filteredSessions.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={64} color="#cbd5e1" />
                <Text style={styles.emptyStateTitle}>No sessions found</Text>
                <Text style={styles.emptyStateText}>
                  Try adjusting your search criteria
                </Text>
              </View>
            ) : (
              filteredSessions.map((session, index) => {
                const colors = getTypeColor(session.type);
                const isExpanded = expandedSession === session.id;
                
                return (
                  <View key={session.id} style={styles.sessionCard}>
                    {/* Session Header */}
                    <View style={styles.sessionHeader}>
                      <View style={[styles.sessionTypeBadge, { 
                        backgroundColor: colors.bg,
                        borderColor: colors.border
                      }]}>
                        <Text style={[styles.sessionTypeText, { color: colors.text }]}>
                          {session.type}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.favoriteButton}
                        onPress={() => toggleFavorite(session.id)}
                      >
                        <Ionicons
                          name={favorites.has(session.id) ? "star" : "star-outline"}
                          size={24}
                          color={favorites.has(session.id) ? "#fbbf24" : "#cbd5e1"}
                        />
                      </TouchableOpacity>
                    </View>

                    {/* Time & Duration */}
                    <View style={styles.timeContainer}>
                      <View style={styles.timeInfo}>
                        <Ionicons name="time-outline" size={18} color="#6366f1" />
                        <Text style={styles.timeText}>{session.time}</Text>
                      </View>
                      <View style={styles.durationPill}>
                        <Text style={styles.durationText}>{session.duration}</Text>
                      </View>
                    </View>

                    {/* Session Title */}
                    <Text style={styles.sessionTitle}>{session.title}</Text>

                    {/* Speaker & Location */}
                    {session.type !== 'Break' && (
                      <View style={styles.sessionMeta}>
                        <TouchableOpacity 
                          style={styles.speakerContainer}
                          onPress={() => {
                            const speakerData = eventData?.speakers && Array.isArray(eventData.speakers) 
                              ? eventData.speakers.find((s: any) => s?.name === session.speaker)
                              : null;
                            navigation.navigate('SpeakerDetail', {
                              speaker: speakerData ? {
                                id: session.id,
                                name: speakerData.name,
                                title: speakerData.title || 'Speaker',
                                company: speakerData.company || '',
                                bio: speakerData.bio || `Speaker for ${session.title}`,
                                photoURL: speakerData.photoURL,
                              } : {
                                id: session.id,
                                name: session.speaker,
                                title: 'Speaker',
                                company: '',
                                bio: `Speaker for ${session.title}`,
                              },
                              eventId: route?.params?.eventId || 'sample-event'
                            });
                          }}
                        >
                          <View style={styles.avatar}>
                            <Text style={styles.avatarText}>
                              {session.speaker ? session.speaker.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '??'}
                            </Text>
                          </View>
                          <View style={styles.speakerInfo}>
                            <Text style={styles.speakerName}>{session.speaker}</Text>
                            <View style={styles.locationRow}>
                              <Ionicons name="location-outline" size={14} color="#94a3b8" />
                              <Text style={styles.locationText}>{session.location}</Text>
                            </View>
                          </View>
                        </TouchableOpacity>
                      </View>
                    )}

                    {/* Description (Expandable) */}
                    {session.description && (
                      <TouchableOpacity 
                        style={styles.descriptionToggle}
                        onPress={() => setExpandedSession(isExpanded ? null : session.id)}
                      >
                        <Text style={styles.descriptionToggleText}>
                          {isExpanded ? 'Show less' : 'Show more'}
                        </Text>
                        <Ionicons 
                          name={isExpanded ? "chevron-up" : "chevron-down"} 
                          size={16} 
                          color="#6366f1" 
                        />
                      </TouchableOpacity>
                    )}

                    {isExpanded && session.description && (
                      <View style={styles.descriptionContainer}>
                        <Text style={styles.descriptionText}>{session.description}</Text>
                      </View>
                    )}

                    {/* Action Buttons */}
                    {session.type !== 'Break' && (
                      <View style={styles.sessionActions}>
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => handleAddToCalendar(session)}
                        >
                          <Ionicons name="calendar-outline" size={18} color="#6366f1" />
                          <Text style={styles.actionButtonText}>Add to Calendar</Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {/* Connector Line */}
                    {index < filteredSessions.length - 1 && (
                      <View style={styles.sessionConnector} />
                    )}
                  </View>
                );
              })
            )}
          </View>

          <View style={styles.bottomSpacer} />
        </View>
      </ScrollView>

      {/* Enhanced Bottom Navigation */}
      <View style={[styles.bottomNav, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('EventDetail', { eventId: route?.params?.eventId })}
        >
          <Ionicons name="home-outline" size={24} color="#94a3b8" />
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.navItem, styles.navItemActive]}>
          <Ionicons name="calendar" size={24} color="#6366f1" />
          <Text style={[styles.navLabel, styles.navLabelActive]}>Schedule</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => {
            if (route?.params?.eventId) {
              navigation.navigate('SpeakersList', { eventId: route.params.eventId });
            } else {
              Alert.alert('Error', 'Event data not available');
            }
          }}
        >
          <Ionicons name="people-outline" size={24} color="#94a3b8" />
          <Text style={styles.navLabel}>Speakers</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => {
            if (route?.params?.eventId) {
              navigation.navigate('Sponsor', { eventId: route.params.eventId });
            } else {
              Alert.alert('Error', 'Event data not available');
            }
          }}
        >
          <Ionicons name="business-outline" size={24} color="#94a3b8" />
          <Text style={styles.navLabel}>Partners</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => {
            if (route?.params?.eventId) {
              navigation.navigate('Chat', { eventId: route.params.eventId });
            } else {
              Alert.alert('Error', 'Event data not available');
            }
          }}
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
    marginBottom: 8,
    lineHeight: 36,
  },
  heroSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: 16,
    marginTop: -20,
  },
  searchCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    color: '#1e293b',
    fontWeight: '500',
  },
  dayTabsContainer: {
    marginBottom: 20,
  },
  dayTabs: {
    paddingRight: 16,
  },
  dayTab: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 16,
    marginRight: 12,
    alignItems: 'center',
    minWidth: 100,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  activeDayTab: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
    shadowColor: '#6366f1',
    shadowOpacity: 0.3,
  },
  dayTabLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 4,
  },
  activeDayTabLabel: {
    color: '#ffffff',
  },
  dayTabDate: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94a3b8',
  },
  activeDayTabDate: {
    color: 'rgba(255,255,255,0.9)',
  },
  favoritesIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#fef3c7',
  },
  favoritesText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#92400e',
  },
  sessionsList: {
    marginBottom: 24,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#475569',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 15,
    color: '#94a3b8',
  },
  sessionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sessionTypeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  sessionTypeText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  favoriteButton: {
    padding: 4,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
    marginLeft: 8,
  },
  durationPill: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  durationText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  sessionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    lineHeight: 26,
    marginBottom: 16,
  },
  sessionMeta: {
    marginBottom: 12,
  },
  speakerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f4ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#e0e7ff',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6366f1',
  },
  speakerInfo: {
    flex: 1,
  },
  speakerName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 13,
    color: '#64748b',
    marginLeft: 4,
    fontWeight: '500',
  },
  descriptionToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  descriptionToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366f1',
    marginRight: 4,
  },
  descriptionContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#475569',
    fontWeight: '400',
  },
  sessionActions: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f4ff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#6366f1',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6366f1',
    marginLeft: 8,
  },
  sessionConnector: {
    position: 'absolute',
    left: 40,
    bottom: -16,
    width: 2,
    height: 16,
    backgroundColor: '#e2e8f0',
  },
  bottomSpacer: {
    height: 100,
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