import React from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, Image } from 'react-native';
import { Text } from 'react-native-paper';
import { DrawerContentComponentProps } from '@react-navigation/drawer';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../services/AuthContext';
import { useCurrentEvent } from '../services/EventContext';

interface DrawerItem {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    onPress: () => void;
}

export const CustomDrawerContent: React.FC<DrawerContentComponentProps> = (props) => {
    const { navigation } = props;
    const { user, signOut } = useAuth();
    const { currentEvent } = useCurrentEvent();

    const TAB_SCREENS = ['Home', 'Profile'];

    const go = (screen: string, params?: object) => {
        if (TAB_SCREENS.includes(screen)) {
            (navigation as any).navigate('Main', { screen: 'Tabs', params: { screen, params } });
        } else {
            (navigation as any).navigate(screen, params);
        }
        navigation.closeDrawer();
    };
    const handleSignOut = () => {
        Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign Out', onPress: signOut, style: 'destructive' },
        ]);
    };

    const renderSection = (title: string, items: DrawerItem[]) => (
        <View style={styles.section}>
            <Text style={styles.sectionLabel}>{title}</Text>
            {items.map((item) => (
                <TouchableOpacity
                    key={item.label}
                    style={styles.item}
                    onPress={item.onPress}
                    activeOpacity={0.7}
                >
                    <Ionicons name={item.icon} size={20} color="#e0e7ff" />
                    <Text style={styles.itemLabel}>{item.label}</Text>
                </TouchableOpacity>
            ))}
        </View>
    );

    return (
        <LinearGradient
            colors={['#667eea', '#764ba2']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.container}
        >
            <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
                <View style={styles.header}>
                    {user?.photoURL ? (
                        <Image source={{ uri: user.photoURL }} style={styles.avatar} />
                    ) : (
                        <View style={styles.avatarPlaceholder}>
                            <Text style={styles.avatarInitial}>
                                {user?.name?.charAt(0).toUpperCase() || 'U'}
                            </Text>
                        </View>
                    )}
                    <Text style={styles.userName}>{user?.name || 'Attendee'}</Text>
                    <Text style={styles.userEmail}>{user?.email}</Text>
                </View>

                <View style={styles.body}>
                {renderSection('Event', [
                        { icon: 'calendar-outline', label: 'My Events', onPress: () => go('MyEvents') },
                        { icon: 'home-outline', label: 'Home', onPress: () => go('Home') },
                        { icon: 'grid-outline', label: 'Browse events', onPress: () => go('Events') },
                        { icon: 'ticket-outline', label: 'My ticket', onPress: () => go('Tickets') },
                        { icon: 'calendar-outline', label: 'Agenda', onPress: () => go('Schedule', currentEvent ? { eventId: currentEvent.id } : undefined) },
                        { icon: 'map-outline', label: 'Venue map', onPress: () => go('VenueMap') },
                    ])}

                    {renderSection('Discover', [
                        { icon: 'mic-outline', label: 'Speakers', onPress: () => go('SpeakersList', currentEvent ? { eventId: currentEvent.id } : undefined) },
                        { icon: 'storefront-outline', label: 'Sponsors', onPress: () => go('Sponsor', currentEvent ? { eventId: currentEvent.id } : undefined) },
                        { icon: 'business-outline', label: 'Exhibitors', onPress: () => go('Exhibitors') },
                    ])}

                    {renderSection('Engage', [
                        { icon: 'people-outline', label: 'Networking', onPress: () => go('AttendeesList', currentEvent ? { eventId: currentEvent.id } : undefined) },
                        { icon: 'heart-outline', label: 'Favorites', onPress: () => go('Favorites') },
                        { icon: 'megaphone-outline', label: 'Announcements', onPress: () => go('Announcements') },
                        { icon: 'download-outline', label: 'Resources', onPress: () => go('Resources') },
                        { icon: 'chatbubble-ellipses-outline', label: 'Feedback', onPress: () => go('Feedback') },
                    ])}

                    {renderSection('Account', [
                        { icon: 'person-outline', label: 'Profile', onPress: () => go('Profile') },
                        { icon: 'create-outline', label: 'Edit profile', onPress: () => go('EditProfile') },
                        { icon: 'card-outline', label: 'Payment history', onPress: () => go('PaymentHistory') },
                        { icon: 'settings-outline', label: 'Settings', onPress: () => go('Settings') },
                    ])}
                </View>

                <TouchableOpacity style={styles.logout} onPress={handleSignOut} activeOpacity={0.7}>
                    <Ionicons name="log-out-outline" size={20} color="#fecaca" />
                    <Text style={styles.logoutLabel}>Log out</Text>
                </TouchableOpacity>
            </SafeAreaView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.15)',
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        marginBottom: 12,
        borderWidth: 2,
        borderColor: '#fff',
    },
    avatarPlaceholder: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
        borderWidth: 2,
        borderColor: '#fff',
    },
    avatarInitial: {
        fontSize: 22,
        fontWeight: '700',
        color: '#fff',
    },
    userName: {
        fontSize: 17,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 2,
    },
    userEmail: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.8)',
    },
    body: {
        flex: 1,
        paddingTop: 8,
    },
    section: {
        paddingHorizontal: 20,
        marginBottom: 14,
    },
    sectionLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.55)',
        letterSpacing: 0.5,
        marginBottom: 6,
        marginTop: 6,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        gap: 14,
    },
    itemLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: '#fff',
    },
    logout: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.15)',
    },
    logoutLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: '#fecaca',
    },
});