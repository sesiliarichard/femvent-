import React, { useState, useCallback, useEffect } from 'react';
import {
    View,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../services/AuthContext';
import {
    AppNotification,
    fetchNotifications,
    markAllRead,
    markRead,
    subscribeToNotifications,
} from '../../services/inbox';

const ICONS: Record<string, string> = {
    agenda: 'calendar',
    speakers: 'people',
    details: 'information-circle',
    announcement: 'megaphone',
};

const timeAgo = (iso: string) => {
    const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
};

export const NotificationsScreen: React.FC = () => {
    const navigation = useNavigation();
    const { user } = useAuth();
    const [items, setItems] = useState<AppNotification[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const load = useCallback(async () => {
        if (!user?.id) {
            setLoading(false);
            return;
        }
        setItems(await fetchNotifications(user.id));
        setLoading(false);
        setRefreshing(false);
    }, [user?.id]);

    useEffect(() => {
        load();
        if (!user?.id) return;
        return subscribeToNotifications(user.id, load);
    }, [user?.id, load]);

    const handlePress = async (item: AppNotification) => {
        if (!item.read) {
            setItems(prev => prev.map(n => (n.id === item.id ? { ...n, read: true } : n)));
            markRead(item.id);
        }
        if (item.event_id) {
            (navigation as any).navigate('EventDetail', { eventId: item.event_id });
        }
    };

    const handleMarkAll = async () => {
        if (!user?.id) return;
        setItems(prev => prev.map(n => ({ ...n, read: true })));
        await markAllRead(user.id);
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <LinearGradient
                colors={['#5A4485', '#3d2d5c']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Notifications</Text>
                    <TouchableOpacity onPress={handleMarkAll} style={styles.markAllButton}>
                        <Text style={styles.markAllText}>Read all</Text>
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#5A4485" />
                </View>
            ) : (
                <FlatList
                    data={items}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => {
                                setRefreshing(true);
                                load();
                            }}
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.center}>
                            <Ionicons name="notifications-off-outline" size={64} color="#cbd5e0" />
                            <Text style={styles.emptyTitle}>No notifications yet</Text>
                            <Text style={styles.emptyText}>
                                You'll see updates here when a host changes the schedule, speakers or details of an event you follow.
                            </Text>
                        </View>
                    }
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={[styles.card, !item.read && styles.cardUnread]}
                            onPress={() => handlePress(item)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.iconCircle}>
                                <Ionicons
                                    name={(ICONS[item.type] || 'notifications') as any}
                                    size={22}
                                    color="#5A4485"
                                />
                            </View>
                            <View style={styles.cardBody}>
                                <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                                {!!item.body && <Text style={styles.cardText}>{item.body}</Text>}
                                <Text style={styles.cardTime}>{timeAgo(item.created_at)}</Text>
                            </View>
                            {!item.read && <View style={styles.dot} />}
                        </TouchableOpacity>
                    )}
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    header: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 24,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
    },
    headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
    markAllButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    markAllText: { color: '#fff', fontWeight: '700', fontSize: 13 },
    center: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80, paddingHorizontal: 40 },
    list: { padding: 16 },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 14,
        marginBottom: 10,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
    },
    cardUnread: { borderLeftWidth: 4, borderLeftColor: '#E36C54' },
    iconCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#f4f1f9',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    cardBody: { flex: 1 },
    cardTitle: { fontSize: 15, fontWeight: '800', color: '#1a1a1a' },
    cardText: { fontSize: 14, color: '#555', marginTop: 2 },
    cardTime: { fontSize: 12, color: '#999', marginTop: 4, fontWeight: '600' },
    dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#E36C54', marginLeft: 8 },
    emptyTitle: { fontSize: 20, fontWeight: '800', color: '#1a1a1a', marginTop: 16, marginBottom: 8 },
    emptyText: { fontSize: 15, color: '#999', textAlign: 'center', lineHeight: 22 },
});