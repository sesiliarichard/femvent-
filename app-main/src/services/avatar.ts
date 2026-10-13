import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { supabase } from './supabase';

/**
 * Lets the user pick a photo, uploads it to the "avatars" bucket,
 * and returns its public URL (or null if they cancelled).
 */
export const pickAndUploadAvatar = async (userId: string): Promise<string | null> => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
        throw new Error('Permission to access your photos was denied');
    }

    const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
    });

    if (result.canceled) return null;

    const asset = result.assets[0];
    if (!asset.base64) throw new Error('Could not read the selected image');

    const path = `${userId}/avatar.jpg`;

    const { error } = await supabase.storage
        .from('avatars')
        .upload(path, decode(asset.base64), {
            contentType: asset.mimeType || 'image/jpeg',
            upsert: true,
        });

    if (error) throw error;

    const { data } = supabase.storage.from('avatars').getPublicUrl(path);

     // Cache-buster so the new picture shows right away
     const url = `${data.publicUrl}?t=${Date.now()}`;

     const { error: updateError } = await supabase
         .from('users')
         .update({ photo_url: url })
         .eq('id', userId);
 
     if (updateError) throw updateError;
 
     return url;
};