import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { AppState } from 'react-native';
import { useAuth } from './AuthContext';

export interface ActiveEvent {
    id: string;
    title: string;
}

interface EventContextType {
    currentEvent: ActiveEvent | null;
    setCurrentEvent: (event: ActiveEvent | null) => Promise<void>;
    loading: boolean;
}

const EventContext = createContext<EventContextType | undefined>(undefined);

const STORAGE_KEY = 'current_event_v1';

export const EventProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [currentEvent, setCurrentEventState] = useState<ActiveEvent | null>(null);
    const [loading, setLoading] = useState(true);
    const { user, loading: authLoading } = useAuth();

    useEffect(() => {
        if (authLoading) return;
        (async () => {
            try {
                const saved = await AsyncStorage.getItem(STORAGE_KEY);
                if (!saved) return;

                // Logged out: never keep a previous user's event
                if (!user?.id) {
                    await AsyncStorage.removeItem(STORAGE_KEY);
                    setCurrentEventState(null);
                    return;
                }

                const parsed: ActiveEvent = JSON.parse(saved);
                const { data, error } = await supabase
                    .from('tickets')
                    .select('id')
                    .eq('user_id', user.id)
                    .eq('event_id', parsed.id)
                    .in('status', ['confirmed', 'pending'])
                    .limit(1);

                // Ticket deleted or cancelled: forget the saved event
                if (!error && (!data || data.length === 0)) {
                    await AsyncStorage.removeItem(STORAGE_KEY);
                    setCurrentEventState(null);
                    return;
                }

                setCurrentEventState(parsed);
            } catch (error) {
                console.warn('Failed to load current event:', error);
            } finally {
                setLoading(false);
            }
        })();
    }, [user?.id, authLoading]);

    // Re-check the saved event every time the app returns to the foreground
    useEffect(() => {
        if (!user?.id || !currentEvent) return;
        const sub = AppState.addEventListener('change', async (state) => {
            if (state !== 'active') return;
            const { data, error } = await supabase
                .from('tickets')
                .select('id')
                .eq('user_id', user.id)
                .eq('event_id', currentEvent.id)
                .in('status', ['confirmed', 'pending'])
                .limit(1);
            if (!error && (!data || data.length === 0)) {
                await AsyncStorage.removeItem(STORAGE_KEY);
                setCurrentEventState(null);
            }
        });
        return () => sub.remove();
    }, [user?.id, currentEvent?.id]);

    const setCurrentEvent = async (event: ActiveEvent | null) => {
        setCurrentEventState(event);
        try {
            if (event) {
                await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(event));
            } else {
                await AsyncStorage.removeItem(STORAGE_KEY);
            }
        } catch (error) {
            console.warn('Failed to persist current event:', error);
        }
    };

    return (
        <EventContext.Provider value={{ currentEvent, setCurrentEvent, loading }}>
            {children}
        </EventContext.Provider>
    );
};

export const useCurrentEvent = (): EventContextType => {
    const ctx = useContext(EventContext);
    if (!ctx) throw new Error('useCurrentEvent must be used within an EventProvider');
    return ctx;
};