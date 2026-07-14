/**
 * Recording Upload & Playback Service
 * 
 * Feature 11 Completion: Upload recordings to Firebase Storage
 * and provide secure playback links
 */

import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db } from '@/lib/firebase';
import { collection, addDoc, updateDoc, doc, Timestamp, getDoc, getDocs, query, where, limit, orderBy } from 'firebase/firestore';

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
        const storage = getStorage();
        const fileName = `recordings/${eventId}/${Date.now()}-${file.name}`;
        const storageRef = ref(storage, fileName);

        // Create recording document first
        const recordingData = {
            eventId,
            virtualEventId,
            title: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
            duration: 0, // Will be updated after processing
            fileSize: file.size,
            format: file.type.includes('mp4') ? 'mp4' : 'webm',
            storageProvider: 'firebase' as const,
            videoUrl: '',
            downloadUrl: '',
            thumbnailUrl: '',
            accessType: 'ticket_holders' as const,
            status: 'processing' as const,
            processingProgress: 0,
            stats: {
                views: 0,
                downloads: 0,
                averageWatchTime: 0,
                completionRate: 0
            },
            recordedAt: Timestamp.now(),
            uploadedAt: Timestamp.now(),
            createdAt: Timestamp.now()
        };

        const recordingDoc = await addDoc(collection(db, 'eventRecordings'), recordingData);

        // Upload file with progress tracking
        const uploadTask = uploadBytesResumable(storageRef, file);

        return new Promise((resolve, reject) => {
            uploadTask.on(
                'state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;

                    if (onProgress) {
                        onProgress({
                            progress,
                            bytesTransferred: snapshot.bytesTransferred,
                            totalBytes: snapshot.totalBytes
                        });
                    }

                    // Update progress in DB
                    updateDoc(doc(db, 'eventRecordings', recordingDoc.id), {
                        processingProgress: Math.round(progress)
                    });
                },
                (error) => {
                    console.error('Upload error:', error);
                    updateDoc(doc(db, 'eventRecordings', recordingDoc.id), {
                        status: 'failed'
                    });
                    reject(error);
                },
                async () => {
                    // Upload complete - get download URL
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

                    await updateDoc(doc(db, 'eventRecordings', recordingDoc.id), {
                        videoUrl: downloadURL,
                        downloadUrl: downloadURL,
                        status: 'ready',
                        processingProgress: 100,
                        publishedAt: Timestamp.now()
                    });

                    resolve(recordingDoc.id);
                }
            );
        });
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
        // Get recording details
        const recordingDoc = await getDoc(doc(db, 'eventRecordings', recordingId));
        if (!recordingDoc.exists()) {
            throw new Error('Recording not found');
        }

        const recording = recordingDoc.data();

        // Check access permissions
        if (recording.accessType === 'ticket_holders') {
            // Verify user has ticket
            const ticketsRef = collection(db, 'tickets');
            const ticketQuery = query(
                ticketsRef,
                where('eventId', '==', recording.eventId),
                where('userId', '==', userId),
                where('status', '==', 'confirmed')
            );
            const ticketSnapshot = await getDocs(ticketQuery);

            if (ticketSnapshot.empty) {
                throw new Error('Access denied: No valid ticket found');
            }
        }

        // Check if recording has expired
        if (recording.expiresAt && recording.expiresAt.toDate() < new Date()) {
            throw new Error('Recording has expired');
        }

        // Log view
        await addDoc(collection(db, 'recordingViews'), {
            recordingId,
            userId,
            sessionId: `session-${Date.now()}`,
            watchTime: 0,
            completed: false,
            progress: 0,
            device: 'desktop', // Detect from user agent
            viewedAt: Timestamp.now()
        });

        // Update view count
        await updateDoc(doc(db, 'eventRecordings', recordingId), {
            'stats.views': (recording.stats?.views || 0) + 1
        });

        return {
            url: recording.videoUrl,
            canDownload: recording.accessType !== 'paid' // Paid recordings can't be downloaded
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
    watchTime: number, // seconds watched
    totalDuration: number // total video duration
): Promise<void> {
    try {
        const progress = (watchTime / totalDuration) * 100;
        const completed = progress >= 90; // 90% = completed

        // Find or create view record
        const viewsQuery = query(
            collection(db, 'recordingViews'),
            where('recordingId', '==', recordingId),
            where('userId', '==', userId),
            orderBy('viewedAt', 'desc'),
            limit(1)
        );

        const viewSnapshot = await getDocs(viewsQuery);

        if (!viewSnapshot.empty) {
            const viewDoc = viewSnapshot.docs[0];
            await updateDoc(doc(db, 'recordingViews', viewDoc.id), {
                watchTime,
                progress,
                completed
            });
        }
    } catch (error) {
        console.error('Error tracking playback:', error);
    }
}
