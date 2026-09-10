/**
 * ANALYTICS PAGE (/analytics)
 */
'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function Analytics() {
  const { userProfile } = useAuth();

  return (
    <ProtectedRoute>
      <DashboardLayout currentPage="analytics">
        <AnalyticsContent userProfile={userProfile} />
      </DashboardLayout>
    </ProtectedRoute>
  );
}

function AnalyticsContent({ userProfile }: { userProfile: any }) {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [chartType, setChartType] = useState<'revenue' | 'attendees'>('revenue');
  const [sortColumn, setSortColumn] = useState<'name' | 'date' | 'attendees' | 'revenue'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [metrics, setMetrics] = useState([
    { id: 'revenue', title: 'Total Revenue', value: '$0', change: '+0%', trend: 'neutral', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>, iconBg: 'bg-primary-50', iconColor: 'text-primary-600' },
    { id: 'attendees', title: 'Total Attendees', value: '0', change: '+0%', trend: 'neutral', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg>, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
    { id: 'events', title: 'Total Events', value: '0', change: '+0%', trend: 'neutral', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><circle cx="12" cy="12" r="9" strokeWidth={2} /></svg>, iconBg: 'bg-accent-50', iconColor: 'text-accent-600' },
    { id: 'avgRevenue', title: 'Avg Revenue/Event', value: '$0', change: '+0%', trend: 'neutral', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.25 18L9 11.25l4.306 4.306a11.95 11.95 0 015.814-5.518l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" /></svg>, iconBg: 'bg-secondary-50', iconColor: 'text-secondary-600' }
  ]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userProfile?.id) return;

    const loadAnalyticsData = async () => {
      try {
        const { data: eventsData, error } = await supabase
          .from('events')
          .select('*')
          .eq('host_id', userProfile.id);

        if (error) throw error;

        const now = new Date();
        const startDateForFilter = new Date();
        if (timeRange === '7d') startDateForFilter.setDate(now.getDate() - 7);
        else if (timeRange === '30d') startDateForFilter.setDate(now.getDate() - 30);
        else if (timeRange === '90d') startDateForFilter.setDate(now.getDate() - 90);
        else if (timeRange === '1y') startDateForFilter.setFullYear(now.getFullYear() - 1);

        const filteredEventsData = (eventsData || []).filter((event: any) => {
          if (!event.event_date) return false;
          const eventDate = new Date(event.event_date);
          return eventDate >= startDateForFilter;
        });

        const filteredEventIds = filteredEventsData.map((event: any) => event.id);
        const attendeesByEvent: Record<string, number> = {};
        if (filteredEventIds.length > 0) {
          const { data: ticketRows, error: ticketsError } = await supabase
            .from('tickets')
            .select('event_id')
            .in('event_id', filteredEventIds)
            .neq('status', 'cancelled');

          if (ticketsError) throw ticketsError;

          (ticketRows || []).forEach((t: any) => {
            attendeesByEvent[t.event_id] = (attendeesByEvent[t.event_id] || 0) + 1;
          });
        }

        let totalRevenue = 0;
        let totalAttendees = 0;
        const eventsList: any[] = [];

        for (const event of filteredEventsData) {
          const startDate = event.event_date ? new Date(event.event_date) : new Date();
          const attendeeCount = attendeesByEvent[event.id] || 0;
          const eventRevenue = attendeeCount * (event.price || 0);

          totalAttendees += attendeeCount;
          totalRevenue += eventRevenue;

          eventsList.push({
            name: event.title,
            date: startDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
            attendees: attendeeCount,
            revenue: `$${eventRevenue.toLocaleString()}`,
            satisfaction: '4.8/5',
            trend: attendeeCount > 50 ? 'up' : 'neutral'
          });
        }

        const avgRevenue = eventsList.length > 0 ? totalRevenue / eventsList.length : 0;

        setMetrics([
          { id: 'revenue', title: 'Total Revenue', value: `$${totalRevenue.toLocaleString()}`, change: '+0%', trend: 'up', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>, iconBg: 'bg-primary-50', iconColor: 'text-primary-600' },
          { id: 'attendees', title: 'Total Attendees', value: totalAttendees.toLocaleString(), change: '+0%', trend: 'up', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg>, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
          { id: 'events', title: 'Total Events', value: eventsList.length.toString(), change: '+0%', trend: 'neutral', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><circle cx="12" cy="12" r="9" strokeWidth={2} /></svg>, iconBg: 'bg-accent-50', iconColor: 'text-accent-600' },
          { id: 'avgRevenue', title: 'Avg Revenue/Event', value: `$${avgRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, change: '+0%', trend: 'neutral', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.25 18L9 11.25l4.306 4.306a11.95 11.95 0 015.814-5.518l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" /></svg>, iconBg: 'bg-secondary-50', iconColor: 'text-secondary-600' }
        ]);

        setEvents(eventsList);
        setLoading(false);
      } catch (error) {
        console.error('Error loading analytics data:', error);
        setLoading(false);
      }
    };

    loadAnalyticsData();
  }, [userProfile?.id, timeRange]);

  const handleSort = (column: 'name' | 'date' | 'attendees' | 'revenue') => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  const sortedEvents = [...events].sort((a, b) => {
    let aVal: any = a[sortColumn];
    let bVal: any = b[sortColumn];

    if (sortColumn === 'attendees') {
      aVal = parseInt(aVal) || 0;
      bVal = parseInt(bVal) || 0;
    } else if (sortColumn === 'revenue') {
      aVal = parseInt(aVal.replace(/\$|,/g, '')) || 0;
      bVal = parseInt(bVal.replace(/\$|,/g, '')) || 0;
    }

    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const getChartData = () => {
    if (events.length === 0) {
      return { labels: ['No Data'], eventNames: ['No Data'], data: [0], values: [0] };
    }

    const recentEvents = [...events].slice(-7);
    const eventNames = recentEvents.map(e => e.name);
    const labels = recentEvents.map(e => e.date.split(',')[0]);
    const values = recentEvents.map(event => {
      if (chartType === 'revenue') {
        return parseInt(event.revenue.replace(/\$|,/g, '')) || 0;
      } else {
        return parseInt(event.attendees) || 0;
      }
    });

    const maxValue = Math.max(...values, 1);
    const data = values.map(value => {
      const percentage = (value / maxValue) * 100;
      return Math.max(15, percentage);
    });

    return { labels, eventNames, data, values };
  };

  const chartData = getChartData();

  const getPieChartData = () => {
    if (events.length === 0) {
      return { excellent: 0, good: 0, average: 0, total: 0, excellentPct: 0, goodPct: 0, averagePct: 0 };
    }

    let excellent = 0;
    let good = 0;
    let average = 0;

    events.forEach(event => {
      const attendeeCount = parseInt(event.attendees) || 0;
      const capacity = 200;
      const percentage = (attendeeCount / capacity) * 100;
      if (percentage > 70) excellent++;
      else if (percentage > 40) good++;
      else average++;
    });

    const total = excellent + good + average;
    return {
      excellent,
      good,
      average,
      total,
      excellentPct: total > 0 ? Math.round((excellent / total) * 100) : 0,
      goodPct: total > 0 ? Math.round((good / total) * 100) : 0,
      averagePct: total > 0 ? Math.round((average / total) * 100) : 0
    };
  };

  const pieData = getPieChartData();

  const timeRanges = [
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 90 Days' },
    { value: '1y', label: 'Last Year' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-8">
        {loading ? (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="relative w-16 h-16 mx-auto mb-6">
                <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
                <div className="absolute inset-0 rounded-full border-4 border-primary-600 border-t-transparent animate-spin"></div>
              </div>
              <p className="text-lg font-bold text-gray-600">Loading analytics...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="mb-10">
              <div className="flex items-center justify-between flex-wrap gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary-600 rounded-2xl flex items-center justify-center text-white">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.25 18L9 11.25l4.306 4.306a11.95 11.95 0 015.814-5.518l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" /></svg>
                  </div>
                  <div>
                    <h1 className="text-3xl font-extrabold text-gray-900">Analytics</h1>
                    <p className="text-sm text-gray-500 mt-1">Detailed insights into your event performance</p>
                  </div>
                </div>

                <div className="flex gap-2 bg-white rounded-xl p-2 border border-gray-100">
                  {timeRanges.map((range) => (
                    <button
                      key={range.value}
                      onClick={() => setTimeRange(range.value as any)}
                      className={`px-5 py-2.5 rounded-lg font-bold text-sm transition-colors ${
                        timeRange === range.value ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
              {metrics.map((metric) => (
                <div key={metric.id} className="bg-white rounded-2xl border border-gray-100 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 ${metric.iconBg} ${metric.iconColor} rounded-xl flex items-center justify-center`}>
                      {metric.icon}
                    </div>
                    <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                      metric.trend === 'up' ? 'bg-emerald-50 text-emerald-700' :
                      metric.trend === 'down' ? 'bg-red-50 text-red-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {metric.trend === 'up' ? '↗' : metric.trend === 'down' ? '↘' : '→'}
                      <span>{metric.change}</span>
                    </div>
                  </div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">{metric.title}</p>
                  <p className="text-3xl font-extrabold text-gray-900">{metric.value}</p>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mt-4">
                    <div className={`h-full ${metric.iconColor.replace('text-', 'bg-')} rounded-full`} style={{ width: '75%' }}></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
              {/* Revenue/Attendee Chart */}
              <div className="bg-white rounded-2xl border border-gray-100 p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-extrabold text-gray-900">
                    {chartType === 'revenue' ? 'Revenue Over Time' : 'Attendee Growth'}
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setChartType('revenue')}
                      className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${
                        chartType === 'revenue' ? 'bg-primary-50 text-primary-700' : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      Revenue
                    </button>
                    <button
                      onClick={() => setChartType('attendees')}
                      className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${
                        chartType === 'attendees' ? 'bg-emerald-50 text-emerald-700' : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      Attendees
                    </button>
                  </div>
                </div>

                <div className="h-80 bg-white rounded-xl border border-gray-100 p-6">
                  {chartData.data.length === 0 || chartData.values.every(v => v === 0) ? (
                    <div className="h-full flex items-center justify-center">
                      <p className="text-gray-400 font-semibold">No data available for this period</p>
                    </div>
                  ) : (
                    <div className="h-full w-full flex flex-col">
                      <div className="flex-1 flex gap-2">
                        <div className="w-14 flex flex-col justify-between items-end pr-3 text-xs font-bold text-gray-500">
                          <span>{Math.max(...chartData.values)}</span>
                          <span>{Math.round(Math.max(...chartData.values) * 0.75)}</span>
                          <span>{Math.round(Math.max(...chartData.values) * 0.5)}</span>
                          <span>{Math.round(Math.max(...chartData.values) * 0.25)}</span>
                          <span>0</span>
                        </div>

                        <div className="flex-1 relative flex flex-col justify-end">
                          {[100, 75, 50, 25, 0].map((percent) => (
                            <div
                              key={percent}
                              className={`absolute left-0 right-0 ${percent === 0 ? 'border-b-2 border-gray-300' : 'border-b border-gray-100'}`}
                              style={{ bottom: `${percent}%` }}
                            ></div>
                          ))}

                          <div className="flex items-end justify-around gap-6 px-2 relative z-10">
                            {chartData.data.map((height, idx) => {
                              const maxValue = Math.max(...chartData.values);
                              const barPercentage = maxValue > 0 ? (chartData.values[idx] / maxValue) * 100 : 0;

                              return (
                                <div key={idx} className="flex flex-col items-center flex-1 max-w-[80px]">
                                  <div
                                    className="w-10 cursor-pointer relative group/bar rounded-t"
                                    style={{
                                      height: `${barPercentage}%`,
                                      minHeight: '20px',
                                      backgroundColor: chartType === 'revenue' ? '#5A4485' : '#10B981',
                                    }}
                                  >
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover/bar:opacity-100 transition-opacity pointer-events-none z-30 whitespace-nowrap">
                                      <div className="bg-gray-900 text-white px-2 py-1 rounded text-xs font-bold">
                                        {chartType === 'revenue' ? `$${chartData.values[idx]}` : `${chartData.values[idx]}`}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-xs font-bold text-gray-600 text-center mt-2 break-words w-full leading-tight">
                                    {chartData.eventNames[idx]}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Performance Distribution */}
              <div className="bg-white rounded-2xl border border-gray-100 p-8">
                <h3 className="text-lg font-extrabold text-gray-900 mb-6">Event Performance Distribution</h3>

                {pieData.total === 0 ? (
                  <div className="h-72 flex items-center justify-center">
                    <p className="text-gray-400 font-semibold">No events to analyze</p>
                  </div>
                ) : (
                  <div className="h-72 flex flex-col items-center justify-center">
                    <div className="relative w-56 h-56">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-28 h-28 bg-white rounded-full flex flex-col items-center justify-center border-4 border-gray-50">
                          <span className="text-3xl font-extrabold text-primary-600">{pieData.excellentPct}%</span>
                          <span className="text-xs font-bold text-gray-400 text-center">Success Rate</span>
                        </div>
                      </div>

                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle
                          cx="50" cy="50" r="40" fill="none"
                          stroke="#5A4485" strokeWidth="14"
                          strokeDasharray={`${(pieData.excellentPct / 100) * 251.2} 251.2`}
                        />
                        <circle
                          cx="50" cy="50" r="40" fill="none"
                          stroke="#A82C60" strokeWidth="14"
                          strokeDasharray={`${(pieData.goodPct / 100) * 251.2} 251.2`}
                          strokeDashoffset={`-${(pieData.excellentPct / 100) * 251.2}`}
                        />
                        <circle
                          cx="50" cy="50" r="40" fill="none"
                          stroke="#E36C54" strokeWidth="14"
                          strokeDasharray={`${(pieData.averagePct / 100) * 251.2} 251.2`}
                          strokeDashoffset={`-${((pieData.excellentPct + pieData.goodPct) / 100) * 251.2}`}
                        />
                      </svg>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mt-8 w-full">
                      <div className="flex flex-col items-center p-3 bg-primary-50 rounded-xl">
                        <div className="w-3 h-3 bg-primary-600 rounded-full mb-2"></div>
                        <span className="text-sm font-extrabold text-gray-900">{pieData.excellent}</span>
                        <span className="text-xs font-semibold text-gray-500">Excellent ({pieData.excellentPct}%)</span>
                      </div>
                      <div className="flex flex-col items-center p-3 bg-secondary-50 rounded-xl">
                        <div className="w-3 h-3 bg-secondary-600 rounded-full mb-2"></div>
                        <span className="text-sm font-extrabold text-gray-900">{pieData.good}</span>
                        <span className="text-xs font-semibold text-gray-500">Good ({pieData.goodPct}%)</span>
                      </div>
                      <div className="flex flex-col items-center p-3 bg-accent-50 rounded-xl">
                        <div className="w-3 h-3 bg-accent-600 rounded-full mb-2"></div>
                        <span className="text-sm font-extrabold text-gray-900">{pieData.average}</span>
                        <span className="text-xs font-semibold text-gray-500">Average ({pieData.averagePct}%)</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Top Insights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              {[
                { title: 'Peak Registration Time', value: '2-4 PM', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>, iconBg: 'bg-primary-50', iconColor: 'text-primary-600' },
                { title: 'Most Popular Event Type', value: 'Conference', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" /></svg>, iconBg: 'bg-secondary-50', iconColor: 'text-secondary-600' },
                { title: 'Average Event Duration', value: '4.5 hours', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' }
              ].map((insight, idx) => (
                <div key={idx} className="bg-white rounded-2xl border border-gray-100 p-6">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 ${insight.iconBg} ${insight.iconColor} rounded-xl flex items-center justify-center`}>
                      {insight.icon}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">{insight.title}</p>
                      <p className="text-xl font-extrabold text-gray-900">{insight.value}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Event Performance Table */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-8 py-6 border-b border-gray-100">
                <h3 className="text-lg font-extrabold text-gray-900">Event Performance Overview</h3>
              </div>

              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-primary-600">
                      <th className="px-8 py-4 text-left text-xs font-bold text-white uppercase tracking-wider cursor-pointer hover:bg-primary-700 transition-colors" onClick={() => handleSort('name')}>
                        Event Name {sortColumn === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="px-8 py-4 text-left text-xs font-bold text-white uppercase tracking-wider cursor-pointer hover:bg-primary-700 transition-colors" onClick={() => handleSort('date')}>
                        Date {sortColumn === 'date' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="px-8 py-4 text-left text-xs font-bold text-white uppercase tracking-wider cursor-pointer hover:bg-primary-700 transition-colors" onClick={() => handleSort('attendees')}>
                        Attendees {sortColumn === 'attendees' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="px-8 py-4 text-left text-xs font-bold text-white uppercase tracking-wider cursor-pointer hover:bg-primary-700 transition-colors" onClick={() => handleSort('revenue')}>
                        Revenue {sortColumn === 'revenue' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="px-8 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Rating</th>
                      <th className="px-8 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Trend</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {sortedEvents.map((event, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 transition-colors">
                        <td className="px-8 py-5">
                          <span className="text-sm font-extrabold text-gray-900">{event.name}</span>
                        </td>
                        <td className="px-8 py-5">
                          <span className="text-sm font-semibold text-gray-600">{event.date}</span>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-gray-900">{event.attendees}</span>
                            <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(event.attendees / 300) * 100}%` }}></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <span className="text-sm font-extrabold text-primary-600">{event.revenue}</span>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-1">
                            <span className="text-sm font-semibold text-amber-600">{event.satisfaction}</span>
                            <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 24 24"><path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.98 21.539a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                            event.trend === 'up' ? 'bg-emerald-50 text-emerald-700' :
                            event.trend === 'down' ? 'bg-red-50 text-red-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {event.trend === 'up' ? '↗ Growing' : event.trend === 'down' ? '↘ Declining' : '→ Stable'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden p-6 space-y-4">
                {sortedEvents.map((event, idx) => (
                  <div key={idx} className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                    <h4 className="text-base font-extrabold text-gray-900 mb-4">{event.name}</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase mb-1">Date</p>
                        <p className="text-sm font-semibold text-gray-900">{event.date}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase mb-1">Attendees</p>
                        <p className="text-sm font-semibold text-gray-900">{event.attendees}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase mb-1">Revenue</p>
                        <p className="text-sm font-extrabold text-primary-600">{event.revenue}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase mb-1">Rating</p>
                        <p className="text-sm font-semibold text-amber-600 flex items-center gap-1">
                          {event.satisfaction}
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.98 21.539a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}