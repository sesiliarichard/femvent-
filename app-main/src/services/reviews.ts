/**
 * Review Service
 * Handles event reviews and ratings
 */

import { supabase } from './supabase';

export interface EventReview {
    id: string;
    eventId: string;
    userId: string;
    userName: string;
    userPhotoURL?: string;
    rating: number; // 1-5
    review: string;
    createdAt: string;
    helpful: number;
    flagged: boolean;
    verified: boolean; // User attended event
}

const mapReview = (row: any): EventReview => ({
    id: row.id,
    eventId: row.event_id,
    userId: row.user_id,
    userName: row.user_name,
    userPhotoURL: row.user_photo_url,
    rating: row.rating,
    review: row.review,
    createdAt: row.created_at,
    helpful: row.helpful,
    flagged: row.flagged,
    verified: row.verified,
});

/**
 * Submit event review
 */
export const submitReview = async (
    eventId: string,
    userId: string,
    userName: string,
    userPhotoURL: string | undefined,
    rating: number,
    reviewText: string
): Promise<EventReview> => {
    try {
        const existing = await getUserReview(eventId, userId);
        if (existing) {
            throw new Error('You have already reviewed this event');
        }

        const verified = await checkEventAttendance(eventId, userId);

        const { data, error } = await supabase
            .from('event_reviews')
            .insert({
                event_id: eventId,
                user_id: userId,
                user_name: userName,
                user_photo_url: userPhotoURL,
                rating,
                review: reviewText,
                verified,
            })
            .select()
            .single();

        if (error) throw error;

        await updateEventRating(eventId, rating);

        return mapReview(data);
    } catch (error) {
        console.error('Error submitting review:', error);
        throw error;
    }
};

/**
 * Get all reviews for an event
 */
export const getEventReviews = async (
    eventId: string,
    sortBy: 'recent' | 'helpful' | 'rating' = 'recent'
): Promise<EventReview[]> => {
    try {
        const sortColumn = sortBy === 'recent' ? 'created_at' : sortBy === 'helpful' ? 'helpful' : 'rating';

        const { data, error } = await supabase
            .from('event_reviews')
            .select('*')
            .eq('event_id', eventId)
            .eq('flagged', false)
            .order(sortColumn, { ascending: false });

        if (error) throw error;

        return (data || []).map(mapReview);
    } catch (error) {
        console.error('Error fetching reviews:', error);
        return [];
    }
};

/**
 * Get user's review for an event
 */
export const getUserReview = async (
    eventId: string,
    userId: string
): Promise<EventReview | null> => {
    try {
        const { data, error } = await supabase
            .from('event_reviews')
            .select('*')
            .eq('event_id', eventId)
            .eq('user_id', userId)
            .maybeSingle();

        if (error) throw error;
        if (!data) return null;

        return mapReview(data);
    } catch (error) {
        console.error('Error fetching user review:', error);
        return null;
    }
};

/**
 * Mark review as helpful
 */
export const markReviewHelpful = async (reviewId: string): Promise<void> => {
    try {
        const { data: current, error: fetchError } = await supabase
            .from('event_reviews')
            .select('helpful')
            .eq('id', reviewId)
            .single();

        if (fetchError) throw fetchError;

        const { error } = await supabase
            .from('event_reviews')
            .update({ helpful: (current?.helpful || 0) + 1 })
            .eq('id', reviewId);

        if (error) throw error;
    } catch (error) {
        console.error('Error marking review as helpful:', error);
        throw error;
    }
};

/**
 * Flag review as inappropriate
 */
export const flagReview = async (reviewId: string): Promise<void> => {
    try {
        const { error } = await supabase
            .from('event_reviews')
            .update({ flagged: true })
            .eq('id', reviewId);

        if (error) throw error;
    } catch (error) {
        console.error('Error flagging review:', error);
        throw error;
    }
};

/**
 * Update event rating statistics
 */
const updateEventRating = async (eventId: string, newRating: number): Promise<void> => {
    try {
        const { data: event, error: fetchError } = await supabase
            .from('events')
            .select('average_rating, total_reviews, rating_distribution')
            .eq('id', eventId)
            .single();

        if (fetchError || !event) return;

        const currentTotal = event.total_reviews || 0;
        const currentAverage = event.average_rating || 0;
        const ratingDist = event.rating_distribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

        const newTotal = currentTotal + 1;
        const newAverage = ((currentAverage * currentTotal) + newRating) / newTotal;

        ratingDist[newRating] = (ratingDist[newRating] || 0) + 1;

        const { error } = await supabase
            .from('events')
            .update({
                average_rating: newAverage,
                total_reviews: newTotal,
                rating_distribution: ratingDist,
            })
            .eq('id', eventId);

        if (error) throw error;
    } catch (error) {
        console.error('Error updating event rating:', error);
    }
};

/**
 * Check if user attended the event
 */
const checkEventAttendance = async (eventId: string, userId: string): Promise<boolean> => {
    try {
        const { data, error } = await supabase
            .from('tickets')
            .select('id')
            .eq('event_id', eventId)
            .eq('user_id', userId)
            .eq('status', 'confirmed')
            .limit(1)
            .maybeSingle();

        if (error) throw error;
        return !!data;
    } catch (error) {
        console.error('Error checking attendance:', error);
        return false;
    }
};

/**
 * Get review statistics for event
 */
export const getReviewStats = async (eventId: string) => {
    try {
        const { data, error } = await supabase
            .from('events')
            .select('average_rating, total_reviews, rating_distribution')
            .eq('id', eventId)
            .single();

        if (error || !data) {
            return {
                averageRating: 0,
                totalReviews: 0,
                ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
            };
        }

        return {
            averageRating: data.average_rating || 0,
            totalReviews: data.total_reviews || 0,
            ratingDistribution: data.rating_distribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        };
    } catch (error) {
        console.error('Error fetching review stats:', error);
        return {
            averageRating: 0,
            totalReviews: 0,
            ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        };
    }
};