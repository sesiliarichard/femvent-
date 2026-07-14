import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Image,
  TouchableOpacity,
  Dimensions,
  FlatList,
  ActivityIndicator,
  ImageBackground,
  Animated,
  StatusBar,
} from 'react-native';
import {
  Text,
  Searchbar,
  Avatar,
  Surface,
  Badge,
} from 'react-native-paper';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../services/AuthContext';
import { supabase } from '../../services/supabase';

const { width, height } = Dimensions.get('window');

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState(new Set());
  const [viewMode, setViewMode] = useState('list');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scrollY = useRef(new Animated.Value(0)).current;
 

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

  const quickActions = [
    { id: '1', name: 'My Tickets', icon: 'confirmation-number', gradient: ['#FF6B6B', '#FF8E53'] },
    { id: '2', name: 'Favorites', icon: 'bookmark', gradient: ['#4ECDC4', '#44A08D'] },
    { id: '3', name: 'Schedule', icon: 'event', gradient: ['#45B7D1', '#3498DB'] },
    { id: '4', name: 'Explore', icon: 'explore', gradient: ['#FFA07A', '#FF7F50'] },
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

  useEffect(() => {
    const loadAndSort = async () => {
      try {
        const { data, error } = await supabase.from('events').select('*');
        if (error) throw error;

        const normalized = (data || []).map(normalizeEvent);
        normalized.sort((a, b) => {
          const aDate = a.date ? new Date(a.date).getTime() : Number.MAX_SAFE_INTEGER;
          const bDate = b.date ? new Date(b.date).getTime() : Number.MAX_SAFE_INTEGER;
          return aDate - bDate;
        });
        setEvents(normalized);
      } catch (error) {
        console.error('Error loading events:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAndSort();

    const channel = supabase
      .channel('home-events-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => {
        loadAndSort();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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
    try {
      const { data, error } = await supabase.from('events').select('*');
      if (error) throw error;

      const normalized = (data || []).map(normalizeEvent);
      normalized.sort((a, b) => {
        const aDate = a.date ? new Date(a.date).getTime() : Number.MAX_SAFE_INTEGER;
        const bDate = b.date ? new Date(b.date).getTime() : Number.MAX_SAFE_INTEGER;
        return aDate - bDate;
      });
      setEvents(normalized);
    } catch (error) {
      console.error('Error refreshing events:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const toggleFavorite = (eventId) => {
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

  // Auto-pick first few upcoming events as "featured"
  const featuredEvents = (() => {
    if (!filteredEvents.length) return [];

    const now = new Date();
    const upcoming = filteredEvents.filter(e => {
      if (!e.date) return false;
      const d = new Date(e.date);
      return d.getTime() >= now.getTime();
    });

    if (upcoming.length > 0) {
      return upcoming.slice(0, 3);
    }

    // Fallback: just take first few filtered events
    return filteredEvents.slice(0, 3);
  })();

  const getTimeUntilEvent = (date) => {
    if (!date) return 'TBD';
    const eventDate = new Date(date);
    const now = new Date();
    const diff = eventDate.getTime() - now.getTime();

    if (diff < 0) return 'Started';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h`;
    return 'Soon';
  };

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.9],
    extrapolate: 'clamp',
  });

  const renderQuickAction = ({ item, index }) => (
    <Animated.View
      style={[
        styles.quickActionWrapper,
        {
          opacity: fadeAnim,
          transform: [
            {
              translateY: slideAnim.interpolate({
                inputRange: [0, 30],
                outputRange: [0, 30],
              }),
            },
          ],
        },
      ]}
    >
      <TouchableOpacity style={styles.quickActionItem} activeOpacity={0.7}>
        <LinearGradient
          colors={item.gradient}
          style={styles.quickActionGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <MaterialIcons name={item.icon} size={26} color="#fff" />
        </LinearGradient>
        <Text style={styles.quickActionText}>{item.name}</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderFeaturedEvent = ({ item, index }) => {
    return (
      <Animated.View
        style={[
          styles.featuredCardWrapper,
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
          style={[styles.featuredCard, { marginLeft: index === 0 ? 16 : 8 }]}
          activeOpacity={0.9}
          onPress={() => {
            (navigation as any).navigate('EventDetail', { eventId: item.id });
          }}
        >
          <ImageBackground
            source={{ uri: item.posterURL }}
            style={styles.featuredImage}
            imageStyle={styles.featuredImageStyle}
            resizeMode="cover"
          >
            <LinearGradient
              colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.8)']}
              style={styles.featuredGradient}
            >
              {item.isFeatured && (
                <View style={styles.featuredBadge}>
                  <LinearGradient
                    colors={['#FFD700', '#FFA500']}
                    style={styles.featuredBadgeGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Ionicons name="star" size={12} color="#fff" />
                    <Text style={styles.featuredBadgeText}>Featured</Text>
                  </LinearGradient>
                </View>
              )}

              <TouchableOpacity
                style={styles.favoriteBadge}
                onPress={() => toggleFavorite(item.id)}
                activeOpacity={0.7}
              >
                <Animated.View>
                  <Ionicons
                    name={favorites.has(item.id) ? "heart" : "heart-outline"}
                    size={22}
                    color={favorites.has(item.id) ? "#FF6B6B" : "#fff"}
                  />
                </Animated.View>
              </TouchableOpacity>

              <View style={styles.featuredContent}>
                <Text style={styles.featuredTitle} numberOfLines={2}>
                  {item.title}
                </Text>
                <View style={styles.featuredMeta}>
                  <View style={styles.featuredMetaItem}>
                    <Ionicons name="calendar-outline" size={14} color="#fff" />
                    <Text style={styles.featuredMetaText}>
                      {item.date ? new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'TBD'}
                    </Text>
                  </View>
                  <View style={styles.featuredMetaItem}>
                    <Ionicons name="location-outline" size={14} color="#fff" />
                    <Text style={styles.featuredMetaText} numberOfLines={1}>
                      {item.location || 'Online'}
                    </Text>
                  </View>
                </View>
                <View style={styles.featuredFooter}>
                  <View style={styles.featuredAttendees}>
                    <Ionicons name="people" size={16} color="#fff" />
                    <Text style={styles.featuredAttendeesText}>
                      {item.currentAttendees || 0} attending
                    </Text>
                  </View>
                  <LinearGradient
                    colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.2)']}
                    style={styles.featuredPrice}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={styles.featuredPriceText}>
                      {item.price ? `${item.currency}${item.price}` : 'Free'}
                    </Text>
                  </LinearGradient>
                </View>
              </View>
            </LinearGradient>
          </ImageBackground>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderCategory = ({ item, index }) => {
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
            <MaterialIcons name={item.icon} size={18} color="#fff" />
            <Text style={[styles.categoryText, styles.selectedCategoryText]}>
              {item.name}
            </Text>
          </LinearGradient>
        ) : (
          <View style={[styles.categoryChip, styles.unselectedCategory]}>
            <MaterialIcons name={item.icon} size={18} color="#666" />
            <Text style={styles.categoryText}>{item.name}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderEventCard = ({ item, index }) => {
    return (
      <TouchableOpacity
        style={styles.eventCard}
        activeOpacity={0.8}
        onPress={() => {
          (navigation as any).navigate('EventDetail', { eventId: item.id });
        }}
      >
        <Surface style={styles.eventCardSurface} elevation={3}>
          <View style={styles.eventCardImage}>
            <ImageBackground
              source={{ uri: item.posterURL }}
              style={styles.eventImage}
              imageStyle={styles.eventImageStyle}
              resizeMode="cover"
            >
              <LinearGradient
                colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.3)']}
                style={styles.eventImageOverlay}
              >
                <View style={styles.eventDateBadge}>
                  <Text style={styles.eventDateDay}>
                    {item.date ? new Date(item.date).getDate() : '??'}
                  </Text>
                  <Text style={styles.eventDateMonth}>
                    {item.date ? new Date(item.date).toLocaleDateString('en-US', { month: 'short' }).toUpperCase() : 'TBD'}
                  </Text>
                </View>

                {item.category && (
                  <View style={styles.eventCategoryBadge}>
                    <LinearGradient
                      colors={categories.find(c => c.id === item.category)?.gradient || ['#667eea', '#764ba2']}
                      style={styles.categoryBadgeGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Text style={styles.eventCategoryText}>{item.category}</Text>
                    </LinearGradient>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.eventFavButton}
                  onPress={() => toggleFavorite(item.id)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={favorites.has(item.id) ? "heart" : "heart-outline"}
                    size={20}
                    color={favorites.has(item.id) ? "#FF6B6B" : "#fff"}
                  />
                </TouchableOpacity>
              </LinearGradient>
            </ImageBackground>
          </View>

          <View style={styles.eventCardContent}>
            <Text style={styles.eventCardTitle} numberOfLines={2}>
              {item.title}
            </Text>

            <View style={styles.eventCardMeta}>
              <View style={styles.eventCardMetaItem}>
                <Ionicons name="time-outline" size={16} color="#999" />
                <Text style={styles.eventCardMetaText}>
                  {getTimeUntilEvent(item.date)}
                </Text>
              </View>
              <View style={styles.eventCardMetaItem}>
                <Ionicons name="location-outline" size={16} color="#999" />
                <Text style={styles.eventCardMetaText} numberOfLines={1}>
                  {item.location || 'Online'}
                </Text>
              </View>
            </View>

            <View style={styles.eventCardFooter}>
              <View style={styles.eventCardHost}>
                <Avatar.Text
                  size={28}
                  label={(item.organizerName || 'H')[0].toUpperCase()}
                  style={styles.hostAvatar}
                  labelStyle={{ fontSize: 12 }}
                />
                <Text style={styles.hostName} numberOfLines={1}>
                  {item.organizerName || 'Event Host'}
                </Text>
              </View>
              <LinearGradient
                colors={['#f0e6ff', '#e6d9ff']}
                style={styles.eventCardPrice}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.priceText}>
                  {item.price ? `${item.currency}${item.price}` : 'Free'}
                </Text>
              </LinearGradient>
            </View>

            <View style={styles.eventCardActions}>
              <View style={styles.eventEngagement}>
                <Ionicons name="heart" size={16} color="#FF6B6B" />
                <Text style={styles.engagementText}>{item.likes || 0}</Text>
              </View>
              <View style={styles.eventEngagement}>
                <Ionicons name="people" size={16} color="#4ECDC4" />
                <Text style={styles.engagementText}>{item.currentAttendees || 0}</Text>
              </View>
              <TouchableOpacity style={styles.eventEngagement}>
                <Ionicons name="share-social-outline" size={16} color="#999" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.eventEngagement}>
                <Ionicons name="bookmark-outline" size={16} color="#999" />
              </TouchableOpacity>
            </View>
          </View>
        </Surface>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.loadingText}>Loading amazing events...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" />

      <Animated.View style={{ opacity: headerOpacity }}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <Text style={styles.greeting}>
                Hello, {user?.name?.split(' ')[0] || 'Guest'}! 👋
              </Text>
              <Text style={styles.headerTitle}>Discover Events</Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.headerIconButton}>
                <View style={styles.iconButtonCircle}>
                  <Ionicons name="notifications-outline" size={22} color="#667eea" />
                  <Badge style={styles.notificationBadge} size={8} />
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerIconButton}>
                {user?.photoURL ? (
                  <Avatar.Image
                    size={42}
                    source={{ uri: user.photoURL }}
                    style={styles.headerAvatar}
                  />
                ) : (
                  <Avatar.Text
                    size={42}
                    label={(user?.name || 'U')[0].toUpperCase()}
                    style={styles.headerAvatar}
                    labelStyle={{ fontSize: 16 }}
                  />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.searchContainer}>
            <View style={styles.searchWrapper}>
              <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
              <Searchbar
                placeholder="Search events, locations..."
                onChangeText={setSearchQuery}
                value={searchQuery}
                style={styles.searchbar}
                inputStyle={styles.searchInput}
                iconColor="transparent"
                placeholderTextColor="#999"
              />
            </View>
          </View>
        </LinearGradient>
      </Animated.View>

      <Animated.ScrollView
        style={styles.scrollView}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#667eea']}
            tintColor="#667eea"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <FlatList
            data={quickActions}
            renderItem={renderQuickAction}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickActionsList}
          />
        </View>

        {/* Featured Events */}
        {featuredEvents.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <View style={styles.sectionIconCircle}>
                  <Ionicons name="star" size={20} color="#FFD700" />
                </View>
                <Text style={styles.sectionTitle}>Featured Events</Text>
              </View>
              <TouchableOpacity>
                <Text style={styles.seeAllText}>See All →</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={featuredEvents}
              renderItem={renderFeaturedEvent}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.featuredList}
            />
          </View>
        )}

        {/* Categories */}
        <View style={styles.categoriesSection}>
          <View style={styles.sectionTitleContainer}>
            <View style={styles.sectionIconCircle}>
              <Ionicons name="grid" size={20} color="#667eea" />
            </View>
            <Text style={styles.sectionTitle}>Categories</Text>
          </View>
          <FlatList
            data={categories}
            renderItem={renderCategory}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesList}
          />
        </View>

        {/* View Mode Toggle */}
        <View style={styles.viewModeContainer}>
          <View style={styles.viewModeToggle}>
            <TouchableOpacity
              style={[styles.viewModeButton, viewMode === 'list' && styles.activeViewMode]}
              onPress={() => setViewMode('list')}
            >
              <Ionicons name="list" size={20} color={viewMode === 'list' ? '#fff' : '#999'} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.viewModeButton, viewMode === 'grid' && styles.activeViewMode]}
              onPress={() => setViewMode('grid')}
            >
              <Ionicons name="grid" size={20} color={viewMode === 'grid' ? '#fff' : '#999'} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Events List */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <View style={styles.sectionIconCircle}>
                <Ionicons name="calendar" size={20} color="#667eea" />
              </View>
              <Text style={styles.sectionTitle}>
                {selectedCategory === 'all' ? 'All Events' : `${categories.find(c => c.id === selectedCategory)?.name} Events`}
              </Text>
            </View>
            {filteredEvents.length > 6 && (
              <TouchableOpacity>
                <Text style={styles.seeAllText}>See All →</Text>
              </TouchableOpacity>
            )}
          </View>

          {filteredEvents.length > 0 ? (
            <View style={viewMode === 'grid' ? styles.eventsGrid : styles.eventsList}>
              {filteredEvents.slice(0, 6).map((event, index) => (
                <View key={event.id} style={viewMode === 'grid' ? styles.gridItem : undefined}>
                  {renderEventCard({ item: event, index })}
                </View>
              ))}
            </View>
          ) : (
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
              <TouchableOpacity style={styles.emptyButton} onPress={() => setSelectedCategory('all')}>
                <LinearGradient
                  colors={['#667eea', '#764ba2']}
                  style={styles.emptyButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.emptyButtonText}>Browse All Events</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.bottomSpacing} />
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

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
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconButton: {
    position: 'relative',
  },
  iconButtonCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FF6B6B',
  },
  headerAvatar: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderWidth: 2,
    borderColor: '#fff',
  },

  searchContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
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

  scrollView: {
    flex: 1,
  },

  quickActionsContainer: {
    marginTop: 24,
    marginBottom: 8,
  },
  quickActionsList: {
    paddingHorizontal: 16,
  },
  quickActionWrapper: {
    marginHorizontal: 6,
  },
  quickActionItem: {
    alignItems: 'center',
    width: 80,
  },
  quickActionGradient: {
    width: 68,
    height: 68,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  quickActionText: {
    fontSize: 13,
    color: '#333',
    fontWeight: '700',
    textAlign: 'center',
  },

  section: {
    marginTop: 28,
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 18,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1a1a1a',
    letterSpacing: -0.5,
  },
  seeAllText: {
    fontSize: 15,
    color: '#667eea',
    fontWeight: '700',
  },

  featuredList: {
    paddingRight: 16,
  },
  featuredCardWrapper: {
    marginRight: 8,
  },
  featuredCard: {
    width: width * 0.78,
    height: 240,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  featuredImage: {
    width: '100%',
    height: '100%',
  },
  featuredImageStyle: {
    borderRadius: 24,
  },
  featuredGradient: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 18,
  },
  featuredBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  featuredBadgeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    gap: 5,
  },
  featuredBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  favoriteBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
    borderRadius: 22,
  },
  featuredContent: {
    gap: 10,
  },
  featuredTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    lineHeight: 28,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  featuredMeta: {
    flexDirection: 'row',
    gap: 18,
  },
  featuredMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  featuredMetaText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  featuredFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  featuredAttendees: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  featuredAttendeesText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '700',
  },
  featuredPrice: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 14,
    overflow: 'hidden',
  },
  featuredPriceText: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '800',
  },

  categoriesSection: {
    marginTop: 28,
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  categoriesList: {
    marginTop: 14,
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

  viewModeContainer: {
    paddingHorizontal: 20,
  },
  viewModeToggle: {
    flexDirection: 'row',
    alignSelf: 'flex-end',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 4,
    gap: 4,
    marginVertical: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  viewModeButton: {
    width: 42,
    height: 42,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeViewMode: {
    backgroundColor: '#667eea',
  },

  eventsGrid: {
    paddingHorizontal: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  eventsList: {
    paddingHorizontal: 14,
  },
  gridItem: {
    width: '48%',
    marginBottom: 14,
  },
  eventCard: {
    marginBottom: 18,
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
  eventCardImage: {
    width: '100%',
    height: 180,
  },
  eventImage: {
    width: '100%',
    height: '100%',
  },
  eventImageStyle: {
    resizeMode: 'cover',
  },
  eventImageOverlay: {
    flex: 1,
  },
  eventDateBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
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
  eventDateDay: {
    fontSize: 20,
    fontWeight: '800',
    color: '#667eea',
  },
  eventDateMonth: {
    fontSize: 11,
    fontWeight: '700',
    color: '#999',
    marginTop: 1,
  },
  eventCategoryBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    borderRadius: 14,
    overflow: 'hidden',
  },
  categoryBadgeGradient: {
    paddingHorizontal: 13,
    paddingVertical: 7,
  },
  eventCategoryText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  eventFavButton: {
    position: 'absolute',
    bottom: 14,
    right: 14,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 9,
    borderRadius: 20,
    backdropFilter: 'blur(10px)',
  },
  eventCardContent: {
    padding: 18,
  },
  eventCardTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: 14,
    lineHeight: 26,
    letterSpacing: -0.3,
  },
  eventCardMeta: {
    flexDirection: 'row',
    gap: 18,
    marginBottom: 14,
  },
  eventCardMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  eventCardMetaText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
    flex: 1,
  },
  eventCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    marginBottom: 14,
  },
  eventCardHost: {
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
  eventCardPrice: {
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
  eventCardActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  eventEngagement: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  engagementText: {
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

  bottomSpacing: {
    height: 120,
  },
});