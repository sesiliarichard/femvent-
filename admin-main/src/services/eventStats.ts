import { useState, useEffect } from 'react';
import { supabase } from './supabase';

export interface EventStats {
  loading: boolean;
  totalEvents: number;
  activeEvents: number;
  upcomingEvents: number;
  totalAttendees: number;
}

export const useEventStats = () => {
  const [stats, setStats] = useState<EventStats>({
    loading: true,
    totalEvents: 0,
    activeEvents: 0,
    upcomingEvents: 0,
    totalAttendees: 0,
  });

  useEffect(() => {
    const calculateStats = async () => {
      try {
        const { data, error } = await supabase.from('events').select('*');
        if (error) throw error;

        const now = new Date();
        let totalEvents = 0;
        let activeEvents = 0;
        let upcomingEvents = 0;
        let totalAttendees = 0;

        (data || []).forEach((event: any) => {
          totalEvents++;

          const eventDate = new Date(event.event_date);
          const isUpcoming = eventDate > now;
          const isActive = event.status === 'published';

          if (isActive) activeEvents++;
          if (isUpcoming) upcomingEvents++;

          totalAttendees += event.tickets_sold || 0;
        });

        setStats({
          loading: false,
          totalEvents,
          activeEvents,
          upcomingEvents,
          totalAttendees,
        });
      } catch (error) {
        console.error('Error loading event stats:', error);
        setStats({
          loading: false,
          totalEvents: 0,
          activeEvents: 0,
          upcomingEvents: 0,
          totalAttendees: 0,
        });
      }
    };

    calculateStats();

    // Re-run whenever any event changes (real-time)
    const channel = supabase
      .channel('events-stats-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => {
        calculateStats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return stats;
};