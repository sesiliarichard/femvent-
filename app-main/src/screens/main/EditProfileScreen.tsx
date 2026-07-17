import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Image,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../services/AuthContext';
import { showImagePickerOptions, uploadProfilePhoto } from '../../services/media';

export const EditProfileScreen: React.FC = () => {
    const navigation = useNavigation();
    const { user, refreshUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Form state
    const [name, setName] = useState(user?.name || '');
    const [bio, setBio] = useState(user?.bio || '');
    const [phone, setPhone] = useState(user?.phone || '');
    const [instagram, setInstagram] = useState(user?.instagram || '');
    const [twitter, setTwitter] = useState(user?.twitter || '');
    const [facebook, setFacebook] = useState(user?.facebook || '');
    const [photoUrl, setPhotoUrl] = useState(user?.photoURL || '');

    const handlePhotoPress = async () => {
        const uri = await showImagePickerOptions();
        if (uri && user?.id) {
            setUploading(true);
            const downloadURL = await uploadProfilePhoto(uri, user.id);
            if (downloadURL) {
                setPhotoUrl(downloadURL);
            }
            setUploading(false);
        }
    };

    const handleSave = async () => {
        if (!user?.id) return;

        setLoading(true);
        try {
            const { error } = await supabase
                .from('users')
                .update({
                    name,
                    bio,
                    phone,
                    instagram,
                    twitter,
                    facebook,
                    photo_url: photoUrl,
                })
                .eq('id', user.id);

            if (error) throw error;

            // Refresh user data in AuthContext
            await refreshUser();

            Alert.alert('Success', 'Profile updated successfully!', [
                { text: 'OK', onPress: () => navigation.goBack() },
            ]);
        } catch (error) {
            console.error('Error updating profile:', error);
            Alert.alert('Error', 'Failed to update profile. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            'Delete Account',
            'Are you sure you want to delete your account? This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        Alert.alert('Feature Coming Soon', 'Account deletion will be available in the next update.');
                    },
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
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Edit Profile</Text>
                    <TouchableOpacity
                        onPress={handleSave}
                        style={styles.saveButton}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Text style={styles.saveText}>Save</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Profile Photo */}
                <View style={styles.photoSection}>
                    <TouchableOpacity onPress={handlePhotoPress} style={styles.photoContainer}>
                        {photoUrl ? (
                            <Image source={{ uri: photoUrl }} style={styles.photo} />
                        ) : (
                            <View style={styles.photoPlaceholder}>
                                <Ionicons name="person" size={48} color="#cbd5e0" />
                            </View>
                        )}
                        {uploading && (
                            <View style={styles.uploadingOverlay}>
                                <ActivityIndicator size="large" color="#fff" />
                            </View>
                        )}
                        <View style={styles.cameraIcon}>
                            <Ionicons name="camera" size={20} color="#fff" />
                        </View>
                    </TouchableOpacity>
                    <Text style={styles.photoHint}>Tap to change photo</Text>
                </View>

                {/* Basic Info */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>BASIC INFORMATION</Text>

                    <View style={styles.inputContainer}>
                        <Ionicons name="person-outline" size={20} color="#667eea" />
                        <TextInput
                            style={styles.input}
                            placeholder="Full Name"
                            value={name}
                            onChangeText={setName}
                            placeholderTextColor="#999"
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Ionicons name="mail-outline" size={20} color="#667eea" />
                        <TextInput
                            style={[styles.input, styles.disabledInput]}
                            value={user?.email}
                            editable={false}
                            placeholderTextColor="#999"
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Ionicons name="call-outline" size={20} color="#667eea" />
                        <TextInput
                            style={styles.input}
                            placeholder="Phone Number"
                            value={phone}
                            onChangeText={setPhone}
                            keyboardType="phone-pad"
                            placeholderTextColor="#999"
                        />
                    </View>

                    <View style={[styles.inputContainer, styles.bioContainer]}>
                        <Ionicons name="document-text-outline" size={20} color="#667eea" style={styles.bioIcon} />
                        <TextInput
                            style={[styles.input, styles.bioInput]}
                            placeholder="Bio (Tell us about yourself)"
                            value={bio}
                            onChangeText={setBio}
                            multiline
                            numberOfLines={4}
                            placeholderTextColor="#999"
                        />
                    </View>
                </View>

                {/* Social Media */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>SOCIAL MEDIA</Text>

                    <View style={styles.inputContainer}>
                        <Ionicons name="logo-instagram" size={20} color="#E4405F" />
                        <TextInput
                            style={styles.input}
                            placeholder="Instagram username"
                            value={instagram}
                            onChangeText={setInstagram}
                            autoCapitalize="none"
                            placeholderTextColor="#999"
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Ionicons name="logo-twitter" size={20} color="#1DA1F2" />
                        <TextInput
                            style={styles.input}
                            placeholder="Twitter username"
                            value={twitter}
                            onChangeText={setTwitter}
                            autoCapitalize="none"
                            placeholderTextColor="#999"
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Ionicons name="logo-facebook" size={20} color="#4267B2" />
                        <TextInput
                            style={styles.input}
                            placeholder="Facebook profile"
                            value={facebook}
                            onChangeText={setFacebook}
                            autoCapitalize="none"
                            placeholderTextColor="#999"
                        />
                    </View>
                </View>

                {/* Danger Zone */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>DANGER ZONE</Text>
                    <TouchableOpacity style={styles.dangerButton} onPress={handleDeleteAccount}>
                        <Ionicons name="trash-outline" size={20} color="#ef4444" />
                        <Text style={styles.dangerText}>Delete Account</Text>
                    </TouchableOpacity>
                </View>

                <View style={{ height: 40 }} />
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
    saveButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.2)',
        minWidth: 60,
        alignItems: 'center',
    },
    saveText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },
    scrollView: {
        flex: 1,
    },
    photoSection: {
        alignItems: 'center',
        paddingVertical: 32,
    },
    photoContainer: {
        position: 'relative',
    },
    photo: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 4,
        borderColor: '#fff',
    },
    photoPlaceholder: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: '#fff',
    },
    uploadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: 60,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cameraIcon: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#667eea',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#fff',
    },
    photoHint: {
        marginTop: 12,
        fontSize: 14,
        fontWeight: '600',
        color: '#999',
    },
    section: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '800',
        color: '#999',
        letterSpacing: 1,
        marginBottom: 16,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    bioContainer: {
        alignItems: 'flex-start',
        paddingTop: 16,
    },
    bioIcon: {
        marginTop: 4,
    },
    input: {
        flex: 1,
        marginLeft: 12,
        fontSize: 16,
        fontWeight: '600',
        color: '#1a1a1a',
    },
    bioInput: {
        height: 100,
        textAlignVertical: 'top',
    },
    disabledInput: {
        color: '#999',
    },
    dangerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        borderRadius: 16,
        paddingVertical: 16,
        gap: 8,
        borderWidth: 2,
        borderColor: '#fee2e2',
    },
    dangerText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#ef4444',
    },
});
