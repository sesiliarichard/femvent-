import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  ImageBackground,
} from 'react-native';
import {
  Text,
  ActivityIndicator,
  Surface,
} from 'react-native-paper';
import { useAuth } from '../../services/AuthContext';
import { Ticket } from '../../types';
import { getUserTickets, subscribeToUserTickets } from '../../services/registration';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types';

const { width } = Dimensions.get('window');

type TicketsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const TicketsScreen: React.FC = () => {
  const { user } = useAuth();
  const navigation = useNavigation<TicketsScreenNavigationProp>();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');

  useEffect(() => {
    if (!user?.id) {
      setTickets([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToUserTickets(
      user.id,
      updatedTickets => {
        setTickets(updatedTickets);
        setLoading(false);
      },
      () => setLoading(false)
    );

    return () => {
      unsubscribe?.();
    };
  }, [user?.id]);

  const loadTickets = async () => {
    if (!user?.id) {
      setTickets([]);
      return;
    }

    try {
      const userTickets = await getUserTickets(user.id);
      setTickets(userTickets);
    } catch (error) {
      console.error('Error loading tickets:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadTickets();
    } finally {
      setRefreshing(false);
    }
  };

  const filters = [
    { id: 'all', name: 'All', icon: 'apps' },
    { id: 'confirmed', name: 'Confirmed', icon: 'checkmark-circle' },
    { id: 'pending', name: 'Pending', icon: 'time' },
    { id: 'refunded', name: 'Refunded', icon: 'close-circle' },
  ];

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'confirmed':
        return {
          gradient: ['#43e97b', '#38f9d7'] as [string, string],
          icon: 'checkmark-circle',
          color: '#059669',
        };
      case 'pending':
        return {
          gradient: ['#fa709a', '#fee140'] as [string, string],
          icon: 'time',
          color: '#d97706',
        };
      case 'refunded':
        return {
          gradient: ['#ff9a9e', '#fecfef'] as [string, string],
          icon: 'close-circle',
          color: '#dc2626',
        };
      default:
        return {
          gradient: ['#667eea', '#764ba2'] as [string, string],
          icon: 'help-circle',
          color: '#666',
        };
    }
  };

  const getCategoryConfig = (ticket: Ticket) => {
    const raw = (ticket.priceOption?.name || (ticket as any).type || 'general').toLowerCase();

    if (raw.includes('vip')) {
      return {
        key: 'vip',
        label: 'VIP',
        gradient: ['#1f1c2c', '#3d3450'] as [string, string],
        accent: '#d4af37',
        badgeGradient: ['#bf953f', '#fcf6ba'] as [string, string],
        icon: 'star' as const,
      };
    }
    if (raw.includes('free')) {
      return {
        key: 'free',
        label: 'FREE',
        gradient: ['#0ba360', '#3cba92'] as [string, string],
        accent: '#0ba360',
        badgeGradient: ['#43e97b', '#38f9d7'] as [string, string],
        icon: 'gift' as const,
      };
    }
    return {
      key: 'general',
      label: 'GENERAL',
      gradient: ['#667eea', '#764ba2'] as [string, string],
      accent: '#667eea',
      badgeGradient: ['#667eea', '#764ba2'] as [string, string],
      icon: 'ticket' as const,
    };
  };

  const getPosterImage = (ticket: Ticket) =>
    ticket.event?.posterURL ||
    (ticket.event as any)?.bannerURL ||
    ticket.event?.imageURL ||
    'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800';

  const getEventTitle = (ticket: Ticket) => {
    const event = ticket.event as any;
    return event?.title || event?.name || 'Upcoming Event';
  };

  const formatEventDateTime = (ticket: Ticket) => {
    const dateSource =
      ticket.event?.startAt ||
      ticket.event?.date ||
      ticket.purchaseDate ||
      ticket.createdAt;

    if (!dateSource) {
      return 'Date to be announced';
    }

    const eventDate = dateSource instanceof Date ? dateSource : new Date(dateSource);
    if (Number.isNaN(eventDate.getTime())) {
      return 'Date to be announced';
    }

    const datePart = eventDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const timePart = eventDate.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    return `${datePart} at ${timePart}`;
  };

  const getEventVenue = (ticket: Ticket) => {
    const venue = (ticket.event as any)?.venue;
    if (venue?.name && venue?.city) {
      return `${venue.name}, ${venue.city}`;
    }
    if (venue?.name) {
      return venue.name;
    }
    if (ticket.event?.location) {
      return ticket.event.location;
    }
    return 'Location to be announced';
  };

  const getTicketTypeLabel = (ticket: Ticket) => {
    if (ticket.priceOption?.name) return ticket.priceOption.name;
    if (ticket.type) {
      return ticket.type.replace('_', ' ').toUpperCase();
    }
    return 'General Admission';
  };

  const getTicketPriceValue = (ticket: Ticket) => {
    const price =
      ticket.priceOption?.price ?? ticket.price ?? ticket.event?.price ?? 0;
    if (!price || Number(price) === 0) {
      return 'Free';
    }

    const currency =
      ticket.priceOption?.currency || ticket.currency || ticket.event?.currency || '$';

    return `${currency}${Number(price).toLocaleString()}`;
  };

  const filteredTickets =
    selectedFilter === 'all'
      ? tickets
      : tickets.filter(
        t => (t.status || '').toLowerCase() === selectedFilter.toLowerCase()
      );

  const renderFilter = ({ item }: { item: any }) => {
    const selected = selectedFilter === item.id;

    return (
      <TouchableOpacity
        style={styles.filterWrapper}
        onPress={() => setSelectedFilter(item.id)}
        activeOpacity={0.7}
      >
        {selected ? (
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.filterChip}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name={item.icon as any} size={16} color="#fff" />
            <Text style={[styles.filterText, styles.selectedFilterText]}>
              {item.name}
            </Text>
          </LinearGradient>
        ) : (
          <View style={[styles.filterChip, styles.unselectedFilter]}>
            <Ionicons name={item.icon as any} size={16} color="#666" />
            <Text style={styles.filterText}>{item.name}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderTicket = ({ item, index }: { item: Ticket; index: number }) => {
    const statusConfig = getStatusConfig(item.status);
    const categoryConfig = getCategoryConfig(item);

    return (
      <TouchableOpacity
        style={styles.ticketCard}
        activeOpacity={0.9}
        onPress={() => {
          // Navigate to ticket detail
        }}
      >
        <Surface style={styles.ticketSurface} elevation={3}>
          {/* Ticket Header with Image */}
          <ImageBackground
            source={{ uri: getPosterImage(item) }}
            style={styles.ticketHeader}
            imageStyle={styles.ticketHeaderImage}
          >
            <LinearGradient
              colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.8)']}
              style={styles.ticketHeaderGradient}
            >
  {/* Status + Category Badges */}
  <View style={styles.badgeRow}>
                <View style={styles.statusBadgeContainer}>
                  <LinearGradient
                    colors={statusConfig.gradient}
                    style={styles.statusBadge}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Ionicons name={statusConfig.icon as any} size={14} color="#fff" />
                    <Text style={styles.statusText}>
                      {(item.status || 'pending').toUpperCase()}
                    </Text>
                  </LinearGradient>
                </View>

                <LinearGradient
                  colors={categoryConfig.badgeGradient}
                  style={styles.categoryBadge}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons
                    name={categoryConfig.icon as any}
                    size={12}
                    color={categoryConfig.key === 'vip' ? '#3d2e00' : '#fff'}
                  />
                  <Text
                    style={[
                      styles.categoryBadgeText,
                      categoryConfig.key === 'vip' && { color: '#3d2e00' },
                    ]}
                  >
                    {categoryConfig.label}
                  </Text>
                </LinearGradient>
              </View>

              {/* Event Title */}
              <View style={styles.ticketHeaderContent}>
                <Text style={styles.ticketTitle} numberOfLines={2}>
                  {getEventTitle(item)}
                </Text>
              </View>
            </LinearGradient>
          </ImageBackground>

          {/* Ticket Body */}
          <View style={styles.ticketBody}>
            {/* Event Details */}
            <View style={styles.ticketDetails}>
              <View style={styles.detailRow}>
                <View style={styles.detailIconContainer}>
                  <Ionicons name="calendar-outline" size={18} color="#667eea" />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Date & Time</Text>
                  <Text style={styles.detailValue}>
                    {formatEventDateTime(item)}
                  </Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <View style={styles.detailIconContainer}>
                  <Ionicons name="location-outline" size={18} color="#f093fb" />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Venue</Text>
                  <Text style={styles.detailValue} numberOfLines={1}>
                    {getEventVenue(item)}
                  </Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <View style={[styles.detailIconContainer, { backgroundColor: `${categoryConfig.accent}1A` }]}>
                  <Ionicons name="ticket-outline" size={18} color={categoryConfig.accent} />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Ticket Type</Text>
                  <Text style={[styles.detailValue, { color: categoryConfig.accent }]}>
                    {getTicketTypeLabel(item)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Divider with dots */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerDotLeft} />
              <View style={styles.divider} />
              <View style={styles.dividerDotRight} />
            </View>

            {/* Ticket Footer */}
            <View style={styles.ticketFooter}>
            <View style={styles.priceContainer}>
                <Text style={styles.priceLabel}>Total Paid</Text>
                <Text style={[styles.priceValue, { color: categoryConfig.accent }]}>
                  {getTicketPriceValue(item)}
                </Text>
              </View>

              <View style={styles.ticketActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => navigation.navigate('TicketDetail', { ticketId: item.id })}
                >
                  <LinearGradient
                    colors={categoryConfig.gradient}
                    style={styles.actionButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Ionicons name="qr-code" size={18} color="#fff" />
                    <Text style={styles.actionButtonText}>Show QR</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
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
          <Text style={styles.loadingText}>Loading your tickets...</Text>
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
            <Text style={styles.headerTitle}>My Tickets</Text>
            <Text style={styles.headerSubtitle}>
              {filteredTickets.length} ticket{filteredTickets.length !== 1 ? 's' : ''} found
            </Text>
          </View>
          <TouchableOpacity style={styles.headerIconButton}>
            <View style={styles.iconButtonCircle}>
              <Ionicons name="scan" size={22} color="#667eea" />
            </View>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <FlatList
          data={filters}
          renderItem={renderFilter}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersList}
        />
      </View>

      {/* Tickets List */}
      {filteredTickets.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="ticket-outline" size={60} color="#ccc" />
          </View>
          <Text style={styles.emptyTitle}>No Tickets Found</Text>
          <Text style={styles.emptySubtext}>
            {selectedFilter === 'all'
              ? 'Start exploring events to get your first ticket!'
              : `No ${selectedFilter} tickets found`}
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => setSelectedFilter('all')}
          >
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.emptyButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.emptyButtonText}>
                {selectedFilter === 'all' ? 'Explore Events' : 'View All Tickets'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredTickets}
          renderItem={renderTicket}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#667eea']}
              tintColor="#667eea"
            />
          }
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
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
  headerIconButton: {
    width: 46,
    height: 46,
  },
  iconButtonCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  filtersContainer: {
    backgroundColor: 'transparent',
    paddingVertical: 20,
  },
  filtersList: {
    paddingHorizontal: 20,
  },
  filterWrapper: {
    marginRight: 10,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 7,
  },
  unselectedFilter: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  filterText: {
    fontSize: 15,
    color: '#666',
    fontWeight: '700',
  },
  selectedFilterText: {
    color: '#fff',
  },
  listContainer: {
    padding: 16,
  },
  ticketCard: {
    marginBottom: 20,
  },
  ticketSurface: {
    borderRadius: 24,
    backgroundColor: '#fff',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  ticketHeader: {
    height: 140,
  },
  ticketHeaderImage: {
    resizeMode: 'cover',
  },
  ticketHeaderGradient: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  statusBadgeContainer: {
    alignSelf: 'flex-start',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryBadgeText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  statusText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  ticketHeaderContent: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  ticketTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    lineHeight: 28,
    letterSpacing: -0.3,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  ticketBody: {
    padding: 18,
  },
  ticketDetails: {
    gap: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  detailIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#999',
    fontWeight: '600',
    marginBottom: 3,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 15,
    color: '#1a1a1a',
    fontWeight: '700',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
  },
  dividerDotLeft: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    marginLeft: -30,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#f0f0f0',
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  dividerDotRight: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    marginRight: -30,
  },
  ticketFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceContainer: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 12,
    color: '#999',
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  priceValue: {
    fontSize: 24,
    color: '#667eea',
    fontWeight: '800',
  },
  ticketActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  emptySubtext: {
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