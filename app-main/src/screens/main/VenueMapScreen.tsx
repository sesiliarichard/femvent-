import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

interface VenueArea {
    id: string;
    name: string;
    floor: string;
    icon: keyof typeof Ionicons.glyphMap;
}

// TODO: replace with Supabase query once venue layout data exists
const VENUE_AREAS: VenueArea[] = [
    { id: '1', name: 'Main Auditorium', floor: 'Ground Floor', icon: 'mic-outline' },
    { id: '2', name: 'Workshop Room A', floor: 'Ground Floor', icon: 'easel-outline' },
    { id: '3', name: 'Workshop Room B', floor: '1st Floor', icon: 'easel-outline' },
    { id: '4', name: 'Exhibitor Hall', floor: 'Ground Floor', icon: 'storefront-outline' },
    { id: '5', name: 'Networking Lounge', floor: '1st Floor', icon: 'cafe-outline' },
    { id: '6', name: 'Registration Desk', floor: 'Ground Floor', icon: 'clipboard-outline' },
];

const VENUE_ADDRESS = 'Arusha, Tanzania';
const VENUE_NAME = 'Gendering AI Conference 2026';

export const VenueMapScreen: React.FC = () => {
    const navigation = useNavigation();

    const openDirections = () => {
        const query = encodeURIComponent(VENUE_ADDRESS);
        Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <LinearGradient colors={['#667eea', '#764ba2']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Venue Map</Text>
                    <View style={{ width: 40 }} />
                </View>
            </LinearGradient>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                <View style={styles.addressCard}>
                    <Ionicons name="location" size={22} color="#667eea" />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={styles.venueName}>{VENUE_NAME}</Text>
                        <Text style={styles.venueAddress}>{VENUE_ADDRESS}</Text>
                    </View>
                    <TouchableOpacity onPress={openDirections} style={styles.directionsButton}>
                        <Ionicons name="navigate" size={16} color="#fff" />
                        <Text style={styles.directionsText}>Directions</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.mapPlaceholder}>
                    <Ionicons name="map-outline" size={40} color="#cbd5e0" />
                    <Text style={styles.mapPlaceholderText}>Interactive map coming soon</Text>
                </View>

                <View style={styles.listContainer}>
                    <Text style={styles.sectionTitle}>Areas & Rooms</Text>
                    {VENUE_AREAS.map((area) => (
                        <View key={area.id} style={styles.areaCard}>
                            <View style={styles.areaIcon}>
                                <Ionicons name={area.icon} size={20} color="#667eea" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.areaName}>{area.name}</Text>
                                <Text style={styles.areaFloor}>{area.floor}</Text>
                            </View>
                        </View>
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    header: {
        paddingHorizontal: 20, paddingTop: 20, paddingBottom: 24,
        borderBottomLeftRadius: 32, borderBottomRightRadius: 32,
        shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 10,
    },
    headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 24, fontWeight: '800', color: '#fff' },
    scrollView: { flex: 1 },
    addressCard: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 20,
        padding: 16, margin: 20, marginBottom: 12,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
    },
    venueName: { fontSize: 15, fontWeight: '800', color: '#1a1a1a' },
    venueAddress: { fontSize: 13, color: '#666', marginTop: 2 },
    directionsButton: {
        flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#667eea',
        paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12,
    },
    directionsText: { fontSize: 12, fontWeight: '700', color: '#fff' },
    mapPlaceholder: {
        height: 160, backgroundColor: '#f0f0f0', borderRadius: 20, marginHorizontal: 20, marginBottom: 20,
        justifyContent: 'center', alignItems: 'center', gap: 8,
    },
    mapPlaceholderText: { fontSize: 13, fontWeight: '600', color: '#999' },
    listContainer: { paddingHorizontal: 20, paddingBottom: 20 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: '#666', marginBottom: 16 },
    areaCard: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16,
        padding: 14, marginBottom: 10,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
    },
    areaIcon: {
        width: 40, height: 40, borderRadius: 12, backgroundColor: '#e0e7ff',
        justifyContent: 'center', alignItems: 'center', marginRight: 12,
    },
    areaName: { fontSize: 15, fontWeight: '700', color: '#1a1a1a' },
    areaFloor: { fontSize: 12, color: '#999', marginTop: 2 },
});