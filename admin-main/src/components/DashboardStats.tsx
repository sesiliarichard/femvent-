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
      icon: '🎯',
      gradient: 'from-violet-500 via-purple-500 to-purple-600',
      bgColor: 'bg-violet-50',
      textColor: 'text-violet-600',
      glowColor: 'shadow-violet-500/50',
      trend: {
        value: metrics.totalEvents > 0 ? ((metrics.activeEvents / metrics.totalEvents) * 100).toFixed(1) + '%' : '0%',
        label: 'active rate',
        direction: 'up'
      }
    },
    {
      name: 'Active Events',
      value: metrics.activeEvents.toLocaleString(),
      description: 'Currently running',
      icon: '👥',
      gradient: 'from-secondary-500 via-accent-500 to-rose-500',
      bgColor: 'bg-pink-50',
      textColor: 'text-secondary-600',
      glowColor: 'shadow-blue-500/50',
      trend: {
        value: metrics.upcomingEvents.toLocaleString(),
        label: 'upcoming',
        direction: 'up'
      }
    },
    {
      name: 'Total Revenue',
      value: `$${metrics.totalRevenue.toLocaleString()}`,
      description: 'From all ticket sales',
      icon: '💎',
      gradient: 'from-emerald-500 via-green-500 to-teal-600',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-600',
      glowColor: 'shadow-emerald-500/50',
      trend: {
        value: `$${(metrics.totalRevenue / Math.max(metrics.totalEvents, 1)).toFixed(2)}`,
        label: 'per event',
        direction: 'up'
      }
    },
    {
      name: 'Total Attendees',
      value: metrics.registeredAttendees.toLocaleString(),
      description: 'Registered users',
      icon: '⚡',
      gradient: 'from-amber-500 via-orange-500 to-red-500',
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-600',
      glowColor: 'shadow-amber-500/50',
      trend: {
        value: (metrics.registeredAttendees / Math.max(metrics.totalEvents, 1)).toFixed(1),
        label: 'per event',
        direction: 'up'
      }
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white/80 backdrop-blur-xl overflow-hidden shadow-2xl rounded-3xl animate-pulse border border-slate-200/50">
            <div className="p-8">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-12 w-12 bg-gray-200 rounded-2xl"></div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="mt-3 h-10 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((card, idx) => (
          <div
            key={card.name}
            className="group relative bg-white/80 backdrop-blur-xl rounded-3xl p-8 border border-slate-200/50 hover:border-slate-300/50 hover:shadow-2xl transition-all duration-500 cursor-pointer overflow-hidden"
            style={{
              animation: `slideUp 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) ${idx * 0.15}s backwards`
            }}
          >
            {/* Gradient overlay */}
            <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>

            {/* Glow effect on hover */}
            <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl ${card.glowColor}`}></div>

            {/* Animated mesh gradient background */}
            <div className="absolute -right-12 -bottom-12 w-40 h-40 opacity-30 group-hover:opacity-50 transition-opacity duration-700">
              <div className={`w-full h-full bg-gradient-to-br ${card.gradient} rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700`}></div>
            </div>

            <div className="relative z-10">
              {/* Icon and Trend */}
              <div className="flex items-start justify-between mb-6">
                <div className={`${card.bgColor} p-4 rounded-2xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg`}>
                  <span className="text-4xl">{card.icon}</span>
                </div>
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-sm ${card.trend.direction === 'up'
                  ? 'bg-emerald-50 text-emerald-600'
                  : 'bg-red-50 text-red-600'
                  }`}>
                  <svg className={`w-4 h-4 ${card.trend.direction === 'up' ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                  <span>{card.trend.value}</span>
                </div>
              </div>

              {/* Label */}
              <p className="text-purple-500 text-sm font-bold mb-3 tracking-wider uppercase">
                {card.name}
              </p>

              {/* Value */}
              <div className="flex items-baseline gap-1">
                <p className={`text-5xl font-black ${card.textColor} group-hover:scale-105 transition-transform duration-300`}>
                  {card.value}
                </p>
              </div>

              <p className="text-sm text-purple-500 mt-2">{card.description}</p>
              <p className="text-xs text-purple-400 mt-1">{card.trend.label}</p>

              {/* Progress bar */}
              <div className="mt-4 h-2 bg-pink-100 rounded-full overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${card.gradient} transition-all duration-1000 ease-out`}
                  style={{
                    width: `${Math.min(100, (parseFloat(card.value.replace(/[^0-9.]/g, '')) || 50))}%`,
                    animation: `growWidth 1.5s ease-out ${idx * 0.2}s backwards`
                  }}
                ></div>
              </div>
            </div>

            {/* Shine effect */}
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"></div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Event Growth Chart */}
        <div className="bg-white/80 backdrop-blur-xl overflow-hidden shadow-2xl rounded-3xl border border-slate-200/50 hover:shadow-3xl transition-all duration-500">
          <div className="p-10">
            <h3 className="text-3xl font-black text-slate-900 mb-2">
              Event Growth
            </h3>
            <div className="mt-2 flex justify-between items-center">
              <p className="text-sm text-purple-500 flex items-center gap-2">
                <span className="w-2 h-2 bg-gradient-to-r from-secondary-500 to-accent-500 rounded-full"></span>
                Last 30 days event creation trend
              </p>
              <div className="flex items-center space-x-4">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Active
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-secondary-800">
                  Upcoming
                </span>
              </div>
            </div>
            <div className="mt-4 h-48">
              {/* Chart placeholder - integrate a charting library here */}
              <div className="w-full h-full bg-gradient-to-br from-pink-50 to-purple-50/30 rounded-2xl flex items-center justify-center text-purple-400">
                Event Growth Chart
              </div>
            </div>
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="bg-white/80 backdrop-blur-xl overflow-hidden shadow-2xl rounded-3xl border border-slate-200/50 hover:shadow-3xl transition-all duration-500">
          <div className="p-10">
            <h3 className="text-3xl font-black text-slate-900 mb-2">
              Revenue Overview
            </h3>
            <div className="mt-2 flex justify-between items-center">
              <p className="text-sm text-purple-500 flex items-center gap-2">
                <span className="w-2 h-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"></span>
                Monthly revenue breakdown
              </p>
              <div className="flex items-center space-x-4">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  Ticket Sales
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  Sponsorships
                </span>
              </div>
            </div>
            <div className="mt-4 h-48">
              {/* Chart placeholder - integrate a charting library here */}
              <div className="w-full h-full bg-gradient-to-br from-pink-50 to-emerald-50/30 rounded-2xl flex items-center justify-center text-purple-400">
                Revenue Chart
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
