/**
 * Recording Upload & Playback Service
 * 
 * Feature 11 Completion: Upload recordings to Firebase Storage
 * and provide secure playback links
 */

import { supabase } from '@/lib/supabase';

interface UploadProgress {
    progress: number; // 0-100
    bytesTransferred: number;
    totalBytes: number;
}

/**
 * Upload recording to Firebase Storage
 */
export async function uploadRecording(
    file: File,
    eventId: string,
    virtualEventId: string,
    onProgress?: (progress: UploadProgress) => void
): Promise<string> {
    try {
        const fileName = `recordings/${eventId}/${Date.now()}-${file.name}`;

        // Create recording record first
        const { data: recording, error: insertError } = await supabase
            .from('event_recordings')
            .insert({
                event_id: eventId,
                virtual_event_id: virtualEventId,
                title: file.name.replace(/\.[^/.]+$/, ''),
                duration: 0,
                file_size: file.size,
                format: file.type.includes('mp4') ? 'mp4' : 'webm',
                storage_provider: 'supabase',
                video_url: '',
                download_url: '',
                thumbnail_url: '',
                access_type: 'ticket_holders',
                status: 'processing',
                processing_progress: 0,
                stats: {
                    views: 0,
                    downloads: 0,
                    averageWatchTime: 0,
                    completionRate: 0
                },
                recorded_at: new Date().toISOString(),
                uploaded_at: new Date().toISOString(),
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (insertError || !recording) throw insertError || new Error('Failed to create recording record');

        // Upload file to Supabase Storage
        // Note: supabase-js does not emit native progress events, so onProgress
        // is only called at start (0%) and completion (100%).
        if (onProgress) {
            onProgress({ progress: 0, bytesTransferred: 0, totalBytes: file.size });
        }

        const { error: uploadError } = await supabase.storage
            .from('recordings')
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (uploadError) {
            await supabase
                .from('event_recordings')
                .update({ status: 'failed' })
                .eq('id', recording.id);
            throw uploadError;
        }

        if (onProgress) {
            onProgress({ progress: 100, bytesTransferred: file.size, totalBytes: file.size });
        }

        const { data: urlData } = supabase.storage
            .from('recordings')
            .getPublicUrl(fileName);

        const downloadURL = urlData.publicUrl;

        await supabase
            .from('event_recordings')
            .update({
                video_url: downloadURL,
                download_url: downloadURL,
                status: 'ready',
                processing_progress: 100,
                published_at: new Date().toISOString()
            })
            .eq('id', recording.id);

        return recording.id;
    } catch (error) {
        console.error('Error uploading recording:', error);
        throw error;
    }
}
/**
 * Get recording playback URL with access verification
 */
export async function getPlaybackURL(
    recordingId: string,
    userId: string
): Promise<{ url: string; canDownload: boolean }> {
    try {
        const { data: recording, error: recordingError } = await supabase
            .from('event_recordings')
            .select('*')
            .eq('id', recordingId)
            .single();

        if (recordingError || !recording) {
            throw new Error('Recording not found');
        }

        if (recording.access_type === 'ticket_holders') {
            const { data: tickets, error: ticketError } = await supabase
                .from('tickets')
                .select('id')
                .eq('event_id', recording.event_id)
                .eq('user_id', userId)
                .eq('status', 'confirmed');

            if (ticketError || !tickets || tickets.length === 0) {
                throw new Error('Access denied: No valid ticket found');
            }
        }

        if (recording.expires_at && new Date(recording.expires_at) < new Date()) {
            throw new Error('Recording has expired');
        }

        await supabase
            .from('recording_views')
            .insert({
                recording_id: recordingId,
                user_id: userId,
                session_id: `session-${Date.now()}`,
                watch_time: 0,
                completed: false,
                progress: 0,
                device: 'desktop',
                viewed_at: new Date().toISOString()
            });

        await supabase
            .from('event_recordings')
            .update({
                stats: {
                    ...recording.stats,
                    views: (recording.stats?.views || 0) + 1
                }
            })
            .eq('id', recordingId);

        return {
            url: recording.video_url,
            canDownload: recording.access_type !== 'paid'
        };
    } catch (error) {
        console.error('Error getting playback URL:', error);
        throw error;
    }
}
/**
 * Track playback progress
 */
export async function trackPlaybackProgress(
    recordingId: string,
    userId: string,
    watchTime: number,
    totalDuration: number
): Promise<void> {
    try {
        const progress = (watchTime / totalDuration) * 100;
        const completed = progress >= 90;

        const { data: views, error: viewsError } = await supabase
            .from('recording_views')
            .select('id')
            .eq('recording_id', recordingId)
            .eq('user_id', userId)
            .order('viewed_at', { ascending: false })
            .limit(1);

        if (viewsError) throw viewsError;

        if (views && views.length > 0) {
            await supabase
                .from('recording_views')
                .update({
                    watch_time: watchTime,
                    progress,
                    completed
                })
                .eq('id', views[0].id);
        }
    } catch (error) {
        console.error('Error tracking playback:', error);
    }
}