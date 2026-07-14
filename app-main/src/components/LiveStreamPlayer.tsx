/**
 * Live Stream Player Component  
 * For watching live event streams
 */

import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Note: Agora SDK would be imported here
// import {
//   createAgoraRtcEngine,
//   RtcSurfaceView,
//   VideoRenderMode,
// } from 'react-native-agora';  // Correct package name

interface LiveStreamPlayerProps {
    streamId: string;
    eventId: string;
    channelName: string;
    onClose: () => void;
}

export const LiveStreamPlayer: React.FC<LiveStreamPlayerProps> = ({
    streamId,
    eventId,
    channelName,
    onClose,
}) => {
    const [loading, setLoading] = useState(true);
    const [viewerCount, setViewerCount] = useState(0);
    const [isLive, setIsLive] = useState(true);

    useEffect(() => {
        initializeStream();

        return () => {
            cleanup();
        };
    }, []);

    const initializeStream = async () => {
        try {
            // Initialize Agora engine
            // const engine = createAgoraRtcEngine();
            // await engine.initialize({ appId: AGORA_APP_ID });

            // Join channel as audience
            // await engine.joinChannel(token, channelName, null, 0);

            setLoading(false);
            setViewerCount(Math.floor(Math.random() * 100) + 10); // Mock data
        } catch (error) {
            console.error('Error initializing stream:', error);
            Alert.alert('Error', 'Failed to join live stream');
            setLoading(false);
        }
    };

    const cleanup = async () => {
        try {
            // Leave channel and destroy engine
            // await engine.leaveChannel();
            // await engine.release();
        } catch (error) {
            console.error('Error cleaning up stream:', error);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6366F1" />
                <Text style={styles.loadingText}>Connecting to live stream...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Close Button */}
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>

            {/* Live Badge */}
            <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE</Text>
            </View>

            {/* Viewer Count */}
            <View style={styles.viewerBadge}>
                <Ionicons name="eye" size={16} color="#FFFFFF" />
                <Text style={styles.viewerText}>{viewerCount}</Text>
            </View>

            {/* Video Player Container */}
            <View style={styles.videoContainer}>
                {/* Agora RtcSurfaceView would go here */}
                {/* <RtcSurfaceView
          canvas={{ uid: 0 }}
          renderMode={VideoRenderMode.Hidden}
        /> */}

                {/* Placeholder */}
                <View style={styles.placeholder}>
                    <Ionicons name="videocam" size={64} color="#FFFFFF" />
                    <Text style={styles.placeholderText}>Live Stream</Text>
                    <Text style={styles.placeholderSubtext}>
                        Agora SDK integration required
                    </Text>
                </View>
            </View>

            {/* Chat Overlay (optional) */}
            <View style={styles.chatContainer}>
                <Text style={styles.chatText}>Chat coming soon...</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000000',
    },
    loadingText: {
        color: '#FFFFFF',
        marginTop: 16,
        fontSize: 16,
    },
    closeButton: {
        position: 'absolute',
        top: 50,
        right: 20,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    liveBadge: {
        position: 'absolute',
        top: 50,
        left: 20,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EF4444',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        zIndex: 10,
    },
    liveDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#FFFFFF',
        marginRight: 6,
    },
    liveText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '700',
    },
    viewerBadge: {
        position: 'absolute',
        top: 90,
        left: 20,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        zIndex: 10,
    },
    viewerText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 4,
    },
    videoContainer: {
        flex: 1,
    },
    placeholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#1E293B',
    },
    placeholderText: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: '700',
        marginTop: 16,
    },
    placeholderSubtext: {
        color: '#94A3B8',
        fontSize: 14,
        marginTop: 8,
    },
    chatContainer: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 16,
        borderRadius: 12,
    },
    chatText: {
        color: '#FFFFFF',
        fontSize: 14,
    },
});

export default LiveStreamPlayer;
