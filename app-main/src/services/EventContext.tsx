import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

    useEffect(() => {
        (async () => {
            try {
                const saved = await AsyncStorage.getItem(STORAGE_KEY);
                if (saved) setCurrentEventState(JSON.parse(saved));
            } catch (error) {
                console.warn('Failed to load current event:', error);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

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