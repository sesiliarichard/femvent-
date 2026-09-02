/**
 * ENHANCED ANALYTICS PAGE (/analytics)
 * Premium analytics dashboard with interactive charts and insights
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
    { id: 'revenue', title: 'Total Revenue', value: '$0', change: '+0%', trend: 'neutral', icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>, color: 'from-blue-500 to-cyan-500', bgColor: 'from-blue-50 to-cyan-50' },
    { id: 'attendees', title: 'Total Attendees', value: '0', change: '+0%', trend: 'neutral', icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg>, color: 'from-emerald-500 to-teal-500', bgColor: 'from-emerald-50 to-teal-50' },
    { id: 'events', title: 'Total Events', value: '0', change: '+0%', trend: 'neutral', icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><circle cx="12" cy="12" r="9" strokeWidth={2} /></svg>, color: 'from-amber-500 to-orange-500', bgColor: 'from-amber-50 to-orange-50' },
    { id: 'avgRevenue', title: 'Avg Revenue/Event', value: '$0', change: '+0%', trend: 'neutral', icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.25 18L9 11.25l4.306 4.306a11.95 11.95 0 015.814-5.518l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" /></svg>, color: 'from-purple-500 to-pink-500', bgColor: 'from-purple-50 to-pink-50' }
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

        // Calculate date range based on timeRange
        const now = new Date();
        const startDateForFilter = new Date();
        if (timeRange === '7d') startDateForFilter.setDate(now.getDate() - 7);
        else if (timeRange === '30d') startDateForFilter.setDate(now.getDate() - 30);
        else if (timeRange === '90d') startDateForFilter.setDate(now.getDate() - 90);
        else if (timeRange === '1y') startDateForFilter.setFullYear(now.getFullYear() - 1);

        // Filter events by date range
        const filteredEventsData = (eventsData || []).filter((event: any) => {
          if (!event.event_date) return false;
          const eventDate = new Date(event.event_date);
          return eventDate >= startDateForFilter;
        });

        // Count real ticket rows per event instead of trusting the cached tickets_sold column
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

        // Calculate metrics
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
          { id: 'revenue', title: 'Total Revenue', value: `$${totalRevenue.toLocaleString()}`, change: '+0%', trend: 'up', icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>, color: 'from-blue-500 to-cyan-500', bgColor: 'from-blue-50 to-cyan-50' },
          { id: 'attendees', title: 'Total Attendees', value: totalAttendees.toLocaleString(), change: '+0%', trend: 'up', icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg>, color: 'from-emerald-500 to-teal-500', bgColor: 'from-emerald-50 to-teal-50' },
          { id: 'events', title: 'Total Events', value: eventsList.length.toString(), change: '+0%', trend: 'neutral', icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><circle cx="12" cy="12" r="9" strokeWidth={2} /></svg>, color: 'from-amber-500 to-orange-500', bgColor: 'from-amber-50 to-orange-50' },
          { id: 'avgRevenue', title: 'Avg Revenue/Event', value: `$${avgRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, change: '+0%', trend: 'neutral', icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.25 18L9 11.25l4.306 4.306a11.95 11.95 0 015.814-5.518l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" /></svg>, color: 'from-purple-500 to-pink-500', bgColor: 'from-purple-50 to-pink-50' }
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

  // Calculate chart data based on events
  const getChartData = () => {
    if (events.length === 0) {
      return {
        labels: ['No Data'],
        eventNames: ['No Data'],
        data: [0],
        values: [0]
      };
    }

    // Show up to 7 most recent events directly (not grouped by date)
    const recentEvents = [...events].slice(-7);
    
    const eventNames = recentEvents.map(e => e.name); // Full event names
    const labels = recentEvents.map(e => e.date.split(',')[0]); // Just month and day
    const values = recentEvents.map(event => {
      if (chartType === 'revenue') {
        return parseInt(event.revenue.replace(/\$|,/g, '')) || 0;
      } else {
        return parseInt(event.attendees) || 0;
      }
    });

    // Normalize to percentage for bar height (0-100)
    const maxValue = Math.max(...values, 1);
    const data = values.map(value => {
      const percentage = (value / maxValue) * 100;
      return Math.max(15, percentage); // Min height of 15 for visibility
    });

    return { labels, eventNames, data, values };
  };

  const chartData = getChartData();

  // Calculate pie chart data based on event success rates
  const getPieChartData = () => {
    if (events.length === 0) {
      return {
        excellent: 0,
        good: 0,
        average: 0,
        total: 0,
        excellentPct: 0,
        goodPct: 0,
        averagePct: 0,
      };
    }

    let excellent = 0; // High attendees (>70% capacity)
    let good = 0;      // Medium attendees (40-70% capacity)
    let average = 0;   // Low attendees (<40% capacity)

    events.forEach(event => {
      const attendeeCount = parseInt(event.attendees) || 0;
      const capacity = 200; // Assume standard capacity of 200

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
      </div>

      <div className="relative z-10 p-8">
        {loading ? (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="relative w-20 h-20 mx-auto mb-6">
                <div className="absolute inset-0 rounded-full border-4 border-blue-200"></div>
                <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
              </div>
              <p className="text-xl font-bold text-slate-600">Loading analytics...</p>
            </div>
          </div>
        ) : (
          <>
        {/* Premium Header */}
        <div className="mb-10 animate-[fadeIn_0.8s_ease-out]">
          <div className="flex items-center justify-between flex-wrap gap-6">
            <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.25 18L9 11.25l4.306 4.306a11.95 11.95 0 015.814-5.518l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" /></svg>
              </div>
              <div>
                <h1 className="text-5xl font-black bg-gradient-to-r from-slate-900 via-blue-900 to-purple-900 bg-clip-text text-transparent">
                  Analytics
                </h1>
                <p className="text-xl text-slate-600 font-medium mt-2">
                  Detailed insights into your event performance
                </p>
              </div>
            </div>
            
            {/* Time Range Selector */}
            <div className="flex gap-2 bg-white/80 backdrop-blur-xl rounded-2xl p-2 border border-slate-200/50 shadow-lg">
              {timeRanges.map((range) => (
                <button
                  key={range.value}
                  onClick={() => setTimeRange(range.value as any)}
                  className={`px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${
                    timeRange === range.value
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg scale-105'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {metrics.map((metric, idx) => (
            <div
              key={metric.id}
              className="group bg-white/80 backdrop-blur-xl rounded-3xl border border-slate-200/50 shadow-xl p-8 hover:shadow-2xl hover:scale-105 transition-all duration-300"
              style={{ animation: `slideUp 0.5s ease-out ${idx * 0.1}s backwards` }}
            >
              <div className="flex items-start justify-between mb-4">
              <div className={`w-16 h-16 bg-gradient-to-br ${metric.color} rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  {metric.icon}
                </div>
                <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black ${
                  metric.trend === 'up' ? 'bg-emerald-100 text-emerald-700' : 
                  metric.trend === 'down' ? 'bg-red-100 text-red-700' : 
                  'bg-slate-100 text-slate-700'
                }`}>
                  {metric.trend === 'up' ? '↗' : metric.trend === 'down' ? '↘' : '→'}
                  <span>{metric.change}</span>
                </div>
              </div>
              <p className="text-sm font-black text-slate-500 uppercase tracking-wide mb-2">
                {metric.title}
              </p>
              <p className="text-4xl font-black text-slate-900 mb-2">
                {metric.value}
              </p>
              <div className="h-2 bg-gradient-to-r from-slate-100 to-slate-200 rounded-full overflow-hidden mt-4">
                <div 
                  className={`h-full bg-gradient-to-r ${metric.color} rounded-full`}
                  style={{ width: '75%', animation: 'growWidth 1s ease-out' }}
                ></div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          {/* Revenue/Attendee Chart */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-slate-200/50 shadow-2xl p-8 animate-[fadeIn_0.5s_ease-out_0.2s_backwards]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
              <span className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center text-white">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>
                </span>
                {chartType === 'revenue' ? 'Revenue Over Time' : 'Attendee Growth'}
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setChartType('revenue')}
                  className={`px-4 py-2 rounded-xl font-bold text-sm transition-all duration-300 ${
                    chartType === 'revenue'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Revenue
                </button>
                <button
                  onClick={() => setChartType('attendees')}
                  className={`px-4 py-2 rounded-xl font-bold text-sm transition-all duration-300 ${
                    chartType === 'attendees'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Attendees
                </button>
              </div>
            </div>
            
            {/* Chart Visualization */}
            <div className="h-96 bg-white rounded-2xl p-6 border-2 border-slate-200">
              {chartData.data.length === 0 || chartData.values.every(v => v === 0) ? (
                <div className="h-full flex items-center justify-center">
                  <p className="text-slate-500 font-bold text-lg">No data available for this period</p>
                </div>
              ) : (
                <div className="h-full w-full flex flex-col">
                  {/* Chart Area with Bars */}
                  <div className="flex-1 flex gap-2">
                    {/* Y-Axis Labels */}
                    <div className="w-16 flex flex-col justify-between items-end pr-3 text-xs font-bold text-slate-600">
                      <span>{Math.max(...chartData.values)}</span>
                      <span>{Math.round(Math.max(...chartData.values) * 0.75)}</span>
                      <span>{Math.round(Math.max(...chartData.values) * 0.5)}</span>
                      <span>{Math.round(Math.max(...chartData.values) * 0.25)}</span>
                      <span>0</span>
                    </div>

                    {/* Bars Area */}
                    <div className="flex-1 relative flex flex-col justify-end">
                      {/* Horizontal grid lines */}
                      {[100, 75, 50, 25, 0].map((percent) => (
                        <div
                          key={percent}
                          className={`absolute left-0 right-0 ${percent === 0 ? 'border-b-4 border-slate-800' : 'border-b border-slate-300'}`}
                          style={{ bottom: `${percent}%` }}
                        ></div>
                      ))}

                      {/* Bars Container - aligned to bottom (x-axis) */}
                      <div className="flex items-end justify-around gap-6 px-2 relative z-10">
                        {chartData.data.map((height, idx) => {
                          const maxValue = Math.max(...chartData.values);
                          const barPercentage = maxValue > 0 ? (chartData.values[idx] / maxValue) * 100 : 0;
                          
                          return (
                            <div key={idx} className="flex flex-col items-center flex-1 max-w-[80px]">
                              {/* Bar - grows from x-axis */}
                              <div
                                className="w-12 cursor-pointer transition-all duration-200 hover:shadow-lg relative group/bar"
                                style={{
                                  height: `${barPercentage}%`,
                                  minHeight: '20px',
                                  backgroundColor: chartType === 'revenue' ? '#3B82F6' : '#10B981',
                                  border: '2px solid rgba(0,0,0,0.2)',
                                  animation: `growUp 0.6s ease-out ${idx * 0.12}s backwards`
                                }}
                              >
                                {/* Tooltip on hover */}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover/bar:opacity-100 transition-opacity duration-200 pointer-events-none z-30 whitespace-nowrap">
                                  <div className="bg-slate-900 text-white px-2 py-1 rounded text-xs font-bold shadow-lg">
                                    {chartType === 'revenue' ? `$${chartData.values[idx]}` : `${chartData.values[idx]}`}
                                  </div>
                                </div>
                              </div>

                              {/* Label below bar */}
                              <div className="text-xs font-bold text-slate-700 text-center mt-2 break-words w-full leading-tight">
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
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-slate-200/50 shadow-2xl p-8 animate-[fadeIn_0.5s_ease-out_0.3s_backwards]">
            <h3 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
            <span className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><circle cx="12" cy="12" r="9" strokeWidth={2} /></svg>
              </span>
              Event Performance Distribution
            </h3>
            
            {/* Donut Chart with Real Data */}
            {pieData.total === 0 ? (
              <div className="h-80 flex items-center justify-center">
                <p className="text-slate-500 font-bold">No events to analyze</p>
              </div>
            ) : (
              <div className="h-80 flex flex-col items-center justify-center">
                <div className="relative w-64 h-64">
                  {/* Center Circle */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-32 h-32 bg-white rounded-full shadow-lg flex flex-col items-center justify-center border-4 border-slate-100">
                      <span className="text-4xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{pieData.excellentPct}%</span>
                      <span className="text-xs font-bold text-slate-500 text-center">Success Rate</span>
                    </div>
                  </div>
                  
                  {/* SVG Donut */}
                  <svg className="w-full h-full transform -rotate-90 drop-shadow-lg" viewBox="0 0 100 100">
                    {/* Excellent segment */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="url(#gradient1)"
                      strokeWidth="14"
                      strokeDasharray={`${(pieData.excellentPct / 100) * 251.2} 251.2`}
                      className="transition-all duration-1000"
                      style={{ animation: 'drawCircle 1s ease-out forwards' }}
                    />
                    
                    {/* Good segment */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="url(#gradient2)"
                      strokeWidth="14"
                      strokeDasharray={`${(pieData.goodPct / 100) * 251.2} 251.2`}
                      strokeDashoffset={`-${(pieData.excellentPct / 100) * 251.2}`}
                      className="transition-all duration-1000"
                      style={{ animation: 'drawCircle 1s ease-out 0.1s forwards' }}
                    />
                    
                    {/* Average segment */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="url(#gradient3)"
                      strokeWidth="14"
                      strokeDasharray={`${(pieData.averagePct / 100) * 251.2} 251.2`}
                      strokeDashoffset={`-${((pieData.excellentPct + pieData.goodPct) / 100) * 251.2}`}
                      className="transition-all duration-1000"
                      style={{ animation: 'drawCircle 1s ease-out 0.2s forwards' }}
                    />
                    
                    <defs>
                      <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#3B82F6" />
                        <stop offset="100%" stopColor="#06B6D4" />
                      </linearGradient>
                      <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#10B981" />
                        <stop offset="100%" stopColor="#14B8A6" />
                      </linearGradient>
                      <linearGradient id="gradient3" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#F59E0B" />
                        <stop offset="100%" stopColor="#F97316" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>

                {/* Legend with Real Data */}
                <div className="grid grid-cols-3 gap-6 mt-8 w-full">
                  <div className="flex flex-col items-center p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl border border-blue-200">
                    <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full mb-2"></div>
                    <span className="text-sm font-black text-slate-900">{pieData.excellent}</span>
                    <span className="text-xs font-bold text-slate-600">Excellent ({pieData.excellentPct}%)</span>
                  </div>
                  <div className="flex flex-col items-center p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200">
                    <div className="w-4 h-4 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full mb-2"></div>
                    <span className="text-sm font-black text-slate-900">{pieData.good}</span>
                    <span className="text-xs font-bold text-slate-600">Good ({pieData.goodPct}%)</span>
                  </div>
                  <div className="flex flex-col items-center p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-200">
                    <div className="w-4 h-4 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full mb-2"></div>
                    <span className="text-sm font-black text-slate-900">{pieData.average}</span>
                    <span className="text-xs font-bold text-slate-600">Average ({pieData.averagePct}%)</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Top Insights Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {[
                   { title: 'Peak Registration Time', value: '2-4 PM', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>, color: 'from-blue-500 to-cyan-500' },
                   { title: 'Most Popular Event Type', value: 'Conference', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" /></svg>, color: 'from-purple-500 to-pink-500' },
                   { title: 'Average Event Duration', value: '4.5 hours', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>, color: 'from-emerald-500 to-teal-500' }
          ].map((insight, idx) => (
            <div
              key={idx}
              className="group bg-white/80 backdrop-blur-xl rounded-3xl border border-slate-200/50 shadow-xl p-6 hover:shadow-2xl hover:scale-105 transition-all duration-300"
              style={{ animation: `slideUp 0.5s ease-out ${idx * 0.1 + 0.4}s backwards` }}
            >
              <div className="flex items-center gap-4">
              <div className={`w-14 h-14 bg-gradient-to-br ${insight.color} rounded-2xl flex items-center justify-center text-white shadow-lg`}>
                  {insight.icon}
                </div>
                <div>
                  <p className="text-xs font-black text-slate-500 uppercase tracking-wide mb-1">
                    {insight.title}
                  </p>
                  <p className="text-2xl font-black text-slate-900">
                    {insight.value}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Event Performance Table */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-slate-200/50 shadow-2xl overflow-hidden animate-[fadeIn_0.5s_ease-out_0.5s_backwards]">
          <div className="px-8 py-6 border-b-2 border-slate-100">
            <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
            <span className="w-10 h-10 bg-gradient-to-br from-violet-600 to-purple-600 rounded-xl flex items-center justify-center text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" /></svg>
              </span>
              Event Performance Overview
            </h3>
          </div>
          
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gradient-to-r from-blue-600 to-purple-600">
                  <th className="px-8 py-4 text-left text-xs font-black text-white uppercase tracking-wider cursor-pointer hover:bg-blue-700 transition-colors" onClick={() => handleSort('name')}>
                    Event Name {sortColumn === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-8 py-4 text-left text-xs font-black text-white uppercase tracking-wider cursor-pointer hover:bg-blue-700 transition-colors" onClick={() => handleSort('date')}>
                    Date {sortColumn === 'date' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-8 py-4 text-left text-xs font-black text-white uppercase tracking-wider cursor-pointer hover:bg-blue-700 transition-colors" onClick={() => handleSort('attendees')}>
                    Attendees {sortColumn === 'attendees' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-8 py-4 text-left text-xs font-black text-white uppercase tracking-wider cursor-pointer hover:bg-blue-700 transition-colors" onClick={() => handleSort('revenue')}>
                    Revenue {sortColumn === 'revenue' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-8 py-4 text-left text-xs font-black text-white uppercase tracking-wider">Rating</th>
                  <th className="px-8 py-4 text-left text-xs font-black text-white uppercase tracking-wider">Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-slate-100">
                {sortedEvents.map((event, idx) => (
                  <tr
                    key={idx}
                    className="group hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-300"
                    style={{ animation: `slideRight 0.5s ease-out ${idx * 0.1}s backwards` }}
                  >
                    <td className="px-8 py-6">
                      <span className="text-sm font-black text-slate-900">{event.name}</span>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-sm font-bold text-slate-600">{event.date}</span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">{event.attendees}</span>
                        <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                            style={{ width: `${(event.attendees / 300) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-sm font-black text-blue-600">{event.revenue}</span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-1">
                      <span className="text-sm font-bold text-amber-600">{event.satisfaction}</span>
                      <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 24 24"><path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.98 21.539a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black ${
                        event.trend === 'up' ? 'bg-emerald-100 text-emerald-700' :
                        event.trend === 'down' ? 'bg-red-100 text-red-700' :
                        'bg-slate-100 text-slate-700'
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
              <div
                key={idx}
                className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl p-6 border-2 border-slate-200"
              >
                <h4 className="text-lg font-black text-slate-900 mb-4">{event.name}</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-black text-slate-500 uppercase mb-1">Date</p>
                    <p className="text-sm font-bold text-slate-900">{event.date}</p>
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-500 uppercase mb-1">Attendees</p>
                    <p className="text-sm font-bold text-slate-900">{event.attendees}</p>
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-500 uppercase mb-1">Revenue</p>
                    <p className="text-sm font-black text-blue-600">{event.revenue}</p>
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-500 uppercase mb-1">Rating</p>
                    <p className="text-sm font-bold text-amber-600 flex items-center gap-1">{event.satisfaction} <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.98 21.539a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg></p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
          </>
        )}
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideRight {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes growUp {
          from {
            height: 0;
          }
        }

        @keyframes growWidth {
          from {
            width: 0;
          }
        }

        @keyframes drawCircle {
          from {
            stroke-dasharray: 0 176;
          }
        }

        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </div>
  );
}