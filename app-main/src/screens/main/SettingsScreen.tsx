import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Switch,
    Alert,
} from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    requestNotificationPermissions,
    sendLocalNotification,
    sendTicketConfirmationNotification,
} from '../../services/notifications';
import { useAuth } from '../../services/AuthContext';

const SETTINGS_KEYS = {
    TICKET_NOTIFICATIONS: 'notifications_tickets',
    EVENT_REMINDERS: 'notifications_reminders',
    CHECK_IN_NOTIFICATIONS: 'notifications_checkin',
    MARKETING: 'notifications_marketing',
};

export const SettingsScreen: React.FC = () => {
    const navigation = useNavigation();
    const { user, signOut } = useAuth();

    const [ticketNotifications, setTicketNotifications] = useState(true);
    const [eventReminders, setEventReminders] = useState(true);
    const [checkInNotifications, setCheckInNotifications] = useState(true);
    const [marketingNotifications, setMarketingNotifications] = useState(false);
    const [testingNotification, setTestingNotification] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const settings = await AsyncStorage.multiGet([
                SETTINGS_KEYS.TICKET_NOTIFICATIONS,
                SETTINGS_KEYS.EVENT_REMINDERS,
                SETTINGS_KEYS.CHECK_IN_NOTIFICATIONS,
                SETTINGS_KEYS.MARKETING,
            ]);

            settings.forEach(([key, value]) => {
                const boolValue = value === null ? true : value === 'true';
                switch (key) {
                    case SETTINGS_KEYS.TICKET_NOTIFICATIONS:
                        setTicketNotifications(boolValue);
                        break;
                    case SETTINGS_KEYS.EVENT_REMINDERS:
                        setEventReminders(boolValue);
                        break;
                    case SETTINGS_KEYS.CHECK_IN_NOTIFICATIONS:
                        setCheckInNotifications(boolValue);
                        break;
                    case SETTINGS_KEYS.MARKETING:
                        setMarketingNotifications(boolValue);
                        break;
                }
            });
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    };

    const saveSetting = async (key: string, value: boolean) => {
        try {
            await AsyncStorage.setItem(key, value.toString());
        } catch (error) {
            console.error('Error saving setting:', error);
        }
    };

    const handleTestNotification = async () => {
        console.log('Test notification button pressed');
        if (testingNotification) {
            console.log('Already testing, ignoring');
            return;
        }

        setTestingNotification(true);
        try {
            console.log('Starting notification test...');

            // Try to request permissions
            console.log('Requesting permissions...');
            const hasPermission = await requestNotificationPermissions();
            console.log('Permission result:', hasPermission);

            if (!hasPermission) {
                console.log('No permission, showing alert');
                Alert.alert(
                    'Permission Required',
                    'Please enable notifications in your device settings to receive notifications.',
                    [{ text: 'OK', onPress: () => setTestingNotification(false) }]
                );
                return;
            }

            console.log('Sending test notification...');
            await sendLocalNotification(
                '🎉 Test Notification',
                'If you can see this, notifications are working perfectly!',
                { type: 'test' }
            );
            console.log('Notification sent!');

            // Show success alert
            Alert.alert(
                'Success!',
                'Test notification sent! You should see it now.',
                [{ text: 'Great!', onPress: () => setTestingNotification(false) }]
            );
        } catch (error) {
            console.error('Error in handleTestNotification:', error);
            Alert.alert(
                'Error',
                `Failed to send test notification: ${error.message || 'Unknown error'}`,
                [{ text: 'OK', onPress: () => setTestingNotification(false) }]
            );
        }
    };

    const handleSignOut = async () => {
        Alert.alert(
            'Sign Out',
            'Are you sure you want to sign out?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Sign Out',
                    style: 'destructive',
                    onPress: signOut
                },
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <LinearGradient
                colors={['#667eea', '#764ba2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <View style={styles.headerContent}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={styles.backButton}
                    >
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Settings</Text>
                    <View style={{ width: 40 }} />
                </View>
            </LinearGradient>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* User Info Card */}
                <View style={styles.card}>
                    <View style={styles.userInfo}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>
                                {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
                            </Text>
                        </View>
                        <View style={styles.userDetails}>
                            <Text style={styles.userName}>{user?.name || 'User'}</Text>
                            <Text style={styles.userEmail}>{user?.email}</Text>
                        </View>
                    </View>
                </View>

                {/* Notifications Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Notifications</Text>

                    <View style={styles.card}>
                        <View style={styles.settingRow}>
                            <View style={styles.settingInfo}>
                                <Ionicons name="ticket" size={24} color="#667eea" />
                                <View style={styles.settingText}>
                                    <Text style={styles.settingLabel}>Ticket Updates</Text>
                                    <Text style={styles.settingDescription}>
                                        Get notified when tickets are confirmed
                                    </Text>
                                </View>
                            </View>
                            <Switch
                                value={ticketNotifications}
                                onValueChange={(value) => {
                                    setTicketNotifications(value);
                                    saveSetting(SETTINGS_KEYS.TICKET_NOTIFICATIONS, value);
                                }}
                                trackColor={{ false: '#e2e8f0', true: '#667eea' }}
                                thumbColor={ticketNotifications ? '#fff' : '#cbd5e0'}
                            />
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.settingRow}>
                            <View style={styles.settingInfo}>
                                <Ionicons name="time" size={24} color="#f093fb" />
                                <View style={styles.settingText}>
                                    <Text style={styles.settingLabel}>Event Reminders</Text>
                                    <Text style={styles.settingDescription}>
                                        Reminders 1 hour before events
                                    </Text>
                                </View>
                            </View>
                            <Switch
                                value={eventReminders}
                                onValueChange={(value) => {
                                    setEventReminders(value);
                                    saveSetting(SETTINGS_KEYS.EVENT_REMINDERS, value);
                                }}
                                trackColor={{ false: '#e2e8f0', true: '#f093fb' }}
                                thumbColor={eventReminders ? '#fff' : '#cbd5e0'}
                            />
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.settingRow}>
                            <View style={styles.settingInfo}>
                                <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                                <View style={styles.settingText}>
                                    <Text style={styles.settingLabel}>Check-In Confirmations</Text>
                                    <Text style={styles.settingDescription}>
                                        Notify when successfully checked in
                                    </Text>
                                </View>
                            </View>
                            <Switch
                                value={checkInNotifications}
                                onValueChange={(value) => {
                                    setCheckInNotifications(value);
                                    saveSetting(SETTINGS_KEYS.CHECK_IN_NOTIFICATIONS, value);
                                }}
                                trackColor={{ false: '#e2e8f0', true: '#10b981' }}
                                thumbColor={checkInNotifications ? '#fff' : '#cbd5e0'}
                            />
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.settingRow}>
                            <View style={styles.settingInfo}>
                                <Ionicons name="megaphone" size={24} color="#f59e0b" />
                                <View style={styles.settingText}>
                                    <Text style={styles.settingLabel}>Promotions & News</Text>
                                    <Text style={styles.settingDescription}>
                                        Updates about new events and offers
                                    </Text>
                                </View>
                            </View>
                            <Switch
                                value={marketingNotifications}
                                onValueChange={(value) => {
                                    setMarketingNotifications(value);
                                    saveSetting(SETTINGS_KEYS.MARKETING, value);
                                }}
                                trackColor={{ false: '#e2e8f0', true: '#f59e0b' }}
                                thumbColor={marketingNotifications ? '#fff' : '#cbd5e0'}
                            />
                        </View>
                    </View>

                    {/* Test Notification Button */}
                    <TouchableOpacity
                        style={styles.testButton}
                        onPress={handleTestNotification}
                        disabled={testingNotification}
                    >
                        <LinearGradient
                            colors={['#667eea', '#764ba2']}
                            style={styles.testButtonGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <Ionicons name="notifications" size={20} color="#fff" />
                            <Text style={styles.testButtonText}>
                                {testingNotification ? 'Sending...' : 'Send Test Notification'}
                            </Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

                {/* Account Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Account</Text>

                    <View style={styles.card}>
                        <TouchableOpacity style={styles.settingRow}>
                            <View style={styles.settingInfo}>
                                <Ionicons name="person" size={24} color="#667eea" />
                                <View style={styles.settingText}>
                                    <Text style={styles.settingLabel}>Edit Profile</Text>
                                </View>
                            </View>
                            <Ionicons name="chevron-forward" size={24} color="#cbd5e0" />
                        </TouchableOpacity>

                        <View style={styles.divider} />

                        <TouchableOpacity style={styles.settingRow}>
                            <View style={styles.settingInfo}>
                                <Ionicons name="lock-closed" size={24} color="#f093fb" />
                                <View style={styles.settingText}>
                                    <Text style={styles.settingLabel}>Change Password</Text>
                                </View>
                            </View>
                            <Ionicons name="chevron-forward" size={24} color="#cbd5e0" />
                        </TouchableOpacity>

                        <View style={styles.divider} />

                        <TouchableOpacity
                            style={styles.settingRow}
                            onPress={handleSignOut}
                        >
                            <View style={styles.settingInfo}>
                                <Ionicons name="log-out" size={24} color="#ef4444" />
                                <View style={styles.settingText}>
                                    <Text style={{ ...styles.settingLabel, color: '#ef4444' }}>Sign Out</Text>
                                </View>
                            </View>
                            <Ionicons name="chevron-forward" size={24} color="#cbd5e0" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* App Info */}
                <View style={styles.appInfo}>
                    <Text style={styles.appInfoText}>KUZA Events v1.0.0</Text>
                    <Text style={styles.appInfoText}>© 2025 All rights reserved</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 24,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 10,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#fff',
    },
    scrollView: {
        flex: 1,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#667eea',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 28,
        fontWeight: '800',
        color: '#fff',
    },
    userDetails: {
        marginLeft: 16,
        flex: 1,
    },
    userName: {
        fontSize: 20,
        fontWeight: '800',
        color: '#1a1a1a',
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 14,
        color: '#666',
        fontWeight: '600',
    },
    section: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: '#666',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 12,
    },
    settingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
    },
    settingInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    settingText: {
        marginLeft: 12,
        flex: 1,
    },
    settingLabel: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1a1a1a',
        marginBottom: 2,
    },
    settingDescription: {
        fontSize: 13,
        color: '#666',
        fontWeight: '500',
    },
    divider: {
        height: 1,
        backgroundColor: '#f0f0f0',
        marginVertical: 8,
    },
    testButton: {
        borderRadius: 16,
        overflow: 'hidden',
        marginTop: 12,
    },
    testButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        gap: 8,
    },
    testButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    appInfo: {
        alignItems: 'center',
        padding: 20,
        paddingBottom: 40,
    },
    appInfoText: {
        fontSize: 12,
        color: '#999',
        fontWeight: '600',
        marginBottom: 4,
    },
});
