import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Share,
    Platform,
    Alert,
    Dimensions,
} from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { supabase } from '../../services/supabase';
import { Ticket } from '../../types';
import { generateTicketQRData } from '../../services/qrCode';
import { RootStackParamList } from '../../types';

const { width } = Dimensions.get('window');

type TicketDetailRouteProp = RouteProp<RootStackParamList, 'TicketDetail'>;
type TicketDetailNavigationProp = NativeStackNavigationProp<RootStackParamList, 'TicketDetail'>;

export const TicketDetailScreen: React.FC = () => {
    const route = useRoute<TicketDetailRouteProp>();
    const navigation = useNavigation<TicketDetailNavigationProp>();
    const { ticketId } = route.params;

    const [ticket, setTicket] = useState<Ticket | null>(null);
    const [loading, setLoading] = useState(true);
    const [qrData, setQrData] = useState<string>('');

    useEffect(() => {
        loadTicket();
    }, [ticketId]);

    const loadTicket = async () => {
        try {
            const { data: ticketRow, error } = await supabase
                .from('tickets')
                .select('*')
                .eq('id', ticketId)
                .maybeSingle();

            if (error) throw error;

            if (!ticketRow) {
                Alert.alert('Error', 'Ticket not found');
                navigation.goBack();
                return;
            }

            const ticketData = {
                id: ticketRow.id,
                eventId: ticketRow.event_id,
                userId: ticketRow.user_id,
                paymentId: ticketRow.payment_id,
                status: ticketRow.status,
                qrCodeId: ticketRow.qr_code_id,
                priceOption: ticketRow.price_option,
                userName: ticketRow.user_name,
                userEmail: ticketRow.user_email,
                userPhotoURL: ticketRow.user_photo_url,
                createdAt: ticketRow.created_at ? new Date(ticketRow.created_at) : new Date(),
            } as Ticket;

            // Fetch event details
            if (ticketData.eventId) {
                const { data: eventRow, error: eventError } = await supabase
                    .from('events')
                    .select('*')
                    .eq('id', ticketData.eventId)
                    .maybeSingle();

                if (!eventError && eventRow) {
                    ticketData.event = {
                        id: eventRow.id,
                        ...eventRow,
                        date: eventRow.event_date ? new Date(eventRow.event_date) : new Date(),
                        startAt: eventRow.start_at ? new Date(eventRow.start_at) : undefined,
                        endAt: eventRow.end_at ? new Date(eventRow.end_at) : undefined,
                    } as any;
                }
            }

            setTicket(ticketData);
            setQrData(generateTicketQRData(ticketData));
        } catch (error) {
            console.error('Error loading ticket:', error);
            Alert.alert('Error', 'Failed to load ticket');
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    };
    
    const handleShare = async () => {
        try {
            await Share.share({
                message: `My ticket for ${ticket?.event?.title || 'Event'}\nTicket ID: ${ticketId}`,
                title: 'Event Ticket',
            });
        } catch (error) {
            console.error('Error sharing ticket:', error);
        }
    };

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'confirmed':
                return {
                    gradient: ['#43e97b', '#38f9d7'] as [string, string],
                    icon: 'checkmark-circle',
                    color: '#059669',
                    label: 'CONFIRMED',
                };
            case 'pending':
                return {
                    gradient: ['#fa709a', '#fee140'] as [string, string],
                    icon: 'time',
                    color: '#d97706',
                    label: 'PENDING',
                };
            case 'cancelled':
            case 'refunded':
                return {
                    gradient: ['#ff9a9e', '#fecfef'] as [string, string],
                    icon: 'close-circle',
                    color: '#dc2626',
                    label: status.toUpperCase(),
                };
            default:
                return {
                    gradient: ['#667eea', '#764ba2'] as [string, string],
                    icon: 'help-circle',
                    color: '#666',
                    label: 'UNKNOWN',
                };
        }
    };

    const formatEventDate = (date: Date | undefined) => {
        if (!date) return 'Date TBA';
        return date.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const formatEventTime = (date: Date | undefined) => {
        if (!date) return 'Time TBA';
        return date.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#667eea" />
                    <Text style={styles.loadingText}>Loading ticket...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!ticket) {
        return null;
    }

    const statusConfig = getStatusConfig(ticket.status);
    const eventDate = ticket.event?.startAt || ticket.event?.date;

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
                    <Text style={styles.headerTitle}>My Ticket</Text>
                    <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
                        <Ionicons name="share-outline" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Status Badge */}
                <View style={styles.statusContainer}>
                    <LinearGradient
                        colors={statusConfig.gradient}
                        style={styles.statusBadge}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <Ionicons name={statusConfig.icon as any} size={20} color="#fff" />
                        <Text style={styles.statusText}>{statusConfig.label}</Text>
                    </LinearGradient>
                </View>

                {/* Event Info Card */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.eventTitle} numberOfLines={2}>
                            {ticket.event?.title || ticket.event?.name || 'Event'}
                        </Text>
                    </View>

                    <View style={styles.detailsContainer}>
                        <View style={styles.detailRow}>
                            <View style={styles.detailIcon}>
                                <Ionicons name="calendar-outline" size={22} color="#667eea" />
                            </View>
                            <View style={styles.detailContent}>
                                <Text style={styles.detailLabel}>Date</Text>
                                <Text style={styles.detailValue}>{formatEventDate(eventDate)}</Text>
                            </View>
                        </View>

                        <View style={styles.detailRow}>
                            <View style={styles.detailIcon}>
                                <Ionicons name="time-outline" size={22} color="#f093fb" />
                            </View>
                            <View style={styles.detailContent}>
                                <Text style={styles.detailLabel}>Time</Text>
                                <Text style={styles.detailValue}>{formatEventTime(eventDate)}</Text>
                            </View>
                        </View>

                        <View style={styles.detailRow}>
                            <View style={styles.detailIcon}>
                                <Ionicons name="location-outline" size={22} color="#4facfe" />
                            </View>
                            <View style={styles.detailContent}>
                                <Text style={styles.detailLabel}>Location</Text>
                                <Text style={styles.detailValue} numberOfLines={2}>
                                    {ticket.event?.location || 'Location TBA'}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.detailRow}>
                            <View style={styles.detailIcon}>
                                <Ionicons name="ticket-outline" size={22} color="#fa709a" />
                            </View>
                            <View style={styles.detailContent}>
                                <Text style={styles.detailLabel}>Ticket Type</Text>
                                <Text style={styles.detailValue}>
                                    {ticket.priceOption?.name || 'General Admission'}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* QR Code Card */}
                {ticket.status === 'confirmed' && (
                    <View style={styles.qrCard}>
                        <Text style={styles.qrTitle}>Scan at Entry</Text>
                        <Text style={styles.qrSubtitle}>
                            Show this QR code at the event entrance
                        </Text>

                        <View style={styles.qrCodeContainer}>
                            <View style={styles.qrCodeWrapper}>
                                <QRCode
                                    value={qrData}
                                    size={width * 0.6}
                                    color="#1a1a1a"
                                    backgroundColor="#ffffff"
                                    logo={require('../../../assets/icon.png')}
                                    logoSize={50}
                                    logoBackgroundColor="#ffffff"
                                    logoBorderRadius={10}
                                />
                            </View>
                        </View>

                        <Text style={styles.qrFooter}>Ticket ID: {ticket.id.slice(-8).toUpperCase()}</Text>
                    </View>
                )}

                {ticket.status === 'pending' && (
                    <View style={styles.pendingCard}>
                        <Ionicons name="time-outline" size={48} color="#d97706" />
                        <Text style={styles.pendingTitle}>Pending Confirmation</Text>
                        <Text style={styles.pendingText}>
                            Your ticket is awaiting payment confirmation. The QR code will be
                            available once your payment is confirmed.
                        </Text>
                    </View>
                )}

                {/* Ticket Info */}
                <View style={styles.infoCard}>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Attendee</Text>
                        <Text style={styles.infoValue}>{ticket.userName || 'You'}</Text>
                    </View>
                    <View style={styles.infoDivider} />
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Email</Text>
                        <Text style={styles.infoValue} numberOfLines={1}>
                            {ticket.userEmail || 'N/A'}
                        </Text>
                    </View>
                    <View style={styles.infoDivider} />
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Purchase Date</Text>
                        <Text style={styles.infoValue}>
                            {ticket.createdAt.toLocaleDateString()}
                        </Text>
                    </View>
                </View>

                {/* Help Card */}
                <View style={styles.helpCard}>
                    <Ionicons name="information-circle-outline" size={20} color="#667eea" />
                    <Text style={styles.helpText}>
                        Need help? Contact the event organizer or support team.
                    </Text>
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#666',
        fontWeight: '600',
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
    shareButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    statusContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        gap: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    statusText: {
        fontSize: 14,
        color: '#fff',
        fontWeight: '800',
        letterSpacing: 1,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 24,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 6,
    },
    cardHeader: {
        marginBottom: 24,
        paddingBottom: 16,
        borderBottomWidth: 2,
        borderBottomColor: '#f0f0f0',
    },
    eventTitle: {
        fontSize: 26,
        fontWeight: '800',
        color: '#1a1a1a',
        lineHeight: 34,
    },
    detailsContainer: {
        gap: 20,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    detailIcon: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: '#f8f9fa',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    detailContent: {
        flex: 1,
    },
    detailLabel: {
        fontSize: 13,
        color: '#999',
        fontWeight: '600',
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    detailValue: {
        fontSize: 16,
        color: '#1a1a1a',
        fontWeight: '700',
    },
    qrCard: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 32,
        marginBottom: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 6,
    },
    qrTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#1a1a1a',
        marginBottom: 8,
    },
    qrSubtitle: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 32,
    },
    qrCodeContainer: {
        marginBottom: 24,
    },
    qrCodeWrapper: {
        padding: 20,
        backgroundColor: '#fff',
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    qrFooter: {
        fontSize: 12,
        color: '#999',
        fontWeight: '600',
        letterSpacing: 1,
    },
    pendingCard: {
        backgroundColor: '#fef3c7',
        borderRadius: 24,
        padding: 32,
        marginBottom: 20,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fde68a',
    },
    pendingTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#92400e',
        marginTop: 16,
        marginBottom: 12,
    },
    pendingText: {
        fontSize: 14,
        color: '#78350f',
        textAlign: 'center',
        lineHeight: 22,
    },
    infoCard: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 24,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
    },
    infoDivider: {
        height: 1,
        backgroundColor: '#f0f0f0',
    },
    infoLabel: {
        fontSize: 14,
        color: '#666',
        fontWeight: '600',
    },
    infoValue: {
        fontSize: 14,
        color: '#1a1a1a',
        fontWeight: '700',
        flex: 1,
        textAlign: 'right',
        marginLeft: 16,
    },
    helpCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#eff6ff',
        borderRadius: 16,
        padding: 16,
        gap: 12,
    },
    helpText: {
        flex: 1,
        fontSize: 13,
        color: '#1e40af',
        fontWeight: '600',
        lineHeight: 18,
    },
});
