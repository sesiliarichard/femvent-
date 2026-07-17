import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

interface Exhibitor {
    id: string;
    name: string;
    booth: string;
    category: string;
    description: string;
    website?: string;
}

// TODO: replace with Supabase query once an `exhibitors` table exists
const SAMPLE_EXHIBITORS: Exhibitor[] = [
    { id: '1', name: 'TechCorp Africa', booth: 'A1', category: 'Technology', description: 'AI and cloud solutions for African startups.', website: 'https://example.com' },
    { id: '2', name: 'Women in AI Fund', booth: 'A2', category: 'Investment', description: 'Grants and funding for women-led AI ventures.' },
    { id: '3', name: 'CloudBridge', booth: 'B1', category: 'Infrastructure', description: 'Cloud hosting partner for the conference.' },
    { id: '4', name: 'DataSpark Labs', booth: 'B2', category: 'Data & Analytics', description: 'Data science training and consulting.' },
];

export const ExhibitorsScreen: React.FC = () => {
    const navigation = useNavigation();
    const [exhibitors, setExhibitors] = useState<Exhibitor[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setExhibitors(SAMPLE_EXHIBITORS);
            setLoading(false);
        }, 300);
        return () => clearTimeout(timer);
    }, []);

    if (loading) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#667eea" />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <LinearGradient colors={['#667eea', '#764ba2']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Exhibitors</Text>
                    <View style={{ width: 40 }} />
                </View>
            </LinearGradient>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                <View style={styles.listContainer}>
                    <Text style={styles.sectionTitle}>
                        {exhibitors.length} {exhibitors.length === 1 ? 'Exhibitor' : 'Exhibitors'}
                    </Text>
                    {exhibitors.map((ex) => (
                        <View key={ex.id} style={styles.card}>
                            <View style={styles.boothBadge}>
                                <Text style={styles.boothText}>{ex.booth}</Text>
                            </View>
                            <View style={styles.cardBody}>
                                <Text style={styles.exhibitorName}>{ex.name}</Text>
                                <Text style={styles.exhibitorCategory}>{ex.category}</Text>
                                <Text style={styles.exhibitorDescription}>{ex.description}</Text>
                                {ex.website && (
                                    <TouchableOpacity onPress={() => Linking.openURL(ex.website!)} style={styles.websiteRow}>
                                        <Ionicons name="link-outline" size={14} color="#667eea" />
                                        <Text style={styles.websiteText}>Visit website</Text>
                                    </TouchableOpacity>
                                )}
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
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        paddingHorizontal: 20, paddingTop: 20, paddingBottom: 24,
        borderBottomLeftRadius: 32, borderBottomRightRadius: 32,
        shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 10,
    },
    headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 24, fontWeight: '800', color: '#fff' },
    scrollView: { flex: 1 },
    listContainer: { padding: 20 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: '#666', marginBottom: 16 },
    card: {
        flexDirection: 'row', backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 12,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
    },
    boothBadge: {
        width: 44, height: 44, borderRadius: 12, backgroundColor: '#e0e7ff',
        justifyContent: 'center', alignItems: 'center', marginRight: 14,
    },
    boothText: { fontSize: 13, fontWeight: '800', color: '#667eea' },
    cardBody: { flex: 1 },
    exhibitorName: { fontSize: 16, fontWeight: '800', color: '#1a1a1a', marginBottom: 2 },
    exhibitorCategory: { fontSize: 12, fontWeight: '600', color: '#764ba2', marginBottom: 6 },
    exhibitorDescription: { fontSize: 13, color: '#666', lineHeight: 18 },
    websiteRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
    websiteText: { fontSize: 13, fontWeight: '600', color: '#667eea' },
});