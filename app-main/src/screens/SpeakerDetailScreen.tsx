import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  Alert,
  Animated,
} from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
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
  email?: string;
  linkedin?: string;
  twitter?: string;
}

interface SpeakerDetailScreenProps {
  navigation: any;
  route: {
    params: {
      speakerId?: string;
      speaker?: Speaker;
      eventId: string;
    };
  };
}

export default function SpeakerDetailScreen({ navigation, route }: SpeakerDetailScreenProps) {
  const { speakerId, speaker, eventId } = route.params;
  const [speakerData, setSpeakerData] = useState<Speaker | null>(speaker || null);
  const [loading, setLoading] = useState(!speaker);
  const [event, setEvent] = useState<any>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const insets = useSafeAreaInsets();
  const scrollY = new Animated.Value(0);

  useEffect(() => {
    if (speaker || !eventId) {
      setLoading(false);
      return;
    }

    const applyEventRow = (row: any) => {
      try {
        setEvent(row);

        if (speakerId && row.speakers && Array.isArray(row.speakers)) {
          const foundSpeaker = row.speakers.find((s: any, index: number) =>
            s.id === speakerId || index.toString() === speakerId
          );
          if (foundSpeaker) {
            setSpeakerData({
              id: speakerId,
              name: foundSpeaker.name || '',
              title: foundSpeaker.title || '',
              company: foundSpeaker.company || '',
              bio: foundSpeaker.bio || '',
              photoURL: foundSpeaker.photoURL,
            });
          }
        }
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
        Alert.alert('Error', 'Failed to load speaker information. Please check your connection.');
        setLoading(false);
      }
    };

    fetchEvent();

    const channel = supabase
      .channel(`speaker-detail-event-${eventId}`)
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
  }, [speakerId, speaker, eventId]);

  const handleLinkedInPress = () => {
    if (speakerData?.linkedin) {
      Alert.alert('LinkedIn', `Would open LinkedIn profile for ${speakerData.name}`);
    }
  };

  const handleTwitterPress = () => {
    if (speakerData?.twitter) {
      Alert.alert('Twitter', `Would open Twitter profile for ${speakerData.name}`);
    }
  };

  const handleEmailPress = () => {
    if (speakerData?.email) {
      Alert.alert('Email', `Would open email to ${speakerData.email}`);
    }
  };

  const toggleFollow = () => {
    setIsFollowing(!isFollowing);
    Alert.alert(
      isFollowing ? 'Unfollowed' : 'Following',
      isFollowing 
        ? `You unfollowed ${speakerData?.name}` 
        : `You're now following ${speakerData?.name}`
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading speaker...</Text>
        </View>
      </View>
    );
  }

  if (!speakerData) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Ionicons name="person-outline" size={64} color="#cbd5e1" />
        <Text style={styles.errorText}>Speaker not found</Text>
        <TouchableOpacity 
          style={styles.errorButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.errorButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 150],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const imageScale = scrollY.interpolate({
    inputRange: [-100, 0],
    outputRange: [1.3, 1],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      {/* Animated Header */}
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
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={22} color="#1e293b" />
          </TouchableOpacity>
          
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle} numberOfLines={1}>{speakerData.name}</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => Alert.alert('Share', `Share ${speakerData.name}'s profile`)}
          >
            <Ionicons name="share-outline" size={22} color="#64748b" />
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
        {/* Hero Section with Profile */}
        <View style={styles.heroSection}>
          <LinearGradient
            colors={['#6366f1', '#8b5cf6', '#ec4899']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGradient}
          >
            <Animated.View style={[styles.photoContainer, { transform: [{ scale: imageScale }] }]}>
              {speakerData.photoURL ? (
                <Image 
                  source={{ uri: speakerData.photoURL }} 
                  style={styles.speakerPhoto}
                  onError={() => {
                    console.log('Failed to load speaker photo for:', speakerData.name);
                  }}
                />
              ) : (
                <View style={styles.placeholderPhoto}>
                  <Text style={styles.placeholderText}>
                    {speakerData.name ? speakerData.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '??'}
                  </Text>
                </View>
              )}
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={24} color="#10b981" />
              </View>
            </Animated.View>
          </LinearGradient>
        </View>

        <View style={styles.content}>
          {/* Speaker Info Card */}
          <View style={styles.infoCard}>
            <Text style={styles.speakerName}>{speakerData.name}</Text>
            <Text style={styles.speakerTitle}>{speakerData.title}</Text>
            {speakerData.company && (
              <View style={styles.companyRow}>
                <Ionicons name="business-outline" size={16} color="#6366f1" />
                <Text style={styles.speakerCompany}>{speakerData.company}</Text>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={[styles.primaryButton, isFollowing && styles.followingButton]}
                onPress={toggleFollow}
              >
                <Ionicons 
                  name={isFollowing ? "checkmark" : "add"} 
                  size={20} 
                  color={isFollowing ? "#10b981" : "#ffffff"} 
                />
                <Text style={[styles.primaryButtonText, isFollowing && styles.followingButtonText]}>
                  {isFollowing ? 'Following' : 'Follow'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.secondaryButton}
                onPress={handleEmailPress}
              >
                <Ionicons name="mail-outline" size={20} color="#6366f1" />
                <Text style={styles.secondaryButtonText}>Message</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Social Links */}
          {(speakerData.linkedin || speakerData.twitter || speakerData.email) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Connect</Text>
              <View style={styles.socialGrid}>
                {speakerData.linkedin && (
                  <TouchableOpacity 
                    style={styles.socialCard}
                    onPress={handleLinkedInPress}
                  >
                    <View style={[styles.socialIcon, { backgroundColor: '#eff6ff' }]}>
                      <Ionicons name="logo-linkedin" size={24} color="#0077b5" />
                    </View>
                    <Text style={styles.socialLabel}>LinkedIn</Text>
                  </TouchableOpacity>
                )}
                {speakerData.twitter && (
                  <TouchableOpacity 
                    style={styles.socialCard}
                    onPress={handleTwitterPress}
                  >
                    <View style={[styles.socialIcon, { backgroundColor: '#eff6ff' }]}>
                      <Ionicons name="logo-twitter" size={24} color="#1da1f2" />
                    </View>
                    <Text style={styles.socialLabel}>Twitter</Text>
                  </TouchableOpacity>
                )}
                {speakerData.email && (
                  <TouchableOpacity 
                    style={styles.socialCard}
                    onPress={handleEmailPress}
                  >
                    <View style={[styles.socialIcon, { backgroundColor: '#fef3c7' }]}>
                      <Ionicons name="mail" size={24} color="#f59e0b" />
                    </View>
                    <Text style={styles.socialLabel}>Email</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* Bio Section */}
          {speakerData.bio && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="information-circle-outline" size={24} color="#6366f1" />
                <Text style={styles.sectionTitle}>About</Text>
              </View>
              <View style={styles.bioCard}>
                <Text style={styles.bioText}>{speakerData.bio}</Text>
              </View>
            </View>
          )}

          {/* Sessions Section */}
          {event?.agenda && Array.isArray(event.agenda) && 
           event.agenda.filter((session: any) => session?.speaker === speakerData.name).length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="calendar-outline" size={24} color="#6366f1" />
                <Text style={styles.sectionTitle}>Sessions</Text>
              </View>
              {event.agenda
                .filter((session: any) => session?.speaker === speakerData.name)
                .map((session: any, index: number) => (
                  <View key={index} style={styles.sessionCard}>
                    <View style={styles.sessionBadge}>
                      <Text style={styles.sessionBadgeText}>SESSION {index + 1}</Text>
                    </View>
                    <Text style={styles.sessionTitle}>{session.title}</Text>
                    
                    <View style={styles.sessionMeta}>
                      <View style={styles.sessionMetaItem}>
                        <Ionicons name="time-outline" size={16} color="#6366f1" />
                        <Text style={styles.sessionMetaText}>
                          {session.time ? session.time.toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                          }) : 'TBA'}
                        </Text>
                      </View>
                      {session.duration && (
                        <View style={styles.sessionMetaItem}>
                          <Ionicons name="hourglass-outline" size={16} color="#10b981" />
                          <Text style={styles.sessionMetaText}>{session.duration}</Text>
                        </View>
                      )}
                    </View>

                    {session.description && (
                      <Text style={styles.sessionDescription}>{session.description}</Text>
                    )}
                  </View>
                ))}
            </View>
          )}

          {/* Other Speakers */}
          {event?.speakers && Array.isArray(event.speakers) && event.speakers.length > 1 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="people-outline" size={24} color="#6366f1" />
                <Text style={styles.sectionTitle}>Other Speakers</Text>
              </View>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.speakersScroll}
              >
                {event.speakers
                  .filter((s: any) => s?.name !== speakerData.name)
                  .map((otherSpeaker: any, index: number) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.speakerCard}
                      onPress={() => navigation.replace('SpeakerDetail', {
                        speaker: {
                          id: index.toString(),
                          name: otherSpeaker.name || '',
                          title: otherSpeaker.title || '',
                          company: otherSpeaker.company || '',
                          bio: otherSpeaker.bio || '',
                          photoURL: otherSpeaker.photoURL,
                        },
                        eventId
                      })}
                    >
                      <View style={styles.speakerPhotoContainer}>
                        {otherSpeaker.photoURL ? (
                          <Image 
                            source={{ uri: otherSpeaker.photoURL }} 
                            style={styles.speakerCardPhoto}
                            onError={() => {
                              console.log('Failed to load speaker photo for:', otherSpeaker.name);
                            }}
                          />
                        ) : (
                          <View style={styles.speakerCardPlaceholder}>
                            <Text style={styles.speakerCardInitials}>
                              {otherSpeaker.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || '??'}
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.speakerCardName} numberOfLines={2}>{otherSpeaker.name}</Text>
                      <Text style={styles.speakerCardTitle} numberOfLines={1}>{otherSpeaker.title}</Text>
                    </TouchableOpacity>
                  ))}
              </ScrollView>
            </View>
          )}

          <View style={styles.bottomSpacer} />
        </View>
      </ScrollView>
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
  errorText: {
    color: '#475569',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 24,
  },
  errorButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  errorButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
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
  heroSection: {
    marginBottom: -60,
  },
  heroGradient: {
    paddingTop: 100,
    paddingBottom: 100,
    alignItems: 'center',
  },
  photoContainer: {
    position: 'relative',
  },
  speakerPhoto: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 5,
    borderColor: '#ffffff',
  },
  placeholderPhoto: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 5,
    borderColor: '#ffffff',
  },
  placeholderText: {
    fontSize: 42,
    fontWeight: '800',
    color: '#6366f1',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: '#ffffff',
    borderRadius: 12,
  },
  content: {
    paddingHorizontal: 16,
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    alignItems: 'center',
  },
  speakerName: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
  },
  speakerTitle: {
    fontSize: 16,
    color: '#6366f1',
    marginBottom: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
  companyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  speakerCompany: {
    fontSize: 15,
    color: '#64748b',
    marginLeft: 6,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    width: '100%',
    marginTop: 8,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#6366f1',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  followingButton: {
    backgroundColor: '#f0fdf4',
    borderWidth: 2,
    borderColor: '#10b981',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 8,
  },
  followingButtonText: {
    color: '#10b981',
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#f0f4ff',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    borderWidth: 2,
    borderColor: '#6366f1',
  },
  secondaryButtonText: {
    color: '#6366f1',
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 8,
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1e293b',
    marginLeft: 8,
  },
  socialGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  socialCard: {
    width: '33.33%',
    padding: 6,
  },
  socialIcon: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  socialLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'center',
  },
  bioCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  bioText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#475569',
    fontWeight: '400',
  },
  sessionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#6366f1',
  },
  sessionBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#f0f4ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 12,
  },
  sessionBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6366f1',
    letterSpacing: 0.5,
  },
  sessionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 12,
    lineHeight: 24,
  },
  sessionMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  sessionMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 8,
  },
  sessionMetaText: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 6,
    fontWeight: '500',
  },
  sessionDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 21,
    fontWeight: '400',
  },
  speakersScroll: {
    paddingRight: 16,
  },
  speakerCard: {
    width: 130,
    marginRight: 12,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  speakerPhotoContainer: {
    marginBottom: 12,
    alignItems: 'center',
  },
  speakerCardPhoto: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  speakerCardPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f4ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  speakerCardInitials: {
    fontSize: 24,
    fontWeight: '700',
    color: '#6366f1',
  },
  speakerCardName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 4,
    lineHeight: 18,
  },
  speakerCardTitle: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    fontWeight: '500',
  },
  bottomSpacer: {
    height: 60,
  },
});