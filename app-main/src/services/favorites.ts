import { supabase } from './supabase';

export interface Favorite {
    id: string;
    userId: string;
    eventId: string;
    createdAt: string;
}

/**
 * Add an event to favorites
 */
export const addToFavorites = async (
    userId: string,
    eventId: string
): Promise<string | null> => {
    try {
        const existing = await isFavorited(userId, eventId);
        if (existing) {
            console.log('Event already favorited');
            return existing;
        }

        const { data, error } = await supabase
            .from('favorites')
            .insert({ user_id: userId, event_id: eventId })
            .select()
            .single();

        if (error) throw error;

        console.log('Added to favorites:', data.id);
        return data.id;
    } catch (error) {
        console.error('Error adding to favorites:', error);
        throw error;
    }
};

/**
 * Remove an event from favorites
 */
export const removeFromFavorites = async (
    userId: string,
    eventId: string
): Promise<void> => {
    try {
        const { error } = await supabase
            .from('favorites')
            .delete()
            .eq('user_id', userId)
            .eq('event_id', eventId);

        if (error) throw error;
        console.log('Removed from favorites');
    } catch (error) {
        console.error('Error removing from favorites:', error);
        throw error;
    }
};

/**
 * Check if an event is favorited by user
 * Returns the favorite ID if favorited, null otherwise
 */
export const isFavorited = async (
    userId: string,
    eventId: string
): Promise<string | null> => {
    try {
        const { data, error } = await supabase
            .from('favorites')
            .select('id')
            .eq('user_id', userId)
            .eq('event_id', eventId)
            .maybeSingle();

        if (error) throw error;

        return data?.id || null;
    } catch (error) {
        console.error('Error checking if favorited:', error);
        return null;
    }
};

/**
 * Get all favorite event IDs for a user
 */
export const getFavoriteEventIds = async (userId: string): Promise<string[]> => {
    try {
        const { data, error } = await supabase
            .from('favorites')
            .select('event_id')
            .eq('user_id', userId);

        if (error) throw error;

        return (data || []).map((row) => row.event_id);
    } catch (error) {
        console.error('Error getting favorites:', error);
        return [];
    }
};

/**
 * Subscribe to user's favorites in real-time
 */
export const subscribeToFavorites = (
    userId: string,
    callback: (eventIds: string[]) => void,
    onError?: (error: Error) => void
): (() => void) => {
    // Initial fetch
    getFavoriteEventIds(userId).then(callback);

    const channel = supabase
        .channel(`favorites-${userId}`)
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'favorites', filter: `user_id=eq.${userId}` },
            async () => {
                try {
                    const eventIds = await getFavoriteEventIds(userId);
                    callback(eventIds);
                } catch (error) {
                    onError?.(error as Error);
                }
            }
        )
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
};

/**
 * Toggle favorite status
 * Returns the new state (true if now favorited, false if removed)
 */
export const toggleFavorite = async (
    userId: string,
    eventId: string
): Promise<boolean> => {
    try {
        const favoriteId = await isFavorited(userId, eventId);

        if (favoriteId) {
            await removeFromFavorites(userId, eventId);
            return false;
        } else {
            await addToFavorites(userId, eventId);
            return true;
        }
    } catch (error) {
        console.error('Error toggling favorite:', error);
        throw error;
    }
};