import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Linking,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  Text,
  Avatar,
  Divider,
  Surface,
} from 'react-native-paper';
import { useAuth } from '../../services/AuthContext';
import { useThemeMode } from '../../services/ThemeContext';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { subscribeToUserTickets } from '../../services/registration';

const { width } = Dimensions.get('window');

export const ProfileScreen: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigation = useNavigation();
  const [previousRole, setPreviousRole] = useState<string | null>(null);
  const { mode, setMode } = useThemeMode();
  const [ticketStats, setTicketStats] = useState({
    total: 0,
    upcoming: 0,
    pending: 0,
  });

  useEffect(() => {
    if (user && previousRole && previousRole !== user.role) {
      if (user.role === 'host') {
        Alert.alert(
          '🎉 Congratulations!',
          'You are now a host! You can create and manage events.',
          [{ text: 'Awesome!', style: 'default' }]
        );
      }
    }
    if (user) {
      setPreviousRole(user.role);
    }
  }, [user?.role, previousRole]);

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          onPress: signOut,
          style: 'destructive'
        },
      ]
    );
  };

  const handleBecomeHost = () => {
    navigation.navigate('HostApplication' as never);
  };

  const handlePaymentHistory = () => {
    navigation.navigate('PaymentHistory' as never);
  };

  const handleOpenHostDashboard = async () => {
    const url = 'https://host-fy93.onrender.com/login';
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Cannot open the host dashboard URL');
      }
    } catch (error) {
      console.error('Error opening host dashboard:', error);
      Alert.alert('Error', 'Failed to open host dashboard');
    }
  };

  useEffect(() => {
    if (!user?.id) {
      setTicketStats({ total: 0, upcoming: 0, pending: 0 });
      return;
    }

    const ticketsUnsubscribe = subscribeToUserTickets(
      user.id,
      tickets => {
        const currentTime = Date.now();
        const upcoming = tickets.filter(ticket => {
          const dateSource =
            ticket.event?.startAt ||
            ticket.event?.date ||
            ticket.purchaseDate ||
            ticket.createdAt;
          if (!dateSource) return false;
          const eventDate =
            dateSource instanceof Date ? dateSource : new Date(dateSource);
          return !Number.isNaN(eventDate.getTime()) && eventDate.getTime() >= currentTime;
        }).length;

        const pending = tickets.filter(
          ticket => (ticket.status || '').toLowerCase() === 'pending'
        ).length;

        setTicketStats({
          total: tickets.length,
          upcoming,
          pending,
        });
      },
      error => {
        console.error('Error subscribing to tickets:', error);
      }
    );

    return () => {
      ticketsUnsubscribe?.();
    };
  }, [user?.id]);

  const stats = useMemo(() => {
    return [
      {
        id: 'upcoming',
        label: 'Upcoming',
        value: ticketStats.upcoming,
        icon: 'event-available',
        gradient: ['#667eea', '#764ba2'],
      },
      {
        id: 'tickets',
        label: 'Tickets',
        value: ticketStats.total,
        icon: 'confirmation-number',
        gradient: ['#f093fb', '#f5576c'],
      },
      {
        id: 'pending',
        label: 'Pending',
        value: ticketStats.pending,
        icon: 'hourglass-top',
        gradient: ['#4facfe', '#00f2fe'],
      },
    ];
  }, [ticketStats]);

  const renderStatCard = (stat: any) => (
    <View key={stat.id} style={styles.statCard}>
      <LinearGradient
        colors={stat.gradient}
        style={styles.statGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <MaterialIcons name={stat.icon} size={28} color="#fff" />
        <Text style={styles.statValue}>{stat.value}</Text>
        <Text style={styles.statLabel}>{stat.label}</Text>
      </LinearGradient>
    </View>
  );

  const renderMenuItem = (
    icon: string,
    title: string,
    description: string,
    onPress: () => void,
    iconColor: string = '#667eea'
  ) => (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.menuIconContainer, { backgroundColor: iconColor + '15' }]}>
        <Ionicons name={icon as any} size={22} color={iconColor} />
      </View>
      <View style={styles.menuContent}>
        <Text style={styles.menuTitle}>{title}</Text>
        <Text style={styles.menuDescription}>{description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#999" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Gradient */}
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.profileHeader}>
            <View style={styles.headerContent}>
              {/* Profile Photo or Avatar */}
              {user?.photoURL ? (
                <Image
                  source={{ uri: user.photoURL }}
                  style={styles.profilePhoto}
                />
              ) : (
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
                  </Text>
                </View>
              )}

              <Text style={styles.userName}>{user?.name || 'User'}</Text>
              <Text style={styles.userEmail}>{user?.email}</Text>

              {user?.role === 'host' && (
                <View style={styles.hostBadge}>
                  <MaterialIcons name="verified" size={16} color="#fff" />
                  <Text style={styles.hostBadgeText}>Host</Text>
                </View>
              )}
            </View>
          </View>
        </LinearGradient>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          {stats.map(renderStatCard)}
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <View style={styles.sectionIconCircle}>
                <Ionicons name="person" size={20} color="#667eea" />
              </View>
              <Text style={styles.sectionTitle}>Account</Text>
            </View>
          </View>

          <Surface style={styles.card} elevation={2}>
            {user?.role === 'host' && (
              <>
                {renderMenuItem(
                  'qr-code-outline',
                  'Scan Tickets',
                  'Check in attendees at your events',
                  () => navigation.navigate('SelectEventToScan' as never),
                  '#10b981'
                )}
                <Divider style={styles.divider} />
              </>
            )}
            {renderMenuItem(
              'person-circle-outline',
              'Edit Profile',
              'Update your personal information',
              () => navigation.navigate('EditProfile' as never),
              '#667eea'
            )}
            <Divider style={styles.divider} />
            {renderMenuItem(
              'card',
              'Payment History',
              'View your transaction history',
              handlePaymentHistory,
              '#f093fb'
            )}
          </Surface>
        </View>

        {/* Become a Host Section */}
        {user?.role === 'attendee' && !user?.hostApplication && (
          <View style={styles.section}>
            <Surface style={styles.becomeHostCard} elevation={3}>
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.becomeHostGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.becomeHostIcon}>
                  <Ionicons name="rocket" size={40} color="#fff" />
                </View>
                <Text style={styles.becomeHostTitle}>Become a Host</Text>
                <Text style={styles.becomeHostDescription}>
                  Create and manage your own events. Start building your event community today!
                </Text>
                <TouchableOpacity
                  style={styles.becomeHostButton}
                  onPress={handleBecomeHost}
                  activeOpacity={0.8}
                >
                  <Text style={styles.becomeHostButtonText}>Apply Now</Text>
                  <Ionicons name="arrow-forward" size={18} color="#667eea" />
                </TouchableOpacity>
              </LinearGradient>
            </Surface>
          </View>
        )}

        {/* Host Application Status */}
        {user?.role === 'attendee' && user?.hostApplication && (
          <View style={styles.section}>
            <Surface style={styles.card} elevation={2}>
              <View style={styles.applicationStatus}>
                <View style={styles.applicationHeader}>
                  <View style={styles.sectionIconCircle}>
                    <Ionicons name="hourglass" size={20} color="#fa709a" />
                  </View>
                  <Text style={styles.sectionTitle}>Application Status</Text>
                </View>

                <View style={[
                  styles.statusBadge,
                  {
                    backgroundColor: user.hostApplication.status === 'pending' ? '#fef3c7' :
                      user.hostApplication.status === 'approved' ? '#d1fae5' : '#fee2e2'
                  }
                ]}>
                  <Ionicons
                    name={
                      user.hostApplication.status === 'pending' ? 'time' :
                        user.hostApplication.status === 'approved' ? 'checkmark-circle' : 'close-circle'
                    }
                    size={20}
                    color={
                      user.hostApplication.status === 'pending' ? '#d97706' :
                        user.hostApplication.status === 'approved' ? '#059669' : '#dc2626'
                    }
                  />
                  <Text style={[
                    styles.statusText,
                    {
                      color: user.hostApplication.status === 'pending' ? '#d97706' :
                        user.hostApplication.status === 'approved' ? '#059669' : '#dc2626'
                    }
                  ]}>
                    {user.hostApplication.status.toUpperCase()}
                  </Text>
                </View>

                {user.hostApplication.rejectionReason && (
                  <Text style={styles.rejectionReason}>
                    Reason: {user.hostApplication.rejectionReason}
                  </Text>
                )}
              </View>
            </Surface>
          </View>
        )}

        {/* Host Dashboard */}
        {user?.role === 'host' && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <View style={styles.sectionIconCircle}>
                  <Ionicons name="business" size={20} color="#43e97b" />
                </View>
                <Text style={styles.sectionTitle}>Host Dashboard</Text>
              </View>
            </View>

            <Surface style={styles.hostDashboardCard} elevation={3}>
              <LinearGradient
                colors={['#43e97b', '#38f9d7']}
                style={styles.hostDashboardGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.hostDashboardIcon}>
                  <Ionicons name="globe" size={40} color="#fff" />
                </View>
                <Text style={styles.hostDashboardTitle}>Access Host Dashboard</Text>
                <Text style={styles.hostDashboardDescription}>
                  Manage your events, track analytics, and handle all host activities from the web dashboard
                </Text>
                <TouchableOpacity
                  style={styles.hostDashboardButton}
                  onPress={handleOpenHostDashboard}
                  activeOpacity={0.8}
                >
                  <Text style={styles.hostDashboardButtonText}>Open Dashboard</Text>
                  <Ionicons name="open-outline" size={18} color="#43e97b" />
                </TouchableOpacity>
              </LinearGradient>
            </Surface>
          </View>
        )}

        {/* Settings Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <View style={styles.sectionIconCircle}>
                <Ionicons name="settings" size={20} color="#667eea" />
              </View>
              <Text style={styles.sectionTitle}>Settings</Text>
            </View>
          </View>

          <Surface style={styles.card} elevation={2}>
            {renderMenuItem(
              'heart',
              'Favorites',
              'View your saved events',
              () => navigation.navigate('Favorites' as never),
              '#ff6b6b'
            )}
            <Divider style={styles.divider} />
            {renderMenuItem(
              'notifications',
              'Notifications',
              'Manage notification preferences',
              () => navigation.navigate('Settings' as never),
              '#f093fb'
            )}
            <Divider style={styles.divider} />
            {renderMenuItem(
              'color-palette',
              'Theme',
              `Current: ${mode.charAt(0).toUpperCase() + mode.slice(1)}`,
              () => {
                Alert.alert(
                  'Theme',
                  'Choose your theme preference',
                  [
                    { text: 'Light', onPress: () => setMode('light') },
                    { text: 'Dark', onPress: () => setMode('dark') },
                    { text: 'System', onPress: () => setMode('system') },
                    { text: 'Cancel', style: 'cancel' },
                  ]
                );
              },
              '#667eea'
            )}
            <Divider style={styles.divider} />
            {renderMenuItem(
              'log-out',
              'Sign Out',
              'Sign out of your account',
              handleSignOut,
              '#FF6B6B'
            )}
          </Surface>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Events Marketplace v1.0.0</Text>
          <Text style={styles.footerSubtext}>Made with ❤️ for event lovers</Text>
        </View>
      </ScrollView>
    </SafeAreaView >
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingBottom: 30,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  headerContent: {
    alignItems: 'center',
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 3,
    borderColor: '#fff',
  },
  profilePhoto: {
    width: 96,
    height: 96,
    borderRadius: 48,
    marginBottom: 16,
    borderWidth: 3,
    borderColor: '#fff',
  },
  avatarLabel: {
    fontSize: 40,
    fontWeight: '700',
  },
  userName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  userEmail: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 16,
    fontWeight: '500',
  },
  roleContainer: {
    marginBottom: 8,
  },
  roleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  roleText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 24,
    gap: 12,
    marginBottom: 8,
  },
  statCard: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  statGradient: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    marginBottom: 16,
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
    fontSize: 22,
    fontWeight: '800',
    color: '#1a1a1a',
    letterSpacing: -0.5,
  },
  card: {
    borderRadius: 20,
    backgroundColor: '#fff',
    overflow: 'hidden',
    paddingVertical: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  menuIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 3,
  },
  menuDescription: {
    fontSize: 13,
    color: '#999',
    fontWeight: '500',
  },
  divider: {
    marginHorizontal: 18,
    backgroundColor: '#f0f0f0',
  },
  becomeHostCard: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  becomeHostGradient: {
    padding: 28,
    alignItems: 'center',
  },
  becomeHostIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  becomeHostTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  becomeHostDescription: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  becomeHostButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  becomeHostButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#667eea',
  },
  applicationStatus: {
    padding: 18,
  },
  applicationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    gap: 8,
  },
  statusText: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  rejectionReason: {
    fontSize: 14,
    color: '#666',
    marginTop: 12,
    lineHeight: 20,
  },
  hostDashboardCard: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  hostDashboardGradient: {
    padding: 28,
    alignItems: 'center',
  },
  hostDashboardIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  hostDashboardTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 12,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  hostDashboardDescription: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  hostDashboardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  hostDashboardButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#43e97b',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 13,
    color: '#999',
    fontWeight: '600',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 12,
    color: '#bbb',
    fontWeight: '500',
  },
});