import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Dimensions,
  Image,
} from 'react-native';
import { Text, ActivityIndicator, Searchbar, Avatar } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../services/AuthContext';
import { getEventAttendeesList } from '../services/registration';
import { supabase } from '../services/supabase';

const { width } = Dimensions.get('window');

interface Attendee {
  id: string;
  name: string;
  email: string;
  photoURL?: string;
  registrationDate: Date;
  ticketStatus: string;
}

interface AttendeesListScreenProps {
  navigation: any;
  route?: {
    params?: {
      eventId?: string;
    };
  };
}

export default function AttendeesListScreen({ navigation, route }: AttendeesListScreenProps) {
  const { eventId } = route?.params || {};
  const { user } = useAuth();
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [event, setEvent] = useState<any>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const fetchAttendees = async () => {
      try {
        if (eventId) {
          // Fetch event data
          const { data: eventData, error: eventError } = await supabase
            .from('events')
            .select('*')
            .eq('id', eventId)
            .maybeSingle();

          if (!eventError && eventData) {
            setEvent(eventData);
          }

          // Fetch attendees using the service method
          const attendeesList = await getEventAttendeesList(eventId);
          
          // Ensure we have an array and filter out current user from the list
          if (Array.isArray(attendeesList)) {
            const filteredAttendees = attendeesList.filter(attendee => attendee.id !== user?.id);
            
            // Sort attendees by registration date (newest first)
            filteredAttendees.sort((a, b) => b.registrationDate.getTime() - a.registrationDate.getTime());
            setAttendees(filteredAttendees);
          } else {
            console.error('getEventAttendeesList returned non-array:', attendeesList);
            setAttendees([]);
          }
        }
      } catch (error) {
        console.error('Error fetching attendees:', error);
        Alert.alert('Error', 'Failed to load attendees list');
      } finally {
        setLoading(false);
      }
    };

    fetchAttendees();
  }, [eventId, user]);

  const filteredAttendees = attendees.filter(attendee =>
    attendee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    attendee.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const startPrivateChat = (attendee: Attendee) => {
    navigation.navigate('PrivateChat', {
      eventId: eventId,
      recipientId: attendee.id,
      recipientName: attendee.name,
      recipientPhotoURL: attendee.photoURL,
    });
  };

  const renderAttendee = ({ item }: { item: Attendee }) => (
    <TouchableOpacity
      style={styles.attendeeCard}
      onPress={() => startPrivateChat(item)}
    >
      <View style={styles.attendeeInfo}>
        <Avatar.Image
          size={50}
          source={item.photoURL ? { uri: item.photoURL } : undefined}
          style={styles.avatar}
        />
        <View style={styles.attendeeDetails}>
          <Text style={styles.attendeeName}>{item.name}</Text>
          <Text style={styles.attendeeEmail}>{item.email}</Text>
          <View style={styles.statusContainer}>
            <View style={[
              styles.statusBadge,
              { backgroundColor: item.ticketStatus === 'confirmed' ? '#10b981' : '#f59e0b' }
            ]}>
              <Text style={styles.statusText}>
                {item.ticketStatus === 'confirmed' ? 'Confirmed' : 'Pending'}
              </Text>
            </View>
            <Text style={styles.registrationDate}>
              Registered {item.registrationDate.toLocaleDateString()}
            </Text>
          </View>
        </View>
      </View>
      <TouchableOpacity
        style={styles.chatButton}
        onPress={() => startPrivateChat(item)}
      >
        <Ionicons name="chatbubble-outline" size={24} color="#6366f1" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading attendees...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Modern Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.navigate('EventDetail', { eventId: route?.params?.eventId })}
          >
            <Ionicons name="chevron-back" size={24} color="#1a1a1a" />
          </TouchableOpacity>
          
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>Event Attendees</Text>
            <Text style={styles.headerSubtitle}>{event?.title}</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.headerAction}
            onPress={() => {
              Alert.alert('Attendees Info', `Connect with ${attendees.length} registered attendees!`);
            }}
          >
            <Ionicons name="information-circle-outline" size={24} color="#6366f1" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Modern Search Section */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Searchbar
            placeholder="Search attendees..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchBar}
            inputStyle={styles.searchInput}
            iconColor="#6366f1"
          />
        </View>
        
        <View style={styles.countContainer}>
          <Text style={styles.countText}>
            {filteredAttendees.length} attendee{filteredAttendees.length !== 1 ? 's' : ''} found
          </Text>
        </View>
      </View>

      {/* Attendees List */}
      <FlatList
        data={filteredAttendees}
        renderItem={renderAttendee}
        keyExtractor={(item) => item.id}
        style={styles.attendeesList}
        contentContainerStyle={styles.attendeesContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={80} color="#6366f1" />
            <Text style={styles.emptyTitle}>No Attendees Found</Text>
            <Text style={styles.emptyDescription}>
              {searchQuery ? 'Try adjusting your search terms' : 'No other attendees have registered yet'}
            </Text>
          </View>
        }
      />

      {/* Modern Bottom Navigation */}
      <View style={[styles.bottomNav, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity 
          style={styles.bottomNavItem}
          onPress={() => {
            if (eventId) {
              navigation.navigate('EventDetail', { eventId });
            } else {
              Alert.alert('Error', 'Event data not available');
            }
          }}
        >
          <Ionicons name="home" size={24} color="#9ca3af" />
          <Text style={styles.bottomNavLabel}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.bottomNavItem}
          onPress={() => {
            if (eventId) {
              navigation.navigate('Schedule', { eventId });
            } else {
              Alert.alert('Error', 'Event data not available');
            }
          }}
        >
          <Ionicons name="calendar" size={24} color="#9ca3af" />
          <Text style={styles.bottomNavLabel}>Schedule</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.bottomNavItem}
          onPress={() => {
            if (eventId) {
              navigation.navigate('SpeakersList', { eventId });
            } else {
              Alert.alert('Error', 'Event data not available');
            }
          }}
        >
          <Ionicons name="people" size={24} color="#9ca3af" />
          <Text style={styles.bottomNavLabel}>Speakers</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.bottomNavItem}
          onPress={() => {
            if (eventId) {
              navigation.navigate('Sponsor', { eventId });
            } else {
              Alert.alert('Error', 'Event data not available');
            }
          }}
        >
          <Ionicons name="business" size={24} color="#9ca3af" />
          <Text style={styles.bottomNavLabel}>Partners</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.bottomNavItem, styles.activeNavItem]}
          onPress={() => {
            // Stay on attendees page
          }}
        >
          <Ionicons name="chatbubble" size={24} color="#6366f1" />
          <Text style={[styles.bottomNavLabel, styles.activeNavLabel]}>Chat</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    color: '#64748b',
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  headerAction: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchSection: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  navTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  navSubtitle: {
    color: '#cccccc',
    fontSize: 12,
    marginTop: 2,
  },
  searchContainer: {
    marginBottom: 12,
  },
  searchBar: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    elevation: 0,
    shadowOpacity: 0,
  },
  searchInput: {
    color: '#1e293b',
  },
  countContainer: {
    alignItems: 'center',
  },
  countText: {
    color: '#6366f1',
    fontSize: 14,
    fontWeight: '600',
  },
  attendeesList: {
    flex: 1,
  },
  attendeesContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  attendeeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  attendeeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    backgroundColor: '#6366f1',
  },
  attendeeDetails: {
    marginLeft: 16,
    flex: 1,
  },
  attendeeName: {
    color: '#1e293b',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  attendeeEmail: {
    color: '#64748b',
    fontSize: 14,
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  registrationDate: {
    color: '#9ca3af',
    fontSize: 12,
  },
  chatButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f0f4ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    backgroundColor: '#f8fafc',
  },
  emptyTitle: {
    color: '#1e293b',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    color: '#64748b',
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingTop: 16,
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  bottomNavItem: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    flex: 1,
  },
  bottomNavLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
    fontWeight: '500',
  },
  activeNavItem: {
    backgroundColor: '#f0f4ff',
  },
});

