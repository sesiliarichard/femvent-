/**
 * DASHBOARD PAGE (/dashboard)
 */
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';

function toDate(value: any): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value?.toDate === 'function') {
    try {
      return value.toDate();
    } catch {
      return null;
    }
  }
  if (value?.seconds) {
    return new Date(value.seconds * 1000);
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

import ProtectedRoute from '@/components/ProtectedRoute';

function DashboardContent() {
  const { userProfile } = useAuth();
  const router = useRouter();
  const [showChart, setShowChart] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [chartView, setChartView] = useState<'bar' | 'line'>('bar');
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalAttendees: 0,
    totalRevenue: 0,
    conversionRate: 0,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!userProfile?.id) return;

    const loadEvents = async () => {
      try {
        const { data: rows, error } = await supabase
          .from('events')
          .select('*')
          .eq('host_id', userProfile.id);

        if (error) throw error;

        const eventIds = (rows || []).map((row: any) => row.id);

        const attendeesByEvent: Record<string, number> = {};
        if (eventIds.length > 0) {
          const { data: ticketRows, error: ticketsError } = await supabase
            .from('tickets')
            .select('event_id')
            .in('event_id', eventIds)
            .neq('status', 'cancelled');

          if (ticketsError) throw ticketsError;

          (ticketRows || []).forEach((t: any) => {
            attendeesByEvent[t.event_id] = (attendeesByEvent[t.event_id] || 0) + 1;
          });
        }

        const data = (rows || []).map((row: any) => ({
          id: row.id,
          title: row.title,
          startAt: row.event_date,
          isPublished: row.status === 'published',
          currentAttendees: attendeesByEvent[row.id] || 0,
          attendeesCount: attendeesByEvent[row.id] || 0,
          maxAttendees: row.capacity || 0,
          capacity: row.capacity || 0,
          price: row.price || 0,
        }));

        setEvents(data);

        const totalEvents = data.length;
        const totalAttendees = data.reduce(
          (sum, e: any) => sum + (e.currentAttendees || 0),
          0
        );
        const potentialCapacity = data.reduce(
          (sum, e: any) => sum + (e.maxAttendees || e.capacity || 0),
          0
        );
        const totalRevenue = data.reduce(
          (sum, e: any) =>
            sum + (e.price || 0) * (e.currentAttendees || 0),
          0
        );
        const conversionRate =
          potentialCapacity > 0
            ? Math.round((totalAttendees / potentialCapacity) * 100)
            : 0;

        setStats({ totalEvents, totalAttendees, totalRevenue, conversionRate });
      } catch (error) {
        console.error('Error loading dashboard stats:', error);
      } finally {
        setLoadingStats(false);
      }
    };

    loadEvents();

    const channel = supabase
      .channel('host-dashboard-events')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'events', filter: `host_id=eq.${userProfile.id}` },
        loadEvents
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userProfile?.id]);

  const formatDate = (date: any) => {
    if (!mounted) return 'Loading...';
    const parsed = toDate(date);
    if (!parsed) return 'Date TBD';
    return parsed.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Each stat now defines its own correct colors directly — no string-patching.
  const stats_list = useMemo(() => {
    const totalRevenueK = stats.totalRevenue / 1000;
    return [
      {
        label: 'Total Events',
        value: stats.totalEvents,
        icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><circle cx="12" cy="12" r="9" strokeWidth={2} /></svg>,
        trend: stats.totalEvents > 0 ? '+12%' : '0%',
        trendUp: stats.totalEvents > 0,
      },
      {
        label: 'Total Attendees',
        value: stats.totalAttendees.toLocaleString(),
        icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg>,
        trend: stats.totalAttendees > 0 ? '+24%' : '0%',
        trendUp: stats.totalAttendees > 0,
      },
      {
        label: 'Total Revenue',
        value: totalRevenueK > 0 ? `$${totalRevenueK.toFixed(1)}K` : '$0',
        icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
        trend: stats.totalRevenue > 0 ? '+18%' : '0%',
        trendUp: stats.totalRevenue > 0,
      },
      {
        label: 'Fill Rate',
        value: `${stats.conversionRate}%`,
        icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>,
        trend: stats.conversionRate > 0 ? '+8%' : '0%',
        trendUp: stats.conversionRate > 0,
      },
    ];
  }, [stats]);

  const { chartData, monthLabels } = useMemo(() => {
    const now = new Date();
    const labels: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      labels.push(d.toLocaleDateString('en-US', { month: 'short' }));
    }

    const buckets = new Array(6).fill(0);
    events.forEach((event: any) => {
      const date =
        toDate(event.startAt) ||
        toDate(event.date) ||
        toDate(event.createdAt);
      if (!date) return;
      const diffMonths =
        (now.getFullYear() - date.getFullYear()) * 12 +
        (now.getMonth() - date.getMonth());
      if (diffMonths >= 0 && diffMonths < 6) {
        const idx = 5 - diffMonths;
        buckets[idx] += event.currentAttendees || 0;
      }
    });

    const max = Math.max(...buckets);
    const normalized =
      max === 0
        ? buckets.map(() => 15)
        : buckets.map((val) => Math.max(15, Math.round((val / max) * 100)));

    return { chartData: normalized, monthLabels: labels };
  }, [events]);

  if (!mounted) {
    return (
      <DashboardLayout currentPage="dashboard">
        <div className="text-center text-primary-500">Loading dashboard...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout currentPage="dashboard">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center justify-between flex-wrap gap-6">
            <div className="space-y-2">
              <h1 className="text-4xl font-extrabold text-gray-900">
                Welcome back, {userProfile?.name?.split(' ')[0] || 'Host'}
              </h1>
              <p className="text-base text-gray-500">
                Here's what's happening with your events today
              </p>
            </div>
            <button
              className="flex items-center gap-2 bg-secondary-500 hover:bg-secondary-600 text-white px-6 py-3.5 rounded-xl font-bold text-sm transition-colors"
              onClick={() => router.push('/events/create')}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              <span>Create New Event</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-10">
          {stats_list.map((stat, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl p-6 border border-gray-100 opacity-0"
              style={{ animation: `fadeUp 0.5s ease-out ${idx * 0.08}s forwards` }}
            >
              <div className="flex items-start justify-between mb-5">
                <div className="bg-primary-50 text-primary-600 p-3 rounded-xl">
                  {stat.icon}
                </div>
                <div
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-xs ${
                    stat.trendUp ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                  }`}
                >
                  <svg className={`w-3.5 h-3.5 ${stat.trendUp ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                  <span>{stat.trend}</span>
                </div>
              </div>

              <p className="text-gray-400 text-xs font-bold mb-2 tracking-wider uppercase">
                {stat.label}
              </p>

              <p className="text-3xl font-extrabold text-gray-900">
                {loadingStats ? <span className="animate-pulse">...</span> : stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Chart + Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          <div className="lg:col-span-2 bg-white rounded-2xl p-8 border border-gray-100">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">Attendee Growth</h2>
                <p className="text-sm text-gray-500">Performance over the last 6 months</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-lg">
                  <button
                    onClick={() => setChartView('bar')}
                    className={`px-3.5 py-1.5 rounded-md font-semibold text-xs transition-colors ${
                      chartView === 'bar' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500'
                    }`}
                  >
                    Bar
                  </button>
                  <button
                    onClick={() => setChartView('line')}
                    className={`px-3.5 py-1.5 rounded-md font-semibold text-xs transition-colors ${
                      chartView === 'line' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500'
                    }`}
                  >
                    Line
                  </button>
                </div>
                <button
                  onClick={() => setShowChart(!showChart)}
                  className="p-2.5 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
              </div>
            </div>

            {showChart && (
              chartView === 'bar' ? (
                <div className="h-72 flex items-end justify-around gap-4 pb-2">
                  {chartData.map((height, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-3">
                      <div
                        className="w-full bg-primary-500 rounded-t-lg origin-bottom opacity-0"
                        style={{
                          height: `${height}%`,
                          animation: `growUp 0.6s ease-out ${i * 0.08}s forwards`,
                        }}
                        title={`${height}%`}
                      />
                      <span className="text-xs font-bold text-gray-500">{monthLabels[i]}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-72 relative">
                  <svg className="w-full h-full" viewBox="0 0 600 280" preserveAspectRatio="none">
                    {[0, 25, 50, 75, 100].map((val) => (
                      <line key={val} x1="0" y1={280 - val * 2.8} x2="600" y2={280 - val * 2.8} stroke="#f1f0f4" strokeWidth="1" />
                    ))}
                     <path
                      d={`M 0 ${280 - chartData[0] * 2.8} ${chartData.map((h, i) => `L ${(i * 600) / 5} ${280 - h * 2.8}`).join(' ')}`}
                      fill="none"
                      stroke="#5A4485"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {chartData.map((h, i) => (
                      <circle key={i} cx={(i * 600) / 5} cy={280 - h * 2.8} r="5" fill="white" stroke="#5A4485" strokeWidth="2.5" />
                    ))}
                  </svg>
                  <div className="flex justify-around mt-3">
                    {monthLabels.map((label, i) => (
                      <span key={i} className="text-xs font-bold text-gray-500">{label}</span>
                    ))}
                  </div>
                </div>
              )
            )}
          </div>

          {/* Performance card — the one deliberate solid-color moment on the page */}
          <div className="bg-primary-600 rounded-2xl p-8 text-white">
            <div className="flex items-center gap-2 mb-8">
              <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
              <h3 className="text-lg font-bold">Live Metrics</h3>
            </div>

            <div className="space-y-3">
              {[
                { label: 'Avg. Ticket', value: stats.totalAttendees > 0 ? `$${(stats.totalRevenue / Math.max(1, stats.totalAttendees)).toFixed(2)}` : '$0' },
                { label: 'Active Events', value: events.filter((e: any) => e.isPublished).length.toString() },
                { label: 'Total Reach', value: stats.totalAttendees.toLocaleString() },
                { label: 'Engagement', value: `${stats.conversionRate}%` },
              ].map((item, i) => (
                <div key={i} className="bg-white/10 rounded-xl p-4">
                  <div className="text-xs font-semibold opacity-75 mb-1">{item.label}</div>
                  <div className="text-2xl font-extrabold">
                    {loadingStats ? '...' : item.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Events */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-10">
          <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Recent Events</h2>
              <p className="text-sm text-gray-500">Your latest 3 events at a glance</p>
            </div>
            <button
              className="flex items-center gap-2 bg-secondary-500 hover:bg-secondary-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-colors"
              onClick={() => router.push('/events')}
            >
              <span>View All Events</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="divide-y divide-gray-100">
            {events.slice(0, 3).map((event: any, idx: number) => (
              <div
                key={event.id}
                className="px-8 py-6 hover:bg-gray-50 transition-colors cursor-pointer flex items-center gap-5"
                onClick={() => router.push(`/events/${event.id}`)}
              >
                <div className="flex-shrink-0">
                  {event.posterURL ? (
                    <img
                      src={event.posterURL}
                      alt={event.title}
                      className="w-14 h-14 object-cover rounded-xl"
                    />
                  ) : (
                    <div className="w-14 h-14 bg-primary-50 text-primary-600 rounded-xl flex items-center justify-center font-extrabold text-xl">
                      {idx + 1}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 mb-2.5 text-base truncate">
                    {event.title}
                  </h3>
                  <div className="flex items-center flex-wrap gap-2">
                    <span className="bg-gray-50 text-gray-600 px-3 py-1.5 rounded-lg text-xs font-semibold">
                      {formatDate(event.startAt)}
                    </span>
                    <span className="bg-gray-50 text-gray-600 px-3 py-1.5 rounded-lg text-xs font-semibold">
                      {event.attendeesCount || event.currentAttendees || 0} attendees
                    </span>
                    {event.price && (
                      <span className="bg-gray-50 text-gray-600 px-3 py-1.5 rounded-lg text-xs font-semibold">
                        ${event.price}
                      </span>
                    )}
                  </div>
                </div>

                <span
                  className={`px-4 py-2 rounded-lg text-xs font-bold flex-shrink-0 ${
                    event.isPublished ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                  }`}
                >
                  {event.isPublished ? '✓ Live' : '○ Draft'}
                </span>
              </div>
            ))}

            {events.length === 0 && !loadingStats && (
              <div className="px-8 py-16 text-center">
                <h3 className="text-xl font-bold text-gray-900 mb-2">No events yet</h3>
                <p className="text-gray-500 mb-6">Create your first event to get started</p>
                <button className="bg-secondary-500 hover:bg-secondary-600 text-white px-6 py-3 rounded-xl font-bold text-sm transition-colors">
                  Create Your First Event
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tips */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {
              icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" /></svg>,
              title: 'Visual Excellence',
              desc: 'Use high-quality images and compelling descriptions to make your events irresistible',
            },
            {
              icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" /></svg>,
              title: 'Social Amplification',
              desc: 'Share your events across social platforms to maximize reach and engagement',
            },
            {
              icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>,
              title: 'Early Bird Strategy',
              desc: 'Offer early bird pricing to create urgency and boost initial ticket sales',
            },
          ].map((tip, i) => (
            <div key={i} className="bg-white rounded-2xl p-7 border border-gray-100">
              <div className="text-accent-500 mb-4">{tip.icon}</div>
              <h3 className="font-bold text-gray-900 mb-2 text-base">{tip.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{tip.desc}</p>
            </div>
          ))}
        </div>

      <style jsx global>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes growUp {
          from { transform: scaleY(0); opacity: 0; }
          to { transform: scaleY(1); opacity: 1; }
        }
      `}</style>
    </DashboardLayout>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}