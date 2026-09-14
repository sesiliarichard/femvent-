import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

interface DashboardMetrics {
  totalUsers: number;
  totalEvents: number;
  activeEvents: number;
  totalRevenue: number;
  upcomingEvents: number;
  completedEvents: number;
  registeredAttendees: number;
  averageEventRating: number;
  recentActivities: Activity[];
}

interface Activity {
  id: string;
  type: 'registration' | 'payment' | 'event_created' | 'event_updated';
  userId: string;
  userName: string;
  eventId?: string;
  eventTitle?: string;
  timestamp: Date;
  details: string;
}

export const DashboardStats: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalUsers: 0,
    totalEvents: 0,
    activeEvents: 0,
    totalRevenue: 0,
    upcomingEvents: 0,
    completedEvents: 0,
    registeredAttendees: 0,
    averageEventRating: 0,
    recentActivities: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserCount = async () => {
      const { count } = await supabase.from('users').select('*', { count: 'exact', head: true });
      setMetrics(prev => ({ ...prev, totalUsers: count || 0 }));
    };

    const loadEventMetrics = async () => {
      const { data } = await supabase.from('events').select('*');
      const now = new Date();
      let activeCount = 0;
      let upcomingCount = 0;
      let completedCount = 0;
      let totalAttendees = 0;

      (data || []).forEach((event: any) => {
        const eventDate = event.event_date ? new Date(event.event_date) : null;

        if (event.status === 'cancelled') {
          // not counted as active/upcoming/completed
        } else if (eventDate && eventDate < now) {
          completedCount++;
        } else if (eventDate && eventDate > now) {
          upcomingCount++;
        } else {
          activeCount++;
        }

        totalAttendees += event.tickets_sold || 0;
      });

      setMetrics(prev => ({
        ...prev,
        totalEvents: data?.length || 0,
        activeEvents: activeCount,
        upcomingEvents: upcomingCount,
        completedEvents: completedCount,
        registeredAttendees: totalAttendees,
      }));
    };

    const loadRevenue = async () => {
      const { data } = await supabase.from('payments').select('amount, status');
      const total = (data || []).reduce(
        (sum: number, p: any) => (p.status === 'completed' ? sum + p.amount : sum),
        0
      );
      setMetrics(prev => ({ ...prev, totalRevenue: total }));
    };

    const loadAll = async () => {
      await Promise.all([loadUserCount(), loadEventMetrics(), loadRevenue()]);
      setLoading(false);
    };

    loadAll();

    const channel = supabase
      .channel('dashboard-stats-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, loadUserCount)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, loadEventMetrics)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, loadRevenue)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const statsCards = [
    {
      name: 'Total Events',
      value: metrics.totalEvents.toLocaleString(),
      description: 'All events created',
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" strokeWidth={2} /><circle cx="12" cy="12" r="3" strokeWidth={2} /></svg>,
      iconBg: 'bg-primary-50',
      iconColor: 'text-primary-600',
      trend: {
        value: metrics.totalEvents > 0 ? ((metrics.activeEvents / metrics.totalEvents) * 100).toFixed(1) + '%' : '0%',
        label: 'active rate',
      }
    },
    {
      name: 'Active Events',
      value: metrics.activeEvents.toLocaleString(),
      description: 'Currently running',
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="9" cy="8" r="3" strokeWidth={2} /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2 20c0-3.3 3.1-6 7-6s7 2.7 7 6M17 8a3 3 0 010 6" /></svg>,
      iconBg: 'bg-secondary-50',
      iconColor: 'text-secondary-600',
      trend: {
        value: metrics.upcomingEvents.toLocaleString(),
        label: 'upcoming',
      }
    },
    {
      name: 'Total Revenue',
      value: `$${metrics.totalRevenue.toLocaleString()}`,
      description: 'From all ticket sales',
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      trend: {
        value: `$${(metrics.totalRevenue / Math.max(metrics.totalEvents, 1)).toFixed(2)}`,
        label: 'per event',
      }
    },
    {
      name: 'Total Attendees',
      value: metrics.registeredAttendees.toLocaleString(),
      description: 'Registered users',
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" /></svg>,
      iconBg: 'bg-accent-50',
      iconColor: 'text-accent-600',
      trend: {
        value: (metrics.registeredAttendees / Math.max(metrics.totalEvents, 1)).toFixed(1),
        label: 'per event',
      }
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 animate-pulse">
            <div className="h-11 w-11 bg-gray-100 rounded-xl mb-4"></div>
            <div className="h-3 bg-gray-100 rounded w-2/3 mb-3"></div>
            <div className="h-7 bg-gray-100 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((card) => (
          <div key={card.name} className="bg-white rounded-2xl p-6 border border-gray-100">
            <div className="flex items-start justify-between mb-5">
              <div className={`${card.iconBg} ${card.iconColor} p-3 rounded-xl`}>
                {card.icon}
              </div>
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-xs bg-emerald-50 text-emerald-600">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
                <span>{card.trend.value}</span>
              </div>
            </div>

            <p className="text-gray-400 text-xs font-bold mb-2 tracking-wide uppercase">{card.name}</p>
            <p className="text-3xl font-extrabold text-gray-900">{card.value}</p>
            <p className="text-xs text-gray-500 mt-2">{card.description}</p>
            <p className="text-xs text-gray-400 mt-0.5">{card.trend.label}</p>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Event Growth Chart */}
        <div className="bg-white rounded-2xl border border-gray-100 p-8">
          <h3 className="text-lg font-extrabold text-gray-900 mb-1">Event Growth</h3>
          <div className="flex justify-between items-center mt-2">
            <p className="text-xs text-gray-500 flex items-center gap-2">
              <span className="w-2 h-2 bg-secondary-500 rounded-full"></span>
              Last 30 days event creation trend
            </p>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">Active</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-secondary-50 text-secondary-700">Upcoming</span>
            </div>
          </div>
          <div className="mt-4 h-44 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 text-sm">
            Event Growth Chart
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="bg-white rounded-2xl border border-gray-100 p-8">
          <h3 className="text-lg font-extrabold text-gray-900 mb-1">Revenue Overview</h3>
          <div className="flex justify-between items-center mt-2">
            <p className="text-xs text-gray-500 flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
              Monthly revenue breakdown
            </p>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-accent-50 text-accent-700">Ticket Sales</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary-50 text-primary-700">Sponsorships</span>
            </div>
          </div>
          <div className="mt-4 h-44 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 text-sm">
            Revenue Chart
          </div>
        </div>
      </div>
    </div>
  );
};