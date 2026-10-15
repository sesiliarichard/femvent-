import { supabase } from './supabase';

export interface AppNotification {
    id: string;
    user_id: string;
    event_id: string | null;
    type: string;
    title: string;
    body: string | null;
    read: boolean;
    created_at: string;
}

export const fetchNotifications = async (userId: string): Promise<AppNotification[]> => {
    const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);
    if (error) {
        console.error('Error loading notifications:', error);
        return [];
    }
    return (data || []) as AppNotification[];
};

export const getUnreadCount = async (userId: string): Promise<number> => {
    const { count, error } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false);
    if (error) {
        console.error('Error counting notifications:', error);
        return 0;
    }
    return count || 0;
};

export const markRead = async (id: string): Promise<void> => {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
};

export const markAllRead = async (userId: string): Promise<void> => {
    await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false);
};

/** Calls onChange whenever this user's notifications change. Returns an unsubscribe function. */
export const subscribeToNotifications = (userId: string, onChange: () => void): (() => void) => {
    const channel = supabase
        .channel(`inbox-${userId}-${Math.random()}`)
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
            () => onChange()
        )
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
};