import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface VenueLocationCardProps {
  venue?: {
    name?: string;
    city?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      country?: string;
    };
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  location?: string;
  eventTitle?: string;
}

export const VenueLocationCard: React.FC<VenueLocationCardProps> = ({
  venue,
  location,
  eventTitle = 'Event',
}) => {
  // Build full address string
  const buildAddressString = (): string => {
    if (venue?.address) {
      const parts = [
        venue.address.street,
        venue.address.city,
        venue.address.state,
        venue.address.zipCode,
        venue.address.country,
      ].filter(Boolean);
      return parts.join(', ');
    }
    if (venue?.name) {
      return venue.city ? `${venue.name}, ${venue.city}` : venue.name;
    }
    return location || 'Location TBD';
  };

  const addressString = buildAddressString();
  const displayName = venue?.name || location || 'Location TBD';
  const hasCoordinates = venue?.coordinates?.latitude && venue?.coordinates?.longitude;
  const hasAddress = venue?.address && Object.values(venue.address).some(v => v);

  // Open in Google Maps
  const openInGoogleMaps = async () => {
    try {
      let url = '';
      
      if (hasCoordinates) {
        // Use coordinates if available (most accurate)
        url = `https://www.google.com/maps/search/?api=1&query=${venue.coordinates!.latitude},${venue.coordinates!.longitude}`;
      } else if (hasAddress || addressString !== 'Location TBD') {
        // Use address string
        url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressString)}`;
      } else {
        Alert.alert('No Location', 'Address details are not available for this venue.');
        return;
      }

      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Unable to open Google Maps. Please install Google Maps app.');
      }
    } catch (error) {
      console.error('Error opening Google Maps:', error);
      Alert.alert('Error', 'Failed to open maps. Please try again.');
    }
  };

  // Open in Apple Maps (iOS) or Google Maps (Android)
  const openInNativeMaps = async () => {
    try {
      let url = '';
      
      if (hasCoordinates) {
        if (Platform.OS === 'ios') {
          url = `http://maps.apple.com/?ll=${venue.coordinates!.latitude},${venue.coordinates!.longitude}&q=${encodeURIComponent(displayName)}`;
        } else {
          url = `geo:${venue.coordinates!.latitude},${venue.coordinates!.longitude}?q=${encodeURIComponent(addressString)}`;
        }
      } else if (hasAddress || addressString !== 'Location TBD') {
        if (Platform.OS === 'ios') {
          url = `http://maps.apple.com/?q=${encodeURIComponent(addressString)}`;
        } else {
          url = `geo:0,0?q=${encodeURIComponent(addressString)}`;
        }
      } else {
        Alert.alert('No Location', 'Address details are not available for this venue.');
        return;
      }

      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        // Fallback to Google Maps web
        openInGoogleMaps();
      }
    } catch (error) {
      console.error('Error opening native maps:', error);
      // Fallback to Google Maps
      openInGoogleMaps();
    }
  };

  // Get directions
  const getDirections = async () => {
    try {
      let url = '';
      
      if (hasCoordinates) {
        if (Platform.OS === 'ios') {
          url = `http://maps.apple.com/?daddr=${venue.coordinates!.latitude},${venue.coordinates!.longitude}&dirflg=d`;
        } else {
          url = `google.navigation:q=${venue.coordinates!.latitude},${venue.coordinates!.longitude}`;
        }
      } else if (hasAddress || addressString !== 'Location TBD') {
        if (Platform.OS === 'ios') {
          url = `http://maps.apple.com/?daddr=${encodeURIComponent(addressString)}&dirflg=d`;
        } else {
          url = `google.navigation:q=${encodeURIComponent(addressString)}`;
        }
      } else {
        Alert.alert('No Location', 'Address details are not available for this venue.');
        return;
      }

      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        // Fallback to Google Maps with directions
        const fallbackUrl = hasCoordinates
          ? `https://www.google.com/maps/dir/?api=1&destination=${venue.coordinates!.latitude},${venue.coordinates!.longitude}`
          : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(addressString)}`;
        await Linking.openURL(fallbackUrl);
      }
    } catch (error) {
      console.error('Error getting directions:', error);
      Alert.alert('Error', 'Failed to open directions. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="location" size={24} color="#6366f1" />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.label}>VENUE</Text>
          <Text style={styles.venueName}>{displayName}</Text>
        </View>
      </View>

      {addressString !== 'Location TBD' && (
        <View style={styles.addressContainer}>
          <Ionicons name="map-outline" size={16} color="#64748b" />
          <Text style={styles.addressText}>{addressString}</Text>
        </View>
      )}

      {(hasAddress || hasCoordinates) && (
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={openInNativeMaps}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={['#6366f1', '#8b5cf6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.actionGradient}
            >
              <Ionicons name="map" size={20} color="#ffffff" />
              <Text style={styles.actionText}>View Map</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={getDirections}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={['#10b981', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.actionGradient}
            >
              <Ionicons name="navigate" size={20} color="#ffffff" />
              <Text style={styles.actionText}>Directions</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {!hasAddress && !hasCoordinates && addressString === 'Location TBD' && (
        <View style={styles.noLocationContainer}>
          <Ionicons name="information-circle-outline" size={20} color="#f59e0b" />
          <Text style={styles.noLocationText}>
            Address details not available. Contact organizer for location information.
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  venueName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  addressText: {
    fontSize: 14,
    color: '#475569',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  actionText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  noLocationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fef3c7',
  },
  noLocationText: {
    fontSize: 13,
    color: '#92400e',
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
});

