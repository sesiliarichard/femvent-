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
  Alert,
} from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../services/supabase';

const { width } = Dimensions.get('window');

interface Sponsor {
  id: string;
  name: string;
  description?: string;
  logoURL?: string;
  website?: string;
  tier: 'Platinum' | 'Gold' | 'Silver' | 'Bronze' | 'Partner';
  contact?: string;
}

interface SponsorScreenProps {
  navigation: any;
  route?: {
    params?: {
      eventId?: string;
    };
  };
}

export default function SponsorScreen({ navigation, route }: SponsorScreenProps) {
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
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<any>(null);
  const insets = useSafeAreaInsets();

  // Sample sponsor data - in real app, this would come from Firebase
  const sampleSponsors: Sponsor[] = [
    {
      id: '1',
      name: 'TechCorp Solutions',
      description: 'Leading provider of AI and machine learning solutions for enterprise businesses.',
      tier: 'Platinum',
      website: 'https://techcorp.com',
      contact: 'partnerships@techcorp.com',
    },
    {
      id: '2',
      name: 'InnovateAI',
      description: 'Cutting-edge AI research company focused on ethical artificial intelligence.',
      tier: 'Gold',
      website: 'https://innovateai.com',
      contact: 'hello@innovateai.com',
    },
    {
      id: '3',
      name: 'DataFlow Systems',
      description: 'Advanced data analytics and business intelligence platform.',
      tier: 'Gold',
      website: 'https://dataflow.com',
      contact: 'info@dataflow.com',
    },
    {
      id: '4',
      name: 'CloudTech Partners',
      description: 'Cloud infrastructure and DevOps solutions for modern applications.',
      tier: 'Silver',
      website: 'https://cloudtech.com',
      contact: 'contact@cloudtech.com',
    },
    {
      id: '5',
      name: 'StartupHub',
      description: 'Incubator and accelerator for technology startups.',
      tier: 'Silver',
      website: 'https://startuphub.com',
      contact: 'programs@startuphub.com',
    },
    {
      id: '6',
      name: 'DevTools Inc',
      description: 'Developer tools and productivity software for modern teams.',
      tier: 'Bronze',
      website: 'https://devtools.com',
      contact: 'support@devtools.com',
    },
    {
      id: '7',
      name: 'Media Partners',
      description: 'Technology media and content creation services.',
      tier: 'Partner',
      website: 'https://mediapartners.com',
      contact: 'editorial@mediapartners.com',
    },
  ];

// Real-time event data listener for live partner updates
useEffect(() => {
  if (!eventId) {
    setSponsors(sampleSponsors);
    setLoading(false);
    return;
  }

  const applyEventRow = (row: any) => {
    try {
      setEvent(row);

      if (row.partners && Array.isArray(row.partners) && row.partners.length > 0) {
        const mappedPartners: Sponsor[] = row.partners.map((partner: any, index: number) => ({
          id: partner.id || `partner-${index}`,
          name: partner.name || 'Partner',
          description: partner.description || partner.bio || '',
          logoURL: partner.logoURL || partner.logo || undefined,
          website: partner.website || partner.url || undefined,
          tier: partner.tier || 'Partner' as 'Partner',
          contact: partner.contact || partner.email || undefined,
        }));
        setSponsors(mappedPartners);
      } else {
        setSponsors(sampleSponsors);
      }
      setLoading(false);
    } catch (dataError) {
      console.error('Error processing event data:', dataError);
      setSponsors(sampleSponsors);
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
        setSponsors(sampleSponsors);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error loading event:', error);
      setSponsors(sampleSponsors);
      setLoading(false);
    }
  };

  fetchEvent();

  const channel = supabase
  .channel(`sponsor-event-${eventId}-${Date.now()}-${Math.random()}`)
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
}, [eventId]);

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Platinum': return '#e5e7eb'; // Light gray
      case 'Gold': return '#fbbf24'; // Gold
      case 'Silver': return '#9ca3af'; // Silver
      case 'Bronze': return '#d97706'; // Bronze
      case 'Partner': return '#8b5cf6'; // Purple
      default: return '#6b7280';
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'Platinum': return 'diamond';
      case 'Gold': return 'star';
      case 'Silver': return 'star-half';
      case 'Bronze': return 'star-outline';
      case 'Partner': return 'handshake';
      default: return 'business';
    }
  };

  const handleWebsitePress = (sponsor: Sponsor) => {
    if (sponsor.website) {
      Alert.alert(
        'Visit Website',
        `Would open ${sponsor.website} in browser`,
        [{ text: 'OK' }]
      );
    }
  };

  const handleContactPress = (sponsor: Sponsor) => {
    if (sponsor.contact) {
      Alert.alert(
        'Contact Sponsor',
        `Would open email to ${sponsor.contact}`,
        [{ text: 'OK' }]
      );
    }
  };

  const groupSponsorsByTier = () => {
    const grouped: { [key: string]: Sponsor[] } = {};
    sponsors.forEach(sponsor => {
      if (!grouped[sponsor.tier]) {
        grouped[sponsor.tier] = [];
      }
      grouped[sponsor.tier].push(sponsor);
    });
    return grouped;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading sponsors...</Text>
        </View>
      </View>
    );
  }

  const groupedSponsors = groupSponsorsByTier();
  const tierOrder = ['Platinum', 'Gold', 'Silver', 'Bronze', 'Partner'];

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
            <Text style={styles.headerTitle}>Partners & Sponsors</Text>
            <Text style={styles.headerSubtitle}>{event?.title}</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.headerAction}
            onPress={() => {
              Alert.alert('Sponsors Info', 'Our valued partners and sponsors');
            }}
          >
            <Ionicons name="information-circle-outline" size={24} color="#6366f1" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Our Amazing Sponsors</Text>
          <Text style={styles.headerSubtitle}>
            Thank you to our sponsors who make this event possible
          </Text>
        </View>

        {/* Sponsors by Tier */}
        {tierOrder.map(tier => {
          const tierSponsors = groupedSponsors[tier];
          if (!tierSponsors || tierSponsors.length === 0) return null;

          return (
            <View key={tier} style={styles.tierContainer}>
              <View style={styles.tierHeader}>
                <MaterialIcons 
                  name={getTierIcon(tier)} 
                  size={24} 
                  color={getTierColor(tier)} 
                />
                <Text style={[styles.tierTitle, { color: getTierColor(tier) }]}>
                  {tier} Sponsors
                </Text>
              </View>
              
              <View style={styles.sponsorsGrid}>
                {tierSponsors.map((sponsor) => (
                  <View key={sponsor.id} style={styles.sponsorCard}>
                    {/* Sponsor Logo/Icon */}
                    <View style={styles.sponsorLogoContainer}>
                      {sponsor.logoURL ? (
                        <Image 
                          source={{ uri: sponsor.logoURL }} 
                          style={styles.sponsorLogo}
                          resizeMode="contain"
                          onError={() => {
                            // If image fails to load, it will fall back to placeholder
                            console.log('Failed to load logo for:', sponsor.name);
                          }}
                        />
                      ) : (
                        <View style={[styles.sponsorPlaceholder, { borderColor: getTierColor(tier) }]}>
                          <Text style={[styles.sponsorInitials, { color: getTierColor(tier) }]}>
                            {sponsor.name ? sponsor.name.split(' ').map(n => n[0]).join('').slice(0, 2) : '??'}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Sponsor Info */}
                    <Text style={styles.sponsorName}>{sponsor.name}</Text>
                    {sponsor.description && (
                      <Text style={styles.sponsorDescription} numberOfLines={3}>
                        {sponsor.description}
                      </Text>
                    )}

                    {/* Action Buttons */}
                    <View style={styles.sponsorActions}>
                      {sponsor.website && (
                        <TouchableOpacity 
                          style={styles.actionButton}
                          onPress={() => handleWebsitePress(sponsor)}
                        >
                          <Ionicons name="globe" size={16} color="#4a90e2" />
                          <Text style={styles.actionButtonText}>Website</Text>
                        </TouchableOpacity>
                      )}
                      {sponsor.contact && (
                        <TouchableOpacity 
                          style={styles.actionButton}
                          onPress={() => handleContactPress(sponsor)}
                        >
                          <Ionicons name="mail" size={16} color="#10b981" />
                          <Text style={styles.actionButtonText}>Contact</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            </View>
          );
        })}

        {/* Become a Sponsor Section */}
        <View style={styles.becomeSponsorContainer}>
          <View style={styles.becomeSponsorCard}>
            <MaterialIcons name="business" size={48} color="#8b5cf6" />
            <Text style={styles.becomeSponsorTitle}>Become a Sponsor</Text>
            <Text style={styles.becomeSponsorDescription}>
              Interested in sponsoring our event? Get in touch with us to learn about sponsorship opportunities.
            </Text>
            <TouchableOpacity style={styles.contactUsButton}>
              <Text style={styles.contactUsButtonText}>Contact Us</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

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
          style={[styles.bottomNavItem, styles.activeNavItem]}
          onPress={() => {
            // Stay on sponsors page
          }}
        >
          <Ionicons name="business" size={24} color="#6366f1" />
          <Text style={[styles.bottomNavLabel, styles.activeNavLabel]}>Partners</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.bottomNavItem}
          onPress={() => {
            if (eventId) {
              navigation.navigate('Chat', { eventId });
            } else {
              Alert.alert('Error', 'Event data not available');
            }
          }}
        >
          <Ionicons name="chatbubble" size={24} color="#9ca3af" />
          <Text style={styles.bottomNavLabel}>Chat</Text>
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  navTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 32,
    paddingTop: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.8,
    textAlign: 'center',
    lineHeight: 24,
  },
  tierContainer: {
    marginBottom: 32,
  },
  tierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  tierTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  sponsorsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  sponsorCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    width: (width - 60) / 2,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sponsorLogoContainer: {
    marginBottom: 12,
  },
  sponsorLogo: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#ffffff',
  },
  sponsorPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  sponsorInitials: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  sponsorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 8,
  },
  sponsorDescription: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 12,
  },
  sponsorActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f0f4ff',
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
    justifyContent: 'center',
  },
  actionButtonText: {
    color: '#6366f1',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  becomeSponsorContainer: {
    marginBottom: 100,
  },
  becomeSponsorCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  becomeSponsorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 16,
    marginBottom: 12,
  },
  becomeSponsorDescription: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  contactUsButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  contactUsButtonText: {
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
  activeNavItem: {
    backgroundColor: '#f0f4ff',
  },
  activeNavLabel: {
    color: '#6366f1',
  },
});
