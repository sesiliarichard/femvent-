import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

const CACHE_KEYS = {
    EVENTS: 'cached_events',
    TICKETS: 'cached_tickets',
    USER_PROFILE: 'cached_user_profile',
    LAST_SYNC: 'last_sync_timestamp',
};

export interface CacheMetadata {
    timestamp: number;
    data: any;
}

/**
 * Check if device is online
 */
export const isOnline = async (): Promise<boolean> => {
    const state = await NetInfo.fetch();
    return state.isConnected ?? false;
};

/**
 * Cache data with timestamp
 */
export const cacheData = async (key: string, data: any): Promise<void> => {
    try {
        const cacheItem: CacheMetadata = {
            timestamp: Date.now(),
            data,
        };
        await AsyncStorage.setItem(key, JSON.stringify(cacheItem));
    } catch (error) {
        console.error('Error caching data:', error);
    }
};

/**
 * Get cached data
 */
export const getCachedData = async <T>(
    key: string,
    maxAge?: number
): Promise<T | null> => {
    try {
        const cached = await AsyncStorage.getItem(key);
        if (!cached) return null;

        const cacheItem: CacheMetadata = JSON.parse(cached);

        // Check if cache is expired
        if (maxAge && Date.now() - cacheItem.timestamp > maxAge) {
            await AsyncStorage.removeItem(key);
            return null;
        }

        return cacheItem.data as T;
    } catch (error) {
        console.error('Error getting cached data:', error);
        return null;
    }
};

/**
 * Clear all cached data
 */
export const clearCache = async (): Promise<void> => {
    try {
        const keys = Object.values(CACHE_KEYS);
        await AsyncStorage.multiRemove(keys);
    } catch (error) {
        console.error('Error clearing cache:', error);
    }
};

/**
 * Cache events data
 */
export const cacheEvents = async (events: any[]): Promise<void> => {
    await cacheData(CACHE_KEYS.EVENTS, events);
};

/**
 * Get cached events
 */
export const getCachedEvents = async (): Promise<any[] | null> => {
    // Cache valid for 1 hour
    return getCachedData<any[]>(CACHE_KEYS.EVENTS, 60 * 60 * 1000);
};

/**
 * Cache user tickets
 */
export const cacheTickets = async (tickets: any[]): Promise<void> => {
    await cacheData(CACHE_KEYS.TICKETS, tickets);
};

/**
 * Get cached tickets
 */
export const getCachedTickets = async (): Promise<any[] | null> => {
    // Tickets cache valid for 30 minutes
    return getCachedData<any[]>(CACHE_KEYS.TICKETS, 30 * 60 * 1000);
};

/**
 * Cache user profile
 */
export const cacheUserProfile = async (profile: any): Promise<void> => {
    await cacheData(CACHE_KEYS.USER_PROFILE, profile);
};

/**
 * Get cached user profile
 */
export const getCachedUserProfile = async (): Promise<any | null> => {
    return getCachedData<any>(CACHE_KEYS.USER_PROFILE);
};

/**
 * Update last sync timestamp
 */
export const updateLastSync = async (): Promise<void> => {
    await AsyncStorage.setItem(CACHE_KEYS.LAST_SYNC, Date.now().toString());
};

/**
 * Get last sync timestamp
 */
export const getLastSync = async (): Promise<number | null> => {
    try {
        const timestamp = await AsyncStorage.getItem(CACHE_KEYS.LAST_SYNC);
        return timestamp ? parseInt(timestamp) : null;
    } catch (error) {
        console.error('Error getting last sync:', error);
        return null;
    }
};

/**
 * Listen to network status changes
 */
export const subscribeToNetworkStatus = (
    callback: (isConnected: boolean) => void
): (() => void) => {
    const unsubscribe = NetInfo.addEventListener((state) => {
        callback(state.isConnected ?? false);
    });

    return unsubscribe;
};
