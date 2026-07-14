import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    Vibration,
    Alert,
    Dimensions,
    Modal,
} from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { CameraView, Camera } from 'expo-camera';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../types';
import { validateTicket, checkInAttendee } from '../../services/ticketValidation';
import { TicketValidationResult } from '../../services/ticketValidation';

const { width } = Dimensions.get('window');

type QRScannerRouteProp = RouteProp<RootStackParamList, 'QRScanner'>;
type QRScannerNavigationProp = NativeStackNavigationProp<RootStackParamList, 'QRScanner'>;

export const QRScannerScreen: React.FC = () => {
    const route = useRoute<QRScannerRouteProp>();
    const navigation = useNavigation<QRScannerNavigationProp>();
    const { eventId, eventTitle } = route.params;

    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [scanned, setScanned] = useState(false);
    const [validating, setValidating] = useState(false);
    const [showResult, setShowResult] = useState(false);
    const [validationResult, setValidationResult] = useState<TicketValidationResult | null>(null);
    const [flashOn, setFlashOn] = useState(false);

    useEffect(() => {
        requestCameraPermission();
    }, []);

    const requestCameraPermission = async () => {
        const { status } = await Camera.requestCameraPermissionsAsync();
        setHasPermission(status === 'granted');
    };

    const handleBarCodeScanned = async ({ data }: { data: string }) => {
        if (scanned || validating) return;

        setScanned(true);
        setValidating(true);
        Vibration.vibrate(100);

        try {
            const result = await validateTicket(data, eventId);
            setValidationResult(result);
            setShowResult(true);

            if (result.valid) {
                Vibration.vibrate([0, 100, 100, 100]);
            } else {
                Vibration.vibrate([0, 200, 100, 200]);
            }
        } catch (error) {
            console.error('Error validating ticket:', error);
            setValidationResult({
                valid: false,
                message: '❌ Error scanning ticket. Please try again.',
            });
            setShowResult(true);
        } finally {
            setValidating(false);
        }
    };

    const handleCheckIn = async () => {
        if (!validationResult?.ticket || validationResult.alreadyCheckedIn) {
            handleDismiss();
            return;
        }

        try {
            const success = await checkInAttendee(validationResult.ticket.id);

            if (success) {
                Alert.alert(
                    '✅ Checked In',
                    `${validationResult.ticket.userName || 'Attendee'} has been checked in successfully!`,
                    [{ text: 'OK', onPress: handleDismiss }]
                );
            } else {
                Alert.alert('Error', 'Failed to check in attendee. Please try again.');
            }
        } catch (error) {
            console.error('Error checking in:', error);
            Alert.alert('Error', 'Failed to check in attendee.');
        }
    };

    const handleDismiss = () => {
        setShowResult(false);
        setValidationResult(null);
        setScanned(false);
    };

    if (hasPermission === null) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#667eea" />
                    <Text style={styles.loadingText}>Requesting camera permission...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (hasPermission === false) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.permissionContainer}>
                    <Ionicons name="camera-off" size={80} color="#dc2626" />
                    <Text style={styles.permissionTitle}>Camera Access Needed</Text>
                    <Text style={styles.permissionText}>
                        Please grant camera permission to scan QR codes
                    </Text>
                    <TouchableOpacity
                        style={styles.permissionButton}
                        onPress={requestCameraPermission}
                    >
                        <LinearGradient
                            colors={['#667eea', '#764ba2']}
                            style={styles.permissionButtonGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <Text style={styles.permissionButtonText}>Grant Permission</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.backTextButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Text style={styles.backTextButtonText}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <View style={styles.container}>
            <CameraView
                style={styles.camera}
                facing="back"
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                barcodeScannerSettings={{
                    barcodeTypes: ['qr'],
                }}
            >
                {/* Header */}
                <LinearGradient
                    colors={['rgba(0,0,0,0.8)', 'rgba(0,0,0,0.4)', 'transparent']}
                    style={styles.header}
                >
                    <SafeAreaView edges={['top']}>
                        <View style={styles.headerContent}>
                            <TouchableOpacity
                                onPress={() => navigation.goBack()}
                                style={styles.headerButton}
                            >
                                <Ionicons name="arrow-back" size={24} color="#fff" />
                            </TouchableOpacity>
                            <View style={styles.headerTextContainer}>
                                <Text style={styles.headerTitle}>QR Scanner</Text>
                                <Text style={styles.headerSubtitle}>{eventTitle}</Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => setFlashOn(!flashOn)}
                                style={styles.headerButton}
                            >
                                <Ionicons
                                    name={flashOn ? 'flash' : 'flash-off'}
                                    size={24}
                                    color="#fff"
                                />
                            </TouchableOpacity>
                        </View>
                    </SafeAreaView>
                </LinearGradient>

                {/* Scanning Frame */}
                <View style={styles.scannerContainer}>
                    <View style={styles.scannerFrame}>
                        <View style={[styles.corner, styles.topLeft]} />
                        <View style={[styles.corner, styles.topRight]} />
                        <View style={[styles.corner, styles.bottomLeft]} />
                        <View style={[styles.corner, styles.bottomRight]} />
                    </View>
                    <Text style={styles.instructionText}>
                        Align QR code within frame
                    </Text>
                </View>

                {/* Bottom Gradient */}
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.8)']}
                    style={styles.bottomGradient}
                >
                    {validating && (
                        <View style={styles.validatingContainer}>
                            <ActivityIndicator size="large" color="#fff" />
                            <Text style={styles.validatingText}>Validating ticket...</Text>
                        </View>
                    )}
                </LinearGradient>
            </CameraView>

            {/* Validation Result Modal */}
            <Modal
                visible={showResult}
                transparent
                animationType="slide"
                onRequestClose={handleDismiss}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        {validationResult && (
                            <>
                                <View
                                    style={[
                                        styles.resultIcon,
                                        validationResult.valid
                                            ? styles.resultIconSuccess
                                            : styles.resultIconError,
                                    ]}
                                >
                                    <Ionicons
                                        name={
                                            validationResult.valid
                                                ? validationResult.alreadyCheckedIn
                                                    ? 'checkmark-done'
                                                    : 'checkmark-circle'
                                                : 'close-circle'
                                        }
                                        size={60}
                                        color="#fff"
                                    />
                                </View>

                                <Text style={styles.resultMessage}>
                                    {validationResult.message}
                                </Text>

                                {validationResult.valid && validationResult.ticket && (
                                    <View style={styles.ticketInfo}>
                                        <View style={styles.infoRow}>
                                            <Text style={styles.infoLabel}>Attendee:</Text>
                                            <Text style={styles.infoValue}>
                                                {validationResult.ticket.userName || 'Unknown'}
                                            </Text>
                                        </View>
                                        <View style={styles.infoRow}>
                                            <Text style={styles.infoLabel}>Email:</Text>
                                            <Text style={styles.infoValue} numberOfLines={1}>
                                                {validationResult.ticket.userEmail || 'N/A'}
                                            </Text>
                                        </View>
                                        <View style={styles.infoRow}>
                                            <Text style={styles.infoLabel}>Ticket Type:</Text>
                                            <Text style={styles.infoValue}>
                                                {validationResult.ticket.priceOption?.name || 'General'}
                                            </Text>
                                        </View>
                                        <View style={styles.infoRow}>
                                            <Text style={styles.infoLabel}>Status:</Text>
                                            <Text style={styles.infoValue}>
                                                {validationResult.ticket.status}
                                            </Text>
                                        </View>
                                    </View>
                                )}

                                <View style={styles.modalButtons}>
                                    {validationResult.valid && !validationResult.alreadyCheckedIn ? (
                                        <>
                                            <TouchableOpacity
                                                style={styles.modalButtonSecondary}
                                                onPress={handleDismiss}
                                            >
                                                <Text style={styles.modalButtonSecondaryText}>
                                                    Cancel
                                                </Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={styles.modalButtonPrimary}
                                                onPress={handleCheckIn}
                                            >
                                                <LinearGradient
                                                    colors={['#10b981', '#059669']}
                                                    style={styles.modalButtonGradient}
                                                    start={{ x: 0, y: 0 }}
                                                    end={{ x: 1, y: 1 }}
                                                >
                                                    <Text style={styles.modalButtonPrimaryText}>
                                                        ✓ Check In
                                                    </Text>
                                                </LinearGradient>
                                            </TouchableOpacity>
                                        </>
                                    ) : (
                                        <TouchableOpacity
                                            style={styles.modalButtonFull}
                                            onPress={handleDismiss}
                                        >
                                            <LinearGradient
                                                colors={['#667eea', '#764ba2']}
                                                style={styles.modalButtonGradient}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 1 }}
                                            >
                                                <Text style={styles.modalButtonPrimaryText}>
                                                    Scan Another
                                                </Text>
                                            </LinearGradient>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#666',
        fontWeight: '600',
    },
    permissionContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
        backgroundColor: '#f8f9fa',
    },
    permissionTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#1a1a1a',
        marginTop: 24,
        marginBottom: 12,
    },
    permissionText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 24,
    },
    permissionButton: {
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 16,
    },
    permissionButtonGradient: {
        paddingHorizontal: 32,
        paddingVertical: 16,
    },
    permissionButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    backTextButton: {
        padding: 12,
    },
    backTextButtonText: {
        color: '#667eea',
        fontSize: 16,
        fontWeight: '600',
    },
    camera: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTextContainer: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#fff',
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 2,
    },
    scannerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scannerFrame: {
        width: width * 0.7,
        height: width * 0.7,
        position: 'relative',
    },
    corner: {
        position: 'absolute',
        width: 40,
        height: 40,
        borderColor: '#fff',
    },
    topLeft: {
        top: 0,
        left: 0,
        borderTopWidth: 4,
        borderLeftWidth: 4,
    },
    topRight: {
        top: 0,
        right: 0,
        borderTopWidth: 4,
        borderRightWidth: 4,
    },
    bottomLeft: {
        bottom: 0,
        left: 0,
        borderBottomWidth: 4,
        borderLeftWidth: 4,
    },
    bottomRight: {
        bottom: 0,
        right: 0,
        borderBottomWidth: 4,
        borderRightWidth: 4,
    },
    instructionText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginTop: 32,
        textAlign: 'center',
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
    },
    bottomGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 150,
        justifyContent: 'center',
        alignItems: 'center',
    },
    validatingContainer: {
        alignItems: 'center',
    },
    validatingText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginTop: 12,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 32,
        width: '100%',
        maxWidth: 400,
        alignItems: 'center',
    },
    resultIcon: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    resultIconSuccess: {
        backgroundColor: '#10b981',
    },
    resultIconError: {
        backgroundColor: '#dc2626',
    },
    resultMessage: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1a1a1a',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 26,
    },
    ticketInfo: {
        width: '100%',
        backgroundColor: '#f8f9fa',
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
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
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    modalButtonSecondary: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#e5e7eb',
        alignItems: 'center',
    },
    modalButtonSecondaryText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#666',
    },
    modalButtonPrimary: {
        flex: 1,
        borderRadius: 16,
        overflow: 'hidden',
    },
    modalButtonFull: {
        width: '100%',
        borderRadius: 16,
        overflow: 'hidden',
    },
    modalButtonGradient: {
        paddingVertical: 16,
        alignItems: 'center',
    },
    modalButtonPrimaryText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },
});
