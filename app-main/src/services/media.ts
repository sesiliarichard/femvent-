import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';
import { supabase } from './supabase';
import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system';

/**
 * Request camera and media library permissions
 */
export const requestMediaPermissions = async (): Promise<boolean> => {
    try {
        const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
        const mediaPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (cameraPermission.status !== 'granted' || mediaPermission.status !== 'granted') {
            Alert.alert(
                'Permission Required',
                'Please enable camera and photo library access in your device settings.',
                [{ text: 'OK' }]
            );
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error requesting media permissions:', error);
        return false;
    }
};

/**
 * Pick image from library
 */
export const pickImage = async (): Promise<string | null> => {
    try {
        const hasPermission = await requestMediaPermissions();
        if (!hasPermission) return null;

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            return result.assets[0].uri;
        }

        return null;
    } catch (error) {
        console.error('Error picking image:', error);
        return null;
    }
};

/**
 * Take photo with camera
 */
export const takePhoto = async (): Promise<string | null> => {
    try {
        const hasPermission = await requestMediaPermissions();
        if (!hasPermission) return null;

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            return result.assets[0].uri;
        }

        return null;
    } catch (error) {
        console.error('Error taking photo:', error);
        return null;
    }
};

/**
 * Upload image to Supabase Storage
 */
export const uploadProfilePhoto = async (
    uri: string,
    userId: string
): Promise<string | null> => {
    try {
        // Read file as base64 (React Native fetch->blob can be unreliable with Supabase Storage)
        const base64 = await FileSystem.readAsStringAsync(uri, {
            encoding: FileSystem.EncodingType.Base64,
        });

        const filePath = `${userId}/${Date.now()}.jpg`;

        const { error: uploadError } = await supabase.storage
            .from('profile-photos')
            .upload(filePath, decode(base64), {
                contentType: 'image/jpeg',
                upsert: true,
            });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
            .from('profile-photos')
            .getPublicUrl(filePath);

        return data.publicUrl;
    } catch (error) {
        console.error('Error uploading profile photo:', error);
        Alert.alert('Error', 'Failed to upload photo. Please try again.');
        return null;
    }
};

/**
 * Show image picker options
 */
export const showImagePickerOptions = (): Promise<string | null> => {
    return new Promise((resolve) => {
        Alert.alert(
            'Profile Photo',
            'Choose an option',
            [
                {
                    text: 'Take Photo',
                    onPress: async () => {
                        const uri = await takePhoto();
                        resolve(uri);
                    },
                },
                {
                    text: 'Choose from Library',
                    onPress: async () => {
                        const uri = await pickImage();
                        resolve(uri);
                    },
                },
                {
                    text: 'Cancel',
                    style: 'cancel',
                    onPress: () => resolve(null),
                },
            ]
        );
    });
};