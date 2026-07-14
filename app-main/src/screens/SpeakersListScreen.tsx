import React, { useState, useEffect } from 'react';
import { BackHandler } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  TextInput,
  Animated,
  Alert,
} from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../services/supabase';

const { width } = Dimensions.get('window');

interface Speaker {
  id: string;
  name: string;
  title: string;
  company: string;
  bio: string;
  photoURL?: string;
}

interface SpeakersListScreenProps {
  navigation: any;
  route?: {
    params?: {
      eventId?: string;
    };
  };
}

export default function SpeakersListScreen({ navigation, route }: SpeakersListScreenProps) {
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

  const [eventData, setEventData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const insets = useSafeAreaInsets();
  const scrollY = new Animated.Value(0);

// Real-time event data listener for live speaker updates
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
        // Ensure speakers array is properly formatted
        speakers: Array.isArray(row.speakers) ? row.speakers : [],
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
    .channel(`speakers-list-event-${eventId}`)
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

  const speakers = eventData?.speakers || [];

  const filteredSpeakers = speakers.filter((speaker: any) => {
    const matchesSearch = 
      speaker?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      speaker?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      speaker?.company?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const categories = ['All', 'Keynote', 'Workshop', 'Panel'];

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading speakers...</Text>
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
            <Text style={styles.headerTitle}>Speakers</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => Alert.alert('Filter', 'Filter options coming soon!')}
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
        <LinearGradient
          colors={['#6366f1', '#8b5cf6', '#ec4899']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroGradient}
        >
          <View style={styles.heroContent}>
            <View style={styles.heroBadge}>
              <Ionicons name="people" size={14} color="#6366f1" />
              <Text style={styles.heroBadgeText}>SPEAKERS</Text>
            </View>
            <Text style={styles.heroTitle}>Meet Our Speakers</Text>
            <Text style={styles.heroSubtitle}>
              {speakers.length} expert{speakers.length !== 1 ? 's' : ''} ready to inspire
            </Text>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          <View style={styles.searchCard}>
            <View style={styles.searchBar}>
              <Ionicons name="search-outline" size={20} color="#94a3b8" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search speakers..."
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

          <View style={styles.categoriesContainer}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categories}
            >
              {categories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryChip,
                    selectedCategory === category && styles.activeCategoryChip,
                  ]}
                  onPress={() => setSelectedCategory(category)}
                >
                  <Text style={[
                    styles.categoryText,
                    selectedCategory === category && styles.activeCategoryText,
                  ]}>
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.speakersGrid}>
            {filteredSpeakers.length > 0 ? (
              filteredSpeakers.map((speaker: any, index: number) => (
                <TouchableOpacity
                  key={index}
                  style={styles.speakerCard}
                  onPress={() => {
                    navigation.navigate('SpeakerDetail', {
                      speaker: {
                        id: `speaker-${index}`,
                        name: speaker.name || 'Unknown Speaker',
                        title: speaker.title || 'Speaker',
                        company: speaker.company || '',
                        bio: speaker.bio || 'Event speaker',
                        photoURL: speaker.photoURL,
                      },
                      eventId: route?.params?.eventId || 'sample-event'
                    });
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.speakerPhotoContainer}>
                    {speaker.photoURL ? (
                      <Image 
                        source={{ uri: speaker.photoURL }} 
                        style={styles.speakerPhoto}
                        resizeMode="cover"
                        onError={() => {
                          console.log('Failed to load speaker photo for:', speaker.name);
                        }}
                      />
                    ) : (
                      <View style={styles.speakerAvatar}>
                        <Text style={styles.speakerAvatarText}>
                          {speaker.name ? speaker.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() : 'SP'}
                        </Text>
                      </View>
                    )}
                    <View style={styles.speakerBadge}>
                      <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                    </View>
                  </View>
                  
                  <View style={styles.speakerCardContent}>
                    <Text style={styles.speakerName} numberOfLines={2}>
                      {speaker.name || 'Unknown Speaker'}
                    </Text>
                    <Text style={styles.speakerTitle} numberOfLines={1}>
                      {speaker.title || 'Speaker'}
                    </Text>
                    {speaker.company && (
                      <View style={styles.companyRow}>
                        <Ionicons name="business-outline" size={12} color="#94a3b8" />
                        <Text style={styles.speakerCompany} numberOfLines={1}>
                          {speaker.company}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.viewProfileButton}>
                    <Text style={styles.viewProfileText}>View Profile</Text>
                    <Ionicons name="arrow-forward" size={14} color="#6366f1" />
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={64} color="#cbd5e1" />
                <Text style={styles.emptyStateTitle}>No speakers found</Text>
                <Text style={styles.emptyStateText}>
                  {searchQuery 
                    ? 'Try adjusting your search criteria' 
                    : 'Speakers will be announced soon for this event'}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.bottomSpacer} />
        </View>
      </ScrollView>

      <View style={[styles.bottomNav, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('EventDetail', { eventId: route?.params?.eventId })}
        >
          <Ionicons name="home-outline" size={24} color="#94a3b8" />
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('Schedule', { eventId: route?.params?.eventId })}
        >
          <Ionicons name="calendar-outline" size={24} color="#94a3b8" />
          <Text style={styles.navLabel}>Schedule</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.navItem, styles.navItemActive]}>
          <Ionicons name="people" size={24} color="#6366f1" />
          <Text style={[styles.navLabel, styles.navLabelActive]}>Speakers</Text>
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
  categoriesContainer: {
    marginBottom: 24,
  },
  categories: {
    paddingRight: 16,
  },
  categoryChip: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginRight: 8,
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  activeCategoryChip: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  activeCategoryText: {
    color: '#ffffff',
  },
  speakersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  speakerCard: {
    width: '50%',
    padding: 6,
  },
  speakerPhotoContainer: {
    position: 'relative',
    alignItems: 'center',
    marginBottom: 12,
  },
  speakerPhoto: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
  },
  speakerAvatar: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 16,
    backgroundColor: '#f0f4ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  speakerAvatarText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#6366f1',
  },
  speakerBadge: {
    position: 'absolute',
    bottom: -8,
    right: 8,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  speakerCardContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  speakerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
    lineHeight: 20,
  },
  speakerTitle: {
    fontSize: 13,
    color: '#6366f1',
    marginBottom: 6,
    fontWeight: '600',
  },
  companyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  speakerCompany: {
    fontSize: 12,
    color: '#64748b',
    marginLeft: 4,
    flex: 1,
    fontWeight: '500',
  },
  viewProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f4ff',
    borderRadius: 12,
    paddingVertical: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#6366f1',
  },
  viewProfileText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6366f1',
    marginRight: 4,
  },
  emptyState: {
    width: '100%',
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
    textAlign: 'center',
    paddingHorizontal: 20,
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