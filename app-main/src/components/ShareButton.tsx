import React, { useState } from 'react';
import {
    TouchableOpacity,
    StyleSheet,
    View,
    Modal,
    TouchableWithoutFeedback,
} from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
    shareEvent,
    shareToWhatsApp,
    shareViaSMS,
    shareViaEmail,
} from '../services/sharing';

interface ShareButtonProps {
    event: {
        id: string;
        title: string;
        date: Date;
        location?: string;
        description?: string;
    };
    variant?: 'icon' | 'full';
    size?: number;
    color?: string;
}

export const ShareButton: React.FC<ShareButtonProps> = ({
    event,
    variant = 'icon',
    size = 24,
    color = '#667eea',
}) => {
    const [showOptions, setShowOptions] = useState(false);

    const handleShare = async () => {
        if (variant === 'icon') {
            // Show options modal for icon variant
            setShowOptions(true);
        } else {
            // Direct share for full button
            await shareEvent(event);
        }
    };

    const handleOptionPress = async (option: string) => {
        setShowOptions(false);

        switch (option) {
            case 'whatsapp':
                await shareToWhatsApp(event);
                break;
            case 'sms':
                await shareViaSMS(event);
                break;
            case 'email':
                await shareViaEmail(event);
                break;
            case 'more':
                await shareEvent(event);
                break;
        }
    };

    if (variant === 'icon') {
        return (
            <>
                <TouchableOpacity style={styles.iconButton} onPress={handleShare}>
                    <Ionicons name="share-social" size={size} color={color} />
                </TouchableOpacity>

                <Modal
                    visible={showOptions}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setShowOptions(false)}
                >
                    <TouchableWithoutFeedback onPress={() => setShowOptions(false)}>
                        <View style={styles.modalOverlay}>
                            <TouchableWithoutFeedback>
                                <View style={styles.optionsContainer}>
                                    <Text style={styles.optionsTitle}>Share via</Text>

                                    <TouchableOpacity
                                        style={styles.option}
                                        onPress={() => handleOptionPress('whatsapp')}
                                    >
                                        <View style={[styles.optionIcon, { backgroundColor: '#25D366' }]}>
                                            <Ionicons name="logo-whatsapp" size={24} color="#fff" />
                                        </View>
                                        <Text style={styles.optionText}>WhatsApp</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={styles.option}
                                        onPress={() => handleOptionPress('sms')}
                                    >
                                        <View style={[styles.optionIcon, { backgroundColor: '#10b981' }]}>
                                            <Ionicons name="chatbubble" size={24} color="#fff" />
                                        </View>
                                        <Text style={styles.optionText}>SMS</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={styles.option}
                                        onPress={() => handleOptionPress('email')}
                                    >
                                        <View style={[styles.optionIcon, { backgroundColor: '#f59e0b' }]}>
                                            <Ionicons name="mail" size={24} color="#fff" />
                                        </View>
                                        <Text style={styles.optionText}>Email</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={styles.option}
                                        onPress={() => handleOptionPress('more')}
                                    >
                                        <View style={[styles.optionIcon, { backgroundColor: '#667eea' }]}>
                                            <Ionicons name="ellipsis-horizontal" size={24} color="#fff" />
                                        </View>
                                        <Text style={styles.optionText}>More</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={styles.cancelButton}
                                        onPress={() => setShowOptions(false)}
                                    >
                                        <Text style={styles.cancelText}>Cancel</Text>
                                    </TouchableOpacity>
                                </View>
                            </TouchableWithoutFeedback>
                        </View>
                    </TouchableWithoutFeedback>
                </Modal>
            </>
        );
    }

    return (
        <TouchableOpacity style={styles.button} onPress={handleShare} activeOpacity={0.8}>
            <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <Ionicons name="share-social" size={20} color="#fff" />
                <Text style={styles.buttonText}>Share Event</Text>
            </LinearGradient>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    iconButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    button: {
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
    gradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 20,
        gap: 8,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    optionsContainer: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 40,
    },
    optionsTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1a1a1a',
        marginBottom: 20,
        textAlign: 'center',
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
        backgroundColor: '#f8f9fa',
        borderRadius: 16,
        marginBottom: 12,
    },
    optionIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    optionText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1a1a1a',
    },
    cancelButton: {
        marginTop: 8,
        paddingVertical: 16,
        alignItems: 'center',
    },
    cancelText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#999',
    },
});
