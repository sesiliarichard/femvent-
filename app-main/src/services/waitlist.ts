import { supabase } from './supabase';

export interface WaitlistEntry {
    id: string;
    eventId: string;
    userId: string;
    userEmail: string;
    userName: string;
    joinedAt: string;
    notified: boolean;
    status: 'waiting' | 'notified' | 'converted';
}

const mapEntry = (row: any): WaitlistEntry => ({
    id: row.id,
    eventId: row.event_id,
    userId: row.user_id,
    userEmail: row.user_email,
    userName: row.user_name,
    joinedAt: row.joined_at,
    notified: row.notified,
    status: row.status,
});

/**
 * Join event waitlist
 */
export const joinWaitlist = async (
    eventId: string,
    userId: string,
    userEmail: string,
    userName: string
): Promise<WaitlistEntry> => {
    try {
        const existing = await checkWaitlistStatus(eventId, userId);
        if (existing) {
            throw new Error('Already on waitlist');
        }

        const { data, error } = await supabase
            .from('waitlist')
            .insert({
                event_id: eventId,
                user_id: userId,
                user_email: userEmail,
                user_name: userName,
            })
            .select()
            .single();

        if (error) throw error;

        return mapEntry(data);
    } catch (error) {
        console.error('Error joining waitlist:', error);
        throw error;
    }
};

/**
 * Leave waitlist
 */
export const leaveWaitlist = async (
    eventId: string,
    userId: string
): Promise<void> => {
    try {
        const { error } = await supabase
            .from('waitlist')
            .delete()
            .eq('event_id', eventId)
            .eq('user_id', userId);

        if (error) throw error;
    } catch (error) {
        console.error('Error leaving waitlist:', error);
        throw error;
    }
};

/**
 * Check if user is on waitlist
 */
export const checkWaitlistStatus = async (
    eventId: string,
    userId: string
): Promise<WaitlistEntry | null> => {
    try {
        const { data, error } = await supabase
            .from('waitlist')
            .select('*')
            .eq('event_id', eventId)
            .eq('user_id', userId)
            .maybeSingle();

        if (error) throw error;
        if (!data) return null;

        return mapEntry(data);
    } catch (error) {
        console.error('Error checking waitlist status:', error);
        return null;
    }
};

/**
 * Get user's position in waitlist
 */
export const getWaitlistPosition = async (
    eventId: string,
    userId: string
): Promise<number> => {
    try {
        const { data, error } = await supabase
            .from('waitlist')
            .select('user_id')
            .eq('event_id', eventId)
            .order('joined_at', { ascending: true });

        if (error) throw error;

        const index = (data || []).findIndex((row) => row.user_id === userId);
        return index === -1 ? -1 : index + 1;
    } catch (error) {
        console.error('Error getting waitlist position:', error);
        return -1;
    }
};

/**
 * Get waitlist count for event
 */
export const getWaitlistCount = async (eventId: string): Promise<number> => {
    try {
        const { count, error } = await supabase
            .from('waitlist')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', eventId);

        if (error) throw error;
        return count || 0;
    } catch (error) {
        console.error('Error getting waitlist count:', error);
        return 0;
    }
};