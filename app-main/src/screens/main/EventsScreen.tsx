import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Dimensions,
  TouchableOpacity,
  ImageBackground,
  Animated,
  StatusBar,
} from 'react-native';
import {
  Text,
  Searchbar,
  ActivityIndicator,
  Chip,
  Surface,
  Avatar,
} from 'react-native-paper';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../services/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export const EventsScreen: React.FC = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const navigation: any = useNavigation();
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
 

  const categories = [
    { id: 'all', name: 'All', icon: 'apps', gradient: ['#667eea', '#764ba2'] },
    { id: 'technology', name: 'Tech', icon: 'laptop', gradient: ['#f093fb', '#f5576c'] },
    { id: 'music', name: 'Music', icon: 'music-note', gradient: ['#4facfe', '#00f2fe'] },
    { id: 'business', name: 'Business', icon: 'business-center', gradient: ['#43e97b', '#38f9d7'] },
    { id: 'sports', name: 'Sports', icon: 'sports-soccer', gradient: ['#fa709a', '#fee140'] },
    { id: 'arts', name: 'Arts', icon: 'palette', gradient: ['#a8edea', '#fed6e3'] },
    { id: 'food', name: 'Food', icon: 'restaurant', gradient: ['#fbc2eb', '#a6c1ee'] },
    { id: 'health', name: 'Health', icon: 'favorite', gradient: ['#ff9a9e', '#fecfef'] },
  ];

  const normalizeEvent = (row: any) => {
    const ensureDate = (value: any) => (value ? new Date(value) : undefined);

    return {
      id: row.id,
      ...row,
      date: ensureDate(row.event_date) || ensureDate(row.start_at),
      startAt: ensureDate(row.start_at),
      endAt: ensureDate(row.end_at),
      createdAt: ensureDate(row.created_at),
      updatedAt: ensureDate(row.updated_at),
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
  };

  const loadMyRegisteredEvents = async () => {
    if (!user?.id) {
      setEvents([]);
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('event_id, events(*)')
        .eq('user_id', user.id)
        .eq('status', 'confirmed');

      if (error) throw error;

      const normalized = (data || [])
        .filter((row: any) => row.events)
        .map((row: any) => normalizeEvent(row.events));

      normalized.sort((a, b) => {
        const aDate = a.date ? new Date(a.date).getTime() : Number.MAX_SAFE_INTEGER;
        const bDate = b.date ? new Date(b.date).getTime() : Number.MAX_SAFE_INTEGER;
        return aDate - bDate;
      });
      setEvents(normalized);
    } catch (error) {
      console.error('Error loading my registered events:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMyRegisteredEvents();

    if (!user?.id) return;

    const channel = supabase
      .channel(`events-screen-my-tickets-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets', filter: `user_id=eq.${user.id}` }, () => {
        loadMyRegisteredEvents();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  useEffect(() => {
    if (!events.length) {
      return;
    }

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, [events, fadeAnim, slideAnim]);

 const onRefresh = async () => {
    setRefreshing(true);
    await loadMyRegisteredEvents();
    setRefreshing(false);
  };

  const toggleFavorite = (eventId: string) => {
    setFavorites(prev => {
      const newFav = new Set(prev);
      if (newFav.has(eventId)) {
        newFav.delete(eventId);
      } else {
        newFav.add(eventId);
      }
      return newFav;
    });
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || 
                           event.category?.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  const renderEventCard = ({ item, index }: { item: any; index: number }) => (
    <Animated.View
      style={[
        styles.eventCardWrapper,
        {
          opacity: fadeAnim,
          transform: [
            {
              translateY: slideAnim,
            },
          ],
        },
      ]}
    >
    <TouchableOpacity
      style={styles.eventCard}
      onPress={() => navigation.navigate('EventDetail', { eventId: item.id })}
      activeOpacity={0.8}
    >
        <Surface style={styles.eventCardSurface} elevation={3}>
        <ImageBackground
          source={{ uri: item.posterURL || item.imageURL || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800' }}
          style={styles.eventImage}
          imageStyle={styles.eventImageStyle}
          resizeMode="cover"
        >
          <LinearGradient
              colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.7)']}
            style={styles.imageGradient}
          >
            <View style={styles.imageBadges}>
              <View style={styles.dateBadge}>
                <Text style={styles.dateDay}>
                  {item.date ? new Date(item.date).getDate() : '??'}
                </Text>
                <Text style={styles.dateMonth}>
                  {item.date ? new Date(item.date).toLocaleDateString('en-US', { month: 'short' }).toUpperCase() : 'TBD'}
                </Text>
              </View>
              {item.category && (
                  <View style={styles.categoryBadge}>
                    <LinearGradient
                      colors={categories.find(c => c.id === item.category)?.gradient || ['#667eea', '#764ba2']}
                      style={styles.categoryBadgeGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Text style={styles.categoryBadgeText}>{item.category}</Text>
                    </LinearGradient>
                  </View>
              )}
            </View>
              <TouchableOpacity 
                style={styles.favoriteButton}
                onPress={() => toggleFavorite(item.id)}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name={favorites.has(item.id) ? "heart" : "heart-outline"} 
                  size={22} 
                  color={favorites.has(item.id) ? "#FF6B6B" : "#fff"} 
                />
              </TouchableOpacity>
          </LinearGradient>
        </ImageBackground>
        
        <View style={styles.cardContent}>
          <Text style={styles.eventTitle} numberOfLines={2}>
            {item.title}
          </Text>
          
          <Text style={styles.eventDescription} numberOfLines={2}>
            {item.description}
          </Text>
          
          <View style={styles.eventMeta}>
            <View style={styles.metaItem}>
                <Ionicons name="location-outline" size={16} color="#999" />
              <Text style={styles.metaText} numberOfLines={1}>
                {item.location || 'Online'}
              </Text>
            </View>
            <View style={styles.metaItem}>
                <Ionicons name="people-outline" size={16} color="#999" />
              <Text style={styles.metaText}>
                {item.currentAttendees || 0} attending
              </Text>
            </View>
          </View>

          <View style={styles.cardFooter}>
            <View style={styles.hostInfo}>
              <Avatar.Text 
                  size={32} 
                label={(item.organizerName || 'H')[0].toUpperCase()} 
                style={styles.hostAvatar}
                  labelStyle={{ fontSize: 14 }}
              />
              <Text style={styles.hostName} numberOfLines={1}>
                {item.organizerName || 'Event Host'}
              </Text>
            </View>
              <LinearGradient
                colors={['#f0e6ff', '#e6d9ff']}
                style={styles.priceContainer}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
              <Text style={styles.priceText}>
                {item.price ? `${item.currency}${item.price}` : 'Free'}
              </Text>
              </LinearGradient>
            </View>

            <View style={styles.cardActions}>
              <View style={styles.actionItem}>
                <Ionicons name="heart" size={16} color="#FF6B6B" />
                <Text style={styles.actionText}>{item.likes || 0}</Text>
              </View>
              <TouchableOpacity style={styles.actionItem}>
                <Ionicons name="share-social-outline" size={16} color="#999" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionItem}>
                <Ionicons name="bookmark-outline" size={16} color="#999" />
              </TouchableOpacity>
          </View>
        </View>
      </Surface>
    </TouchableOpacity>
    </Animated.View>
  );

  const renderCategory = ({ item }: { item: any }) => {
    const selected = selectedCategory === item.id;
    
    return (
      <TouchableOpacity
        style={styles.categoryWrapper}
        onPress={() => setSelectedCategory(item.id)}
        activeOpacity={0.7}
      >
        {selected ? (
          <LinearGradient
            colors={item.gradient}
            style={styles.categoryChip}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <MaterialIcons name={item.icon} size={16} color="#fff" />
            <Text style={[styles.categoryText, styles.selectedCategoryText]}>
              {item.name}
            </Text>
          </LinearGradient>
        ) : (
          <View style={[styles.categoryChip, styles.unselectedCategory]}>
            <MaterialIcons name={item.icon} size={16} color="#666" />
            <Text style={styles.categoryText}>{item.name}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>Loading events...</Text>
      </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View>
        <Text style={styles.headerTitle}>Browse Events</Text>
        <Text style={styles.headerSubtitle}>
          {filteredEvents.length} events available
        </Text>
          </View>
          <TouchableOpacity style={styles.filterButton}>
            <MaterialIcons name="tune" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchWrapper}>
            <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
       <Searchbar
              placeholder="Search events, locations..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
            inputStyle={styles.searchInput}
              icon={() => null}
            placeholderTextColor="#999"
          />
          </View>
        </View>
      </LinearGradient>

      {/* Categories */}
      <View style={styles.categoriesContainer}>
        <FlatList
          data={categories}
          renderItem={renderCategory}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
        />
      </View>

      {/* Events List */}
        <FlatList
          data={filteredEvents}
        renderItem={renderEventCard}
          keyExtractor={(item) => item.id}
        contentContainerStyle={styles.eventsList}
        showsVerticalScrollIndicator={false}
          refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            colors={['#667eea']}
            tintColor="#667eea"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="calendar-outline" size={60} color="#ccc" />
            </View>
            <Text style={styles.emptyTitle}>No Events Found</Text>
            <Text style={styles.emptySubtitle}>
              {selectedCategory === 'all' 
                ? 'No events available at the moment' 
                : `No ${categories.find(c => c.id === selectedCategory)?.name} events found`}
            </Text>
            <TouchableOpacity 
              style={styles.emptyButton}
              onPress={() => setSelectedCategory('all')}
            >
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.emptyButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.emptyButtonText}>View All Events</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
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
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
    fontWeight: '500',
  },
  filterButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    marginTop: 4,
  },
  searchWrapper: {
    position: 'relative',
  },
  searchIcon: {
    position: 'absolute',
    left: 16,
    top: 15,
    zIndex: 1,
  },
  searchbar: {
    elevation: 0,
    backgroundColor: '#fff',
    borderRadius: 20,
    height: 50,
    paddingLeft: 44,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  searchInput: {
    fontSize: 15,
    color: '#333',
    marginLeft: -8,
  },
  categoriesContainer: {
    backgroundColor: 'transparent',
    paddingVertical: 20,
  },
  categoriesList: {
    paddingHorizontal: 20,
  },
  categoryWrapper: {
    marginRight: 10,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 7,
  },
  unselectedCategory: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryText: {
    fontSize: 15,
    color: '#666',
    fontWeight: '700',
  },
  selectedCategoryText: {
    color: '#fff',
  },
  eventsList: {
    padding: 16,
  },
  eventCardWrapper: {
    marginBottom: 18,
  },
  eventCard: {
    width: '100%',
  },
  eventCardSurface: {
    borderRadius: 20,
    backgroundColor: '#fff',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  eventImage: {
    width: '100%',
    height: 200,
  },
  eventImageStyle: {
    resizeMode: 'cover',
  },
  imageGradient: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 14,
  },
  imageBadges: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  dateBadge: {
    backgroundColor: '#fff',
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: 'center',
    minWidth: 54,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 5,
  },
  dateDay: {
    fontSize: 20,
    fontWeight: '800',
    color: '#667eea',
  },
  dateMonth: {
    fontSize: 11,
    fontWeight: '700',
    color: '#999',
    marginTop: 1,
  },
  categoryBadge: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  categoryBadgeGradient: {
    paddingHorizontal: 13,
    paddingVertical: 7,
  },
  categoryBadgeText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  favoriteButton: {
    position: 'absolute',
    bottom: 14,
    right: 14,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
    borderRadius: 22,
    backdropFilter: 'blur(10px)',
  },
  cardContent: {
    padding: 18,
  },
  eventTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: 8,
    letterSpacing: -0.3,
    lineHeight: 26,
  },
  eventDescription: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
    marginBottom: 14,
  },
  eventMeta: {
    flexDirection: 'row',
    marginBottom: 14,
    gap: 18,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  metaText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
    fontWeight: '600',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 14,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  hostInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  hostAvatar: {
    backgroundColor: '#667eea',
  },
  hostName: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
    flex: 1,
  },
  priceContainer: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  priceText: {
    fontSize: 15,
    color: '#667eea',
    fontWeight: '800',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 70,
    paddingHorizontal: 32,
  },
  emptyIconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 28,
  },
  emptyButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyButtonGradient: {
    paddingHorizontal: 32,
    paddingVertical: 14,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});