import React, { useEffect, useState } from 'react';
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
import { useAuth } from '../services/AuthContext';
import { supabase } from '../services/supabase';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

interface PaymentItem {
  id: string;
  amount: number;
  currency: string;
  type: 'subscription' | 'ticket' | 'event' | 'other';
  status: 'succeeded' | 'pending' | 'failed' | 'refunded';
  method: 'stripe' | 'manual' | 'cash' | 'bank_transfer' | 'card';
  description?: string;
  eventId?: string;
  ticketId?: string;
  createdAt?: Date;
  event?: {
    title?: string;
    posterURL?: string;
  };
}

export const PaymentHistoryScreen: React.FC = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');

  useEffect(() => {
    if (!user?.id) {
      setPayments([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const loadPayments = async () => {
      try {
        const { data, error } = await supabase
          .from('payments')
          .select('*, event:events(title, poster_url, image_url)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const paymentsData: PaymentItem[] = (data || []).map((row: any) => ({
          id: row.id,
          amount: row.amount || 0,
          currency: row.currency || '$',
          type: row.type || 'other',
          status: row.status === 'completed' ? 'succeeded' : (row.status || 'pending'),
          method: row.payment_method || 'manual',
          description: row.notes,
          eventId: row.event_id,
          ticketId: row.ticket_id,
          createdAt: row.created_at ? new Date(row.created_at) : new Date(),
          event: row.event
            ? { title: row.event.title, posterURL: row.event.poster_url || row.event.image_url }
            : undefined,
        }));

        setPayments(paymentsData);
      } catch (error) {
        console.error('Error loading payments:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPayments();

    const channel = supabase
      .channel(`payment-history-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'payments', filter: `user_id=eq.${user.id}` },
        loadPayments
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);
  const onRefresh = async () => {
    setRefreshing(true);
    // The snapshot listener will automatically update
    setTimeout(() => setRefreshing(false), 1000);
  };

  const filters = [
    { id: 'all', name: 'All', icon: 'apps' },
    { id: 'succeeded', name: 'Paid', icon: 'checkmark-circle' },
    { id: 'pending', name: 'Pending', icon: 'time' },
    { id: 'failed', name: 'Failed', icon: 'close-circle' },
    { id: 'refunded', name: 'Refunded', icon: 'refresh' },
  ];

  const getStatusConfig = (status: PaymentItem['status']) => {
    switch (status) {
      case 'succeeded':
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
      case 'failed':
        return {
          gradient: ['#ff9a9e', '#fecfef'] as [string, string],
          icon: 'close-circle',
          color: '#dc2626',
        };
      case 'refunded':
        return {
          gradient: ['#a8edea', '#fed6e3'] as [string, string],
          icon: 'refresh',
          color: '#059669',
        };
      default:
        return {
          gradient: ['#667eea', '#764ba2'] as [string, string],
          icon: 'help-circle',
          color: '#666',
        };
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'stripe':
      case 'card':
        return 'card';
      case 'cash':
        return 'cash';
      case 'bank_transfer':
        return 'business';
      default:
        return 'wallet';
    }
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return 'Date unknown';
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatAmount = (amount: number, currency: string) => {
    return `${currency}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const filteredPayments =
    selectedFilter === 'all'
      ? payments
      : payments.filter((p) => p.status.toLowerCase() === selectedFilter.toLowerCase());

  const totalAmount = filteredPayments
    .filter((p) => p.status === 'succeeded')
    .reduce((sum, p) => sum + p.amount, 0);

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

  const renderPayment = ({ item, index }: { item: PaymentItem; index: number }) => {
    const statusConfig = getStatusConfig(item.status);
    const eventImage = item.event?.posterURL || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800';

    return (
      <TouchableOpacity
        style={styles.paymentCard}
        activeOpacity={0.9}
      >
        <Surface style={styles.paymentSurface} elevation={3}>
          {/* Payment Header with Event Image */}
          {item.event?.posterURL && (
            <ImageBackground
              source={{ uri: eventImage }}
              style={styles.paymentHeader}
              imageStyle={styles.paymentHeaderImage}
            >
              <LinearGradient
                colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.8)']}
                style={styles.paymentHeaderGradient}
              >
                <View style={styles.statusBadgeContainer}>
                  <LinearGradient
                    colors={statusConfig.gradient}
                    style={styles.statusBadge}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Ionicons name={statusConfig.icon as any} size={14} color="#fff" />
                    <Text style={styles.statusText}>
                      {item.status.toUpperCase()}
                    </Text>
                  </LinearGradient>
                </View>

                {item.event?.title && (
                  <View style={styles.paymentHeaderContent}>
                    <Text style={styles.eventTitle} numberOfLines={2}>
                      {item.event.title}
                    </Text>
                  </View>
                )}
              </LinearGradient>
            </ImageBackground>
          )}

          {/* Payment Body */}
          <View style={styles.paymentBody}>
            {/* Amount */}
            <View style={styles.amountContainer}>
              <Text style={styles.amountLabel}>Amount</Text>
              <Text style={styles.amountValue}>
                {formatAmount(item.amount, item.currency)}
              </Text>
            </View>

            {/* Payment Details */}
            <View style={styles.paymentDetails}>
              <View style={styles.detailRow}>
                <View style={styles.detailIconContainer}>
                  <Ionicons name={getMethodIcon(item.method) as any} size={18} color="#667eea" />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Payment Method</Text>
                  <Text style={styles.detailValue}>
                    {item.method.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                  </Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <View style={styles.detailIconContainer}>
                  <Ionicons name="calendar-outline" size={18} color="#f093fb" />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Date</Text>
                  <Text style={styles.detailValue}>{formatDate(item.createdAt)}</Text>
                </View>
              </View>

              {item.description && (
                <View style={styles.detailRow}>
                  <View style={styles.detailIconContainer}>
                    <Ionicons name="document-text-outline" size={18} color="#4facfe" />
                  </View>
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>Description</Text>
                    <Text style={styles.detailValue} numberOfLines={2}>
                      {item.description}
                    </Text>
                  </View>
                </View>
              )}

              {item.type && (
                <View style={styles.detailRow}>
                  <View style={styles.detailIconContainer}>
                    <Ionicons name="pricetag-outline" size={18} color="#43e97b" />
                  </View>
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>Type</Text>
                    <Text style={styles.detailValue}>
                      {item.type.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerDotLeft} />
              <View style={styles.divider} />
              <View style={styles.dividerDotRight} />
            </View>

            {/* Payment Footer */}
            <View style={styles.paymentFooter}>
              <View style={styles.receiptContainer}>
                <Ionicons name="receipt-outline" size={18} color="#999" />
                <Text style={styles.receiptText}>Payment ID: {item.id.slice(-8)}</Text>
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
          <Text style={styles.loadingText}>Loading payment history...</Text>
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
            <Text style={styles.headerTitle}>Payment History</Text>
            <Text style={styles.headerSubtitle}>
              {filteredPayments.length} payment{filteredPayments.length !== 1 ? 's' : ''} found
              {selectedFilter === 'all' && totalAmount > 0 && (
                ` • Total: ${formatAmount(totalAmount, payments[0]?.currency || '$')}`
              )}
            </Text>
          </View>
          <TouchableOpacity style={styles.headerIconButton}>
            <View style={styles.iconButtonCircle}>
              <Ionicons name="download-outline" size={22} color="#667eea" />
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

      {/* Payments List */}
      {filteredPayments.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="card-outline" size={60} color="#ccc" />
          </View>
          <Text style={styles.emptyTitle}>No Payments Found</Text>
          <Text style={styles.emptySubtext}>
            {selectedFilter === 'all'
              ? 'Your payment history will appear here'
              : `No ${selectedFilter} payments found`}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredPayments}
          renderItem={renderPayment}
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
  paymentCard: {
    marginBottom: 20,
  },
  paymentSurface: {
    borderRadius: 24,
    backgroundColor: '#fff',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  paymentHeader: {
    height: 140,
  },
  paymentHeaderImage: {
    resizeMode: 'cover',
  },
  paymentHeaderGradient: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  statusBadgeContainer: {
    alignSelf: 'flex-start',
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
  paymentHeaderContent: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  eventTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    lineHeight: 28,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  paymentBody: {
    padding: 20,
  },
  amountContainer: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  amountLabel: {
    fontSize: 14,
    color: '#999',
    fontWeight: '600',
    marginBottom: 6,
  },
  amountValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1a1a1a',
    letterSpacing: -0.5,
  },
  paymentDetails: {
    gap: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  detailIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#f5f5f5',
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
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 15,
    color: '#1a1a1a',
    fontWeight: '700',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerDotLeft: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 8,
  },
  dividerDotRight: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
  },
  paymentFooter: {
    paddingTop: 12,
  },
  receiptContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  receiptText: {
    fontSize: 13,
    color: '#999',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 60,
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
  },
});
