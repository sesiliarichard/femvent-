/**
 * AI Recommendations Service
 * Generates personalized event recommendations based on user behavior
 */

import { supabase } from './supabase';

export interface UserBehavior {
    userId: string;
    eventViews: { eventId: string; timestamp: string }[];
    favoriteEvents: string[];
    registeredEvents: string[];
    searchHistory: string[];
    categoryPreferences: { [category: string]: number };
    lastUpdated: string;
}

export interface Recommendation {
    eventId: string;
    score: number;
    reason: string; // "Similar to X" | "Popular in your area" | "Based on your interests"
}

/**
 * Track event view for recommendations
 */
export const trackEventView = async (
    userId: string,
    eventId: string
): Promise<void> => {
    try {
        const { data: existing, error: fetchError } = await supabase
            .from('user_behavior')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();

        if (fetchError) throw fetchError;

        if (existing) {
            let eventViews = existing.event_views || [];
            eventViews.push({ eventId, timestamp: new Date().toISOString() });

            // Keep only last 50 views
            if (eventViews.length > 50) {
                eventViews = eventViews.slice(-50);
            }

            const { error } = await supabase
                .from('user_behavior')
                .update({
                    event_views: eventViews,
                    last_updated: new Date().toISOString(),
                })
                .eq('user_id', userId);

            if (error) throw error;
        } else {
            const { error } = await supabase.from('user_behavior').insert({
                user_id: userId,
                event_views: [{ eventId, timestamp: new Date().toISOString() }],
                favorite_events: [],
                registered_events: [],
                search_history: [],
                category_preferences: {},
            });

            if (error) throw error;
        }
    } catch (error) {
        console.error('Error tracking event view:', error);
    }
};

/**
 * Track favorite event
 */
export const trackFavorite = async (
    userId: string,
    eventId: string,
    add: boolean
): Promise<void> => {
    try {
        const { data: existing, error: fetchError } = await supabase
            .from('user_behavior')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();

        if (fetchError) throw fetchError;
        if (!existing) return;

        let favoriteEvents: string[] = existing.favorite_events || [];

        if (add) {
            if (!favoriteEvents.includes(eventId)) {
                favoriteEvents.push(eventId);
            }
        } else {
            favoriteEvents = favoriteEvents.filter((id) => id !== eventId);
        }

        const { error } = await supabase
            .from('user_behavior')
            .update({
                favorite_events: favoriteEvents,
                last_updated: new Date().toISOString(),
            })
            .eq('user_id', userId);

        if (error) throw error;
    } catch (error) {
        console.error('Error tracking favorite:', error);
    }
};

/**
 * Get personalized recommendations for user
 */
export const getRecommendations = async (
    userId: string
): Promise<Recommendation[]> => {
    try {
        // Check cache first
        const { data: cache, error: cacheError } = await supabase
            .from('recommendations_cache')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();

        if (cacheError) throw cacheError;

        if (cache) {
            const cacheAge = Date.now() - new Date(cache.generated_at).getTime();

            // Use cache if less than 6 hours old
            if (cacheAge < 6 * 60 * 60 * 1000) {
                return cache.recommendations as Recommendation[];
            }
        }

        // Generate new recommendations
        const recommendations = await generateRecommendations(userId);

        // Cache the results (upsert since user_id is primary key)
        const { error: upsertError } = await supabase
            .from('recommendations_cache')
            .upsert({
                user_id: userId,
                recommendations,
                generated_at: new Date().toISOString(),
            });

        if (upsertError) throw upsertError;

        return recommendations;
    } catch (error) {
        console.error('Error getting recommendations:', error);
        return [];
    }
};

/**
 * Generate recommendations using hybrid approach
 */
const generateRecommendations = async (
    userId: string
): Promise<Recommendation[]> => {
    try {
        const { data: behaviorRow, error } = await supabase
            .from('user_behavior')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();

        if (error) throw error;

        if (!behaviorRow) {
            // Return popular events for new users
            return await getPopularEvents();
        }

        const behavior: UserBehavior = {
            userId,
            eventViews: behaviorRow.event_views || [],
            favoriteEvents: behaviorRow.favorite_events || [],
            registeredEvents: behaviorRow.registered_events || [],