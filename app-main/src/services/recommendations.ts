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
            searchHistory: behaviorRow.search_history || [],
            categoryPreferences: behaviorRow.category_preferences || {},
            lastUpdated: behaviorRow.last_updated || new Date().toISOString(),
        };

        // Upcoming, non-cancelled events
        const { data: events, error: eventsError } = await supabase
            .from('events')
            .select('id, category, event_date, status')
            .gte('event_date', new Date().toISOString())
            .neq('status', 'cancelled');

        if (eventsError) throw eventsError;

        const upcoming = (events || []).filter((e: any) => e.status !== 'draft');
        if (upcoming.length === 0) return [];

        const registered = new Set(behavior.registeredEvents);
        const favorites = new Set(behavior.favoriteEvents);
        const viewedIds = behavior.eventViews.map((v) => v.eventId);

        // Build category weights from views (1), favorites (3) and registrations (5)
        const interactionIds = Array.from(
            new Set([...viewedIds, ...behavior.favoriteEvents, ...behavior.registeredEvents])
        );
        const categoryWeights: Record<string, number> = { ...behavior.categoryPreferences };

        if (interactionIds.length > 0) {
            const { data: past, error: pastError } = await supabase
                .from('events')
                .select('id, category')
                .in('id', interactionIds);

            if (pastError) throw pastError;

            const categoryById = new Map(
                (past || []).map((e: any): [string, string] => [e.id, e.category])
            );
            const bump = (id: string, weight: number) => {
                const category = categoryById.get(id);
                if (category) categoryWeights[category] = (categoryWeights[category] || 0) + weight;
            };

            viewedIds.forEach((id) => bump(id, 1));
            behavior.favoriteEvents.forEach((id) => bump(id, 3));
            behavior.registeredEvents.forEach((id) => bump(id, 5));
        }

        const maxWeight = Math.max(1, ...Object.values(categoryWeights));

        return upcoming
            .filter((e: any) => !registered.has(e.id) && !favorites.has(e.id))
            .map((e: any): Recommendation => {
                const weight = categoryWeights[e.category] || 0;
                return {
                    eventId: e.id,
                    score: weight / maxWeight,
                    reason: weight > 0 ? 'Based on your interests' : 'Upcoming event',
                };
            })
            .sort((a, b) => b.score - a.score)
            .slice(0, 10);
    } catch (error) {
        console.error('Error generating recommendations:', error);
        return [];
    }
};

/**
 * Fallback recommendations for new users
 */
const getPopularEvents = async (): Promise<Recommendation[]> => {
    try {
        const { data, error } = await supabase
            .from('events')
            .select('id, status')
            .gte('event_date', new Date().toISOString())
            .neq('status', 'cancelled')
            .order('event_date', { ascending: true })
            .limit(20);

        if (error) throw error;

        return (data || [])
            .filter((e: any) => e.status !== 'draft')
            .slice(0, 10)
            .map((e: any): Recommendation => ({
                eventId: e.id,
                score: 0.5,
                reason: 'Upcoming event',
            }));
    } catch (error) {
        console.error('Error getting popular events:', error);
        return [];
    }
};