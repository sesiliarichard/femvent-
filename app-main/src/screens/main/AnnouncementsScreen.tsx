import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

interface Announcement {
    id: string;
    title: string;
    body: string;
    createdAt: Date;
    priority: 'normal' | 'urgent';
}

/// No `announcements` table exists yet — this screen shows an empty state until one is built.
const SAMPLE_ANNOUNCEMENTS: Announcement[] = [];
const formatRelativeTime = (date: Date) => {
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
};

export const AnnouncementsScreen: React.FC = () => {
    const navigation = useNavigation();
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // TODO: replace with a real Supabase query once an `announcements` table exists
        setAnnouncements(SAMPLE_ANNOUNCEMENTS);
        setLoading(false);
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
                    <Text style={styles.headerTitle}>Announcements</Text>
                    <View style={{ width: 40 }} />
                </View>
            </LinearGradient>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {announcements.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="megaphone-outline" size={64} color="#cbd5e0" />
                        <Text style={styles.emptyTitle}>No announcements yet</Text>
                    </View>
                ) : (
                    <View style={styles.listContainer}>
                        {announcements.map((a) => (
                            <View key={a.id} style={styles.card}>
                                <View style={styles.cardTop}>
                                    <View style={[styles.iconCircle, a.priority === 'urgent' && styles.iconCircleUrgent]}>
                                        <Ionicons
                                            name={a.priority === 'urgent' ? 'alert-circle' : 'megaphone'}
                                            size={18}
                                            color={a.priority === 'urgent' ? '#ef4444' : '#667eea'}
                                        />
                                    </View>
                                    <Text style={styles.timeText}>{formatRelativeTime(a.createdAt)}</Text>
                                </View>
                                <Text style={styles.announcementTitle}>{a.title}</Text>
                                <Text style={styles.announcementBody}>{a.body}</Text>
                            </View>
                        ))}
                    </View>
                )}
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
    card: {
        backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 12,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
    },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    iconCircle: {
        width: 32, height: 32, borderRadius: 16, backgroundColor: '#e0e7ff',
        justifyContent: 'center', alignItems: 'center',
    },
    iconCircleUrgent: { backgroundColor: '#fee2e2' },
    timeText: { fontSize: 12, color: '#999', fontWeight: '600' },
    announcementTitle: { fontSize: 16, fontWeight: '800', color: '#1a1a1a', marginBottom: 6 },
    announcementBody: { fontSize: 14, color: '#666', lineHeight: 20 },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 80, gap: 12 },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: '#999' },
});