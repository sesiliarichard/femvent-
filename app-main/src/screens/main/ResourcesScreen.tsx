import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Linking, Alert } from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

interface Resource {
    id: string;
    title: string;
    type: 'pdf' | 'slides' | 'link';
    size?: string;
    url: string;
}

// No `resources` table exists yet — this screen shows an empty state until one is built.
const SAMPLE_RESOURCES: Resource[] = [];

const typeIcon: Record<Resource['type'], keyof typeof Ionicons.glyphMap> = {
    pdf: 'document-text-outline',
    slides: 'easel-outline',
    link: 'link-outline',
};

export const ResourcesScreen: React.FC = () => {
    const navigation = useNavigation();
    const [resources, setResources] = useState<Resource[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // TODO: replace with a real Supabase query once a `resources` table exists
        setResources(SAMPLE_RESOURCES);
        setLoading(false);
    }, []);

    const handleOpen = async (resource: Resource) => {
        const supported = await Linking.canOpenURL(resource.url);
        if (supported) {
            Linking.openURL(resource.url);
        } else {
            Alert.alert('Unable to open', 'This resource link could not be opened.');
        }
    };

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
                    <Text style={styles.headerTitle}>Resources</Text>
                    <View style={{ width: 40 }} />
                </View>
            </LinearGradient>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {resources.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="folder-open-outline" size={64} color="#cbd5e0" />
                        <Text style={styles.emptyTitle}>No resources yet</Text>
                        <Text style={styles.emptyDescription}>
                            The host hasn't published any resources for this event.
                        </Text>
                    </View>
                ) : (
                <View style={styles.listContainer}>
                    {resources.map((res) => (
                        <TouchableOpacity key={res.id} style={styles.card} onPress={() => handleOpen(res)} activeOpacity={0.7}>
                            <View style={styles.iconCircle}>
                                <Ionicons name={typeIcon[res.type]} size={22} color="#667eea" />
                            </View>
                            <View style={{ flex: 1, marginLeft: 14 }}>
                                <Text style={styles.resourceTitle}>{res.title}</Text>
                                {res.size && <Text style={styles.resourceMeta}>{res.size}</Text>}
                            </View>
                            <Ionicons name="download-outline" size={20} color="#999" />
                        </TouchableOpacity>
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
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 100, paddingHorizontal: 40 },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a1a', marginTop: 16, marginBottom: 6 },
    emptyDescription: { fontSize: 14, color: '#666', textAlign: 'center' },
    card: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 18,
        padding: 14, marginBottom: 12,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
    },
    iconCircle: {
        width: 44, height: 44, borderRadius: 14, backgroundColor: '#e0e7ff',
        justifyContent: 'center', alignItems: 'center',
    },
    resourceTitle: { fontSize: 15, fontWeight: '700', color: '#1a1a1a' },
    resourceMeta: { fontSize: 12, color: '#999', marginTop: 2 },
});