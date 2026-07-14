import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Dimensions,
  ScrollView,
  Image,
  BackHandler,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Text, ActivityIndicator, Avatar } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../services/AuthContext';
import { checkEventRegistration } from '../services/registration';
import { supabase } from '../services/supabase';

const { width } = Dimensions.get('window');

interface Message {
  id: string;
  text: string;
  userId: string;
  userName: string;
  userPhotoURL?: string;
  timestamp: Date;
  eventId: string;
}

interface ChatScreenProps {
  navigation: any;
  route?: {
    params?: {
      eventId?: string;
    };
  };
}

export default function ChatScreen({ navigation, route }: ChatScreenProps) {
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

  const { eventId } = route?.params || {};
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [event, setEvent] = useState<any>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [attendeeCount, setAttendeeCount] = useState(0);
  const [speakerCount, setSpeakerCount] = useState(0);
  const [sessionCount, setSessionCount] = useState(0);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const fetchEventAndCheckRegistration = async () => {
      try {
        if (eventId) {
          // Fetch event data
          const { data: eventData } = await supabase
            .from('events')
            .select('*')
            .eq('id', eventId)
            .maybeSingle();

          if (eventData) {
            setEvent(eventData);
            setSpeakerCount((eventData as any).speakers?.length || 0);
            setSessionCount((eventData as any).agenda?.length || 0);
          }

          // Get real attendee count from tickets
          const { data: ticketsData } = await supabase
            .from('tickets')
            .select('user_id')
            .eq('event_id', eventId)
            .in('status', ['confirmed', 'pending']);

          const uniqueUserIds = new Set((ticketsData || []).map((t: any) => t.user_id));
          setAttendeeCount(uniqueUserIds.size);

          // Check if user is registered for this event
          if (user?.id) {
            const registered = await checkEventRegistration(eventId, user.id);
            setIsRegistered(registered);
          }

          // Fetch recent activity (recent messages)
          try {
            const { data: recentMessages, error } = await supabase
              .from('messages')
              .select('*')
              .eq('event_id', eventId)
              .order('created_at', { ascending: false })
              .limit(5);

            if (error) throw error;

            const activity = (recentMessages || []).map((row: any) => ({
              id: row.id,
              type: 'message',
              text: row.text,
              userName: row.user_name,
              timestamp: row.created_at ? new Date(row.created_at) : new Date(),
            }));
            setRecentActivity(activity);
          } catch (activityError) {
            console.log('Could not load recent activity, skipping for now');
            setRecentActivity([]);
          }
        }
      } catch (error) {
        console.error('Error fetching event data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEventAndCheckRegistration();
  }, [eventId, user]);

  useEffect(() => {
    if (isRegistered && eventId) {
      const loadMessages = async () => {
        try {
          const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('event_id', eventId)
            .order('created_at', { ascending: true })
            .limit(100);

          if (error) throw error;

          const messageList: Message[] = (data || []).map((row: any) => ({
            id: row.id,
            text: row.text || '',
            userId: row.user_id || '',
            userName: row.user_name || 'Anonymous',
            userPhotoURL: row.user_photo_url || null,
            timestamp: row.created_at ? new Date(row.created_at) : new Date(),
            eventId: row.event_id || eventId,
          }));
          setMessages(messageList);

          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 100);
        } catch (error) {
          console.error('Error loading messages:', error);
        }
      };

      loadMessages();

      const channel = supabase
        .channel(`messages-${eventId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'messages', filter: `event_id=eq.${eventId}` },
          loadMessages
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isRegistered, eventId]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || !eventId || !isRegistered) {
      if (!isRegistered) {
        Alert.alert('Registration Required', 'You must be registered for this event to send messages.');
      }
      return;
    }

    const messageText = newMessage.trim();
    setNewMessage(''); // Clear input immediately for better UX
    setSending(true);
    
    try {
      const { error } = await supabase.from('messages').insert({
        text: messageText,
        user_id: user.id,
        user_name: user.name || user.email?.split('@')[0] || 'Anonymous',
        user_photo_url: user.photoURL || null,
        event_id: eventId,
      });

      if (error) throw error;
    } catch (error: any) {
      console.error('Error sending message:', error);
      setNewMessage(messageText);
      Alert.alert('Error', error.message || 'Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwnMessage = item.userId === user?.id;
    
    return (
      <View style={[
        styles.messageContainer,
        isOwnMessage ? styles.ownMessage : styles.otherMessage
      ]}>
        {!isOwnMessage && (
          <View style={styles.messageHeader}>
            <Text style={styles.userName}>{item.userName}</Text>
            <Text style={styles.messageTime}>{formatTime(item.timestamp)}</Text>
          </View>
        )}
        <View style={[
          styles.messageBubble,
          isOwnMessage ? styles.ownBubble : styles.otherBubble
        ]}>
          <Text style={[
            styles.messageText,
            isOwnMessage ? styles.ownText : styles.otherText
          ]}>
            {item.text}
          </Text>
        </View>
        {isOwnMessage && (
          <Text style={styles.ownMessageTime}>{formatTime(item.timestamp)}</Text>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading networking...</Text>
        </View>
      </View>
    );
  }

  if (!isRegistered) {
    return (
      <View style={styles.container}>
        {/* Modern Header */}
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <View style={styles.headerContent}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Main' }] })}
            >
              <Ionicons name="chevron-back" size={24} color="#1a1a1a" />
            </TouchableOpacity>
            
            <View style={styles.headerInfo}>
              <Text style={styles.headerTitle}>Networking</Text>
              <Text style={styles.headerSubtitle}>Connect with attendees</Text>
            </View>
            
            <View style={styles.headerAction} />
          </View>
        </View>

        <View style={styles.restrictedContainer}>
          <View style={styles.eventIcon}>
            <Ionicons name="chatbubble-outline" size={32} color="#6366f1" />
          </View>
          <Text style={styles.restrictedTitle}>Registration Required</Text>
          <Text style={styles.restrictedDescription}>
            You need to register for this event to access the networking features and connect with other attendees.
          </Text>
          <TouchableOpacity 
            style={styles.registerButton}
            onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Main' }] })}
          >
            <Text style={styles.registerButtonText}>Go Back to Events</Text>
          </TouchableOpacity>
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
            onPress={() => navigation.navigate('Main')}
          >
            <Ionicons name="chevron-back" size={24} color="#1a1a1a" />
          </TouchableOpacity>
          
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>Networking</Text>
            <Text style={styles.headerSubtitle}>Connect with attendees</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.headerAction}
            onPress={() => {
              Alert.alert('Networking Tips', '• Start conversations with people who share your interests\n• Ask about their experience in the field\n• Exchange contact information for future collaboration');
            }}
          >
            <Ionicons name="help-circle-outline" size={24} color="#6366f1" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Event Info Card */}
        <View style={styles.eventCard}>
          <View style={styles.eventHeader}>
            <View style={styles.eventIcon}>
              <Ionicons name="calendar" size={24} color="#6366f1" />
            </View>
            <View style={styles.eventInfo}>
              <Text style={styles.eventTitle}>{event?.title}</Text>
              <Text style={styles.eventDate}>
                {event?.startAt ? new Date(event.startAt.seconds * 1000).toLocaleDateString() : 'Event Date'}
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{attendeeCount}</Text>
            <Text style={styles.statLabel}>Attendees</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{speakerCount}</Text>
            <Text style={styles.statLabel}>Speakers</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{sessionCount}</Text>
            <Text style={styles.statLabel}>Sessions</Text>
          </View>
        </View>

        {/* Networking Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Start Networking</Text>
          
          {/* Private Chats */}
          <TouchableOpacity 
            style={styles.networkingCard}
            onPress={() => {
              if (eventId) {
                navigation.navigate('AttendeesList', { eventId });
              } else {
                Alert.alert('Error', 'Event data not available');
              }
            }}
          >
            <View style={styles.cardIcon}>
              <Ionicons name="people" size={28} color="#6366f1" />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Private Messages</Text>
              <Text style={styles.cardDescription}>
                Start one-on-one conversations with other attendees
              </Text>
              <View style={styles.cardBadge}>
                <Text style={styles.badgeText}>Available</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>

          {/* Group Chat */}
          <TouchableOpacity 
            style={styles.networkingCard}
            onPress={() => {
              if (eventId) {
                navigation.navigate('GroupChat', { eventId });
              } else {
                Alert.alert('Error', 'Event data not available');
              }
            }}
          >
            <View style={styles.cardIcon}>
              <Ionicons name="chatbubbles" size={28} color="#6366f1" />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Group Discussions</Text>
              <Text style={styles.cardDescription}>
                Join group conversations and share insights
              </Text>
              <View style={styles.cardBadge}>
                <Text style={styles.badgeText}>Available</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>

          {/* Video Calls */}
          <TouchableOpacity 
            style={styles.networkingCard}
            onPress={() => {
              Alert.alert('Coming Soon', 'Video networking sessions will be available soon!');
            }}
          >
            <View style={styles.cardIcon}>
              <Ionicons name="videocam" size={28} color="#6366f1" />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Video Networking</Text>
              <Text style={styles.cardDescription}>
                Connect face-to-face with other attendees
              </Text>
              <View style={[styles.cardBadge, styles.comingSoonBadge]}>
                <Text style={styles.comingSoonText}>Coming Soon</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityCard}>
            {recentActivity.length > 0 ? (
              recentActivity.slice(0, 3).map((activity, index) => (
                <View key={activity.id || index} style={styles.activityItem}>
                  <View style={styles.activityIcon}>
                    <Ionicons name="chatbubble" size={16} color="#10b981" />
                  </View>
                  <Text style={styles.activityText}>
                    {activity.userName}: {activity.text.length > 50 ? 
                      `${activity.text.substring(0, 50)}...` : activity.text}
                  </Text>
                </View>
              ))
            ) : (
              <View style={styles.activityItem}>
                <View style={styles.activityIcon}>
                  <Ionicons name="chatbubble-outline" size={16} color="#9ca3af" />
                </View>
                <Text style={styles.activityText}>No recent activity yet</Text>
              </View>
            )}
            {attendeeCount > 0 && (
              <View style={styles.activityItem}>
                <View style={styles.activityIcon}>
                  <Ionicons name="people" size={16} color="#6366f1" />
                </View>
                <Text style={styles.activityText}>{attendeeCount} attendees registered</Text>
              </View>
            )}
          </View>
        </View>

        {/* Networking Tips */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Networking Tips</Text>
          <View style={styles.tipsCard}>
            <View style={styles.tipItem}>
              <Ionicons name="bulb" size={20} color="#f59e0b" />
              <Text style={styles.tipText}>Share your professional background</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="heart" size={20} color="#ef4444" />
              <Text style={styles.tipText}>Ask about their interests and goals</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="people" size={20} color="#8b5cf6" />
              <Text style={styles.tipText}>Exchange contact information</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
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
            // Stay on chat page
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
    fontSize: 24,
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  eventCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f4ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  eventDate: {
    fontSize: 14,
    color: '#64748b',
  },
  statsContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e2e8f0',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  networkingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f0f4ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 8,
  },
  cardBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#166534',
  },
  comingSoonBadge: {
    backgroundColor: '#fef3c7',
  },
  comingSoonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400e',
  },
  activityCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f9ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityText: {
    fontSize: 14,
    color: '#64748b',
    flex: 1,
  },
  tipsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 12,
    flex: 1,
  },
  restrictedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    backgroundColor: '#f8fafc',
  },
  restrictedTitle: {
    color: '#1e293b',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 16,
    textAlign: 'center',
  },
  restrictedDescription: {
    color: '#64748b',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  registerButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  registerButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
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
  activeNavLabel: {
    color: '#6366f1',
    fontWeight: '600',
  },
  activeNavItem: {
    backgroundColor: '#f0f4ff',
  },
});
