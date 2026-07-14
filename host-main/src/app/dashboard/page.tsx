/**
 * ENHANCED DASHBOARD PAGE (/dashboard)
 * Premium dashboard with advanced animations, glassmorphism effects, and modern UI
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


// Main Dashboard Content - ENHANCED
export default function DashboardContent() {
  const { userProfile } = useAuth();
  const router = useRouter();
  const [showChart, setShowChart] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [hoveredStat, setHoveredStat] = useState<number | null>(null);
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

        // Map to the field names this page's JSX expects
        const data = (rows || []).map((row: any) => ({
          id: row.id,
          title: row.title,
          startAt: row.event_date,
          isPublished: row.status === 'published',
          currentAttendees: row.tickets_sold || 0,
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

  const stats_list = useMemo(() => {
    const totalRevenueK = stats.totalRevenue / 1000;
    return [
      {
        label: 'Total Events',
        value: stats.totalEvents,
        icon: '🎯',
        color: 'from-violet-500 via-purple-500 to-purple-600',
        bgColor: 'bg-violet-50',
        textColor: 'text-violet-600',
        glowColor: 'shadow-violet-500/50',
        trend: stats.totalEvents > 0 ? '+12%' : '0%',
        trendUp: stats.totalEvents > 0,
        suffix: ''
      },
      {
        label: 'Total Attendees',
        value: stats.totalAttendees.toLocaleString(),
        icon: '👥',
        color: 'from-blue-500 via-cyan-500 to-teal-500',
        bgColor: 'bg-blue-50',
        textColor: 'text-blue-600',
        glowColor: 'shadow-blue-500/50',
        trend: stats.totalAttendees > 0 ? '+24%' : '0%',
        trendUp: stats.totalAttendees > 0,
        suffix: ''
      },
      {
        label: 'Total Revenue',
        value: totalRevenueK > 0 ? totalRevenueK.toFixed(1) : '0',
        icon: '💎',
        color: 'from-emerald-500 via-green-500 to-teal-600',
        bgColor: 'bg-emerald-50',
        textColor: 'text-emerald-600',
        glowColor: 'shadow-emerald-500/50',
        trend: stats.totalRevenue > 0 ? '+18%' : '0%',
        trendUp: stats.totalRevenue > 0,
        suffix: 'K'
      },
      {
        label: 'Fill Rate',
        value: stats.conversionRate,
        icon: '⚡',
        color: 'from-amber-500 via-orange-500 to-red-500',
        bgColor: 'bg-amber-50',
        textColor: 'text-amber-600',
        glowColor: 'shadow-amber-500/50',
        trend: stats.conversionRate > 0 ? '+8%' : '0%',
        trendUp: stats.conversionRate > 0,
        suffix: '%'
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
        <div className="text-center text-purple-500">Loading dashboard...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout currentPage="dashboard">
        {/* Premium Header Section */}
        <div className="mb-12 animate-[fadeIn_0.8s_ease-out]">
          <div className="flex items-center justify-between flex-wrap gap-6">
            <div className="space-y-3">
              <h1 className="text-6xl font-black bg-gradient-to-r from-purple-600 via-secondary-600 to-accent-600 bg-clip-text text-transparent leading-tight">
                Welcome back, {userProfile?.name?.split(' ')[0] || 'Host'}! 👋
              </h1>
              <p className="text-xl text-purple-400 font-medium">
                Here's what's happening with your events today
              </p>
            </div>
            <button
              className="group relative bg-gradient-to-r from-secondary-500 via-secondary-600 to-accent-600 text-white px-10 py-5 rounded-2xl font-bold text-lg hover:shadow-2xl hover:shadow-secondary-500/40 hover:scale-105 transition-all duration-300 active:scale-95 overflow-hidden"
              onClick={() => router.push('/events/create')}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-accent-600 to-secondary-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex items-center gap-3">
                <svg className="w-6 h-6 group-hover:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                <span>Create New Event</span>
              </div>
            </button>
          </div>
        </div>

        {/* Premium Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-12">
          {stats_list.map((stat, idx) => (
            <div
              key={idx}
              onMouseEnter={() => setHoveredStat(idx)}
              onMouseLeave={() => setHoveredStat(null)}
              className="group relative bg-white/80 backdrop-blur-xl rounded-3xl p-8 border border-pink-200/50 hover:border-purple-300/50 hover:shadow-2xl transition-all duration-500 cursor-pointer overflow-hidden"
              style={{
                animation: `slideUp 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) ${idx * 0.15}s backwards`
              }}
            >
              {/* Gradient overlay */}
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>
              
              {/* Glow effect on hover */}
              <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl ${stat.glowColor}`}></div>
              
              {/* Animated mesh gradient background */}
              <div className="absolute -right-12 -bottom-12 w-40 h-40 opacity-30 group-hover:opacity-50 transition-opacity duration-700">
                <div className={`w-full h-full bg-gradient-to-br ${stat.color} rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700`}></div>
              </div>
              
              <div className="relative z-10">
                {/* Icon and Trend */}
                <div className="flex items-start justify-between mb-6">
                  <div className={`${stat.bgColor.replace('bg-blue-50', 'bg-pink-50').replace('bg-violet-50', 'bg-purple-50').replace('bg-emerald-50', 'bg-rose-50').replace('bg-amber-50', 'bg-orange-50')} p-4 rounded-2xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg`}>
                    <span className="text-4xl">{stat.icon}</span>
                  </div>
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-sm ${
                    stat.trendUp 
                      ? 'bg-rose-50 text-rose-600' 
                      : 'bg-red-50 text-red-600'
                  }`}>
                    <svg className={`w-4 h-4 ${stat.trendUp ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                    <span>{stat.trend}</span>
                  </div>
                </div>

                {/* Label */}
                <p className="text-purple-500 text-sm font-bold mb-3 tracking-wider uppercase">
                  {stat.label}
                </p>

                {/* Value */}
                <div className="flex items-baseline gap-1">
                  <p className={`text-5xl font-black ${stat.textColor.replace('text-blue-600', 'text-purple-600').replace('text-violet-600', 'text-purple-600').replace('text-emerald-600', 'text-rose-600').replace('text-amber-600', 'text-orange-600')} group-hover:scale-105 transition-transform duration-300`}>
                    {loadingStats ? (
                      <span className="animate-pulse">...</span>
                    ) : (
                      <>
                        {stat.label === 'Total Revenue' && '$'}
                        {stat.value}
                      </>
                    )}
                  </p>
                  {stat.suffix && (
                    <span className={`text-2xl font-bold ${stat.textColor.replace('text-blue-600', 'text-purple-600').replace('text-violet-600', 'text-purple-600').replace('text-emerald-600', 'text-rose-600').replace('text-amber-600', 'text-orange-600')} opacity-60`}>
                      {stat.suffix}
                    </span>
                  )}
                </div>

                {/* Progress bar */}
                <div className="mt-4 h-2 bg-pink-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full bg-gradient-to-r ${stat.color.replace('from-blue-500 via-cyan-500 to-teal-500', 'from-secondary-500 via-secondary-600 to-accent-600').replace('from-violet-500 via-purple-500 to-purple-600', 'from-purple-500 via-secondary-500 to-purple-600').replace('from-emerald-500 via-green-500 to-teal-600', 'from-rose-500 via-secondary-600 to-accent-600').replace('from-amber-500 via-orange-500 to-red-500', 'from-orange-500 via-accent-600 to-rose-600')} transition-all duration-1000 ease-out`}
                    style={{ 
                      width: hoveredStat === idx ? '100%' : `${Math.min(100, (stat.value as number) || 50)}%`,
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

        {/* Enhanced Charts & Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Premium Chart Area */}
          <div className="lg:col-span-2 bg-white/80 backdrop-blur-xl rounded-3xl p-10 border border-pink-200/50 shadow-2xl hover:shadow-3xl transition-all duration-500">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-3xl font-black text-purple-900 mb-2">Attendee Growth</h2>
                <p className="text-sm text-purple-500 flex items-center gap-2">
                  <span className="w-2 h-2 bg-gradient-to-r from-secondary-500 to-accent-500 rounded-full"></span>
                  Performance over the last 6 months
                </p>
              </div>
              <div className="flex items-center gap-3">
                {/* Chart Type Toggle */}
                <div className="flex items-center gap-2 bg-pink-100 p-1.5 rounded-xl">
                  <button
                    onClick={() => setChartView('bar')}
                    className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-300 ${
                      chartView === 'bar'
                        ? 'bg-white text-secondary-600 shadow-lg'
                        : 'text-purple-600 hover:text-purple-900'
                    }`}
                  >
                    Bar
                  </button>
                  <button
                    onClick={() => setChartView('line')}
                    className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-300 ${
                      chartView === 'line'
                        ? 'bg-white text-secondary-600 shadow-lg'
                        : 'text-purple-600 hover:text-purple-900'
                    }`}
                  >
                    Line
                  </button>
                </div>
                <button
                  onClick={() => setShowChart(!showChart)}
                  className="p-3 hover:bg-pink-100 rounded-xl transition-all duration-300 group"
                >
                  {showChart ? (
                    <svg className="w-6 h-6 text-purple-600 group-hover:text-purple-900 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 text-purple-600 group-hover:text-purple-900 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {showChart && (
              <div className="space-y-2">
                {chartView === 'bar' ? (
                  // Bar Chart
                  <div className="h-80 flex items-end justify-around gap-4 pb-4 relative">
                    {/* Grid lines */}
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                      {[0, 25, 50, 75, 100].map((val) => (
                        <div key={val} className="border-t border-pink-100 w-full">
                          <span className="text-xs text-purple-400 -mt-2 inline-block">{val}%</span>
                        </div>
                      ))}
                    </div>

                    {chartData.map((height, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-4 z-10">
                        <div className="relative w-full group/bar">
                          <div
                            className="w-full bg-gradient-to-t from-secondary-500 via-accent-500 to-rose-500 rounded-t-3xl hover:shadow-2xl hover:shadow-secondary-500/50 transition-all duration-500 cursor-pointer relative overflow-hidden"
                            style={{ 
                              height: `${height}%`,
                              animation: `growUp 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) ${i * 0.15}s backwards`
                            }}
                          >
                            {/* Shine effect */}
                            <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/30 to-transparent opacity-0 group-hover/bar:opacity-100 transition-opacity duration-300"></div>
                            
                            {/* Premium Tooltip */}
                            <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 opacity-0 group-hover/bar:opacity-100 transition-all duration-300 pointer-events-none">
                              <div className="bg-gradient-to-r from-purple-900 to-purple-800 text-white px-5 py-3 rounded-2xl shadow-2xl">
                                <div className="text-center">
                                  <div className="text-2xl font-black bg-gradient-to-r from-secondary-400 to-accent-400 bg-clip-text text-transparent">
                                    {height}%
                                  </div>
                                  <div className="text-xs text-purple-300 mt-1">Growth</div>
                                </div>
                                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-3 h-3 bg-purple-900"></div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <span className="text-sm font-bold text-purple-700">{monthLabels[i]}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  // Line Chart
                  <div className="h-80 relative">
                    <svg className="w-full h-full" viewBox="0 0 600 320" preserveAspectRatio="none">
                      {/* Grid */}
                      {[0, 25, 50, 75, 100].map((val) => (
                        <line
                          key={val}
                          x1="0"
                          y1={320 - (val * 3.2)}
                          x2="600"
                          y2={320 - (val * 3.2)}
                          stroke="#e2e8f0"
                          strokeWidth="1"
                        />
                      ))}

                      {/* Line path */}
                      <defs>
                        <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#3b82f6" />
                          <stop offset="50%" stopColor="#a855f7" />
                          <stop offset="100%" stopColor="#ec4899" />
                        </linearGradient>
                        <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                        </linearGradient>
                      </defs>

                      {/* Area fill */}
                      <path
                        d={`M 0 ${320 - chartData[0] * 3.2} ${chartData.map((h, i) => 
                          `L ${(i * 600) / 5} ${320 - h * 3.2}`
                        ).join(' ')} L 600 320 L 0 320 Z`}
                        fill="url(#areaGradient)"
                        opacity="0.5"
                      />

                      {/* Line */}
                      <path
                        d={`M 0 ${320 - chartData[0] * 3.2} ${chartData.map((h, i) => 
                          `L ${(i * 600) / 5} ${320 - h * 3.2}`
                        ).join(' ')}`}
                        fill="none"
                        stroke="url(#lineGradient)"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{
                          animation: 'drawLine 2s ease-out forwards',
                          strokeDasharray: 1000,
                          strokeDashoffset: 1000
                        }}
                      />

                      {/* Data points */}
                      {chartData.map((h, i) => (
                        <g key={i}>
                          <circle
                            cx={(i * 600) / 5}
                            cy={320 - h * 3.2}
                            r="8"
                            fill="white"
                            stroke="#3b82f6"
                            strokeWidth="3"
                            style={{
                              animation: `fadeIn 0.5s ease-out ${i * 0.2 + 0.5}s backwards`
                            }}
                          />
                        </g>
                      ))}
                    </svg>
                    <div className="flex justify-around mt-4">
                      {monthLabels.map((label, i) => (
                        <span key={i} className="text-sm font-bold text-slate-700">{label}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Premium Performance Card */}
          <div className="relative bg-gradient-to-br from-secondary-500 via-accent-500 to-rose-600 rounded-3xl p-10 text-white shadow-2xl overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl animate-blob"></div>
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-rose-400/20 rounded-full blur-2xl animate-blob animation-delay-2000"></div>
            <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-purple-400/20 rounded-full blur-2xl animate-blob animation-delay-4000"></div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-10">
                <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
                <h3 className="text-2xl font-black">Live Metrics</h3>
              </div>

              <div className="space-y-6">
                {[
                  { label: 'Avg. Ticket', value: stats.totalAttendees > 0 ? `$${(stats.totalRevenue / Math.max(1, stats.totalAttendees)).toFixed(2)}` : '$0', icon: '💵', color: 'from-rose-400 to-accent-500' },
                  { label: 'Active Events', value: events.filter((e: any) => e.isPublished).length.toString(), icon: '🎯', color: 'from-secondary-400 to-purple-500' },
                  { label: 'Total Reach', value: stats.totalAttendees.toLocaleString(), icon: '🌟', color: 'from-purple-400 to-rose-500' },
                  { label: 'Engagement', value: `${stats.conversionRate}%`, icon: '⚡', color: 'from-accent-400 to-orange-500' }
                ].map((item, i) => (
                  <div 
                    key={i} 
                    className="group relative bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 hover:bg-white/20 transition-all duration-300 cursor-pointer overflow-hidden"
                    style={{ animation: `slideRight 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) ${i * 0.15}s backwards` }}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-r ${item.color} opacity-0 group-hover:opacity-20 transition-opacity duration-300`}></div>
                    <div className="relative flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-3xl group-hover:scale-125 transition-transform duration-300">
                          {item.icon}
                        </div>
                        <div>
                          <div className="text-sm font-semibold opacity-80 mb-1">{item.label}</div>
                          <div className="text-3xl font-black group-hover:scale-110 transition-transform duration-300">
                            {loadingStats ? '...' : item.value}
                          </div>
                        </div>
                      </div>
                      <svg className="w-6 h-6 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Premium Recent Events Section */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-slate-200/50 shadow-2xl overflow-hidden hover:shadow-3xl transition-all duration-500 mb-12">
          <div className="px-10 py-8 border-b border-pink-200/50 bg-gradient-to-r from-pink-50/50 to-purple-50/30">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-black text-purple-900 mb-2">Recent Events</h2>
                <p className="text-sm text-purple-500 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Your latest 3 events at a glance
                </p>
              </div>
              <button
                className="group flex items-center gap-3 bg-gradient-to-r from-secondary-500 to-accent-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:shadow-xl hover:shadow-secondary-500/30 hover:scale-105 transition-all duration-300"
                onClick={() => router.push('/events')}
              >
                <span>View All Events</span>
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          <div className="divide-y divide-pink-200/50">
            {events.slice(0, 3).map((event: any, idx: number) => (
              <div
                key={event.id}
                className="group px-10 py-8 hover:bg-gradient-to-r hover:from-pink-50/50 hover:to-purple-50/30 transition-all duration-300 cursor-pointer relative overflow-hidden"
                style={{ animation: `fadeIn 0.8s ease-out ${idx * 0.2}s backwards` }}
                onClick={() => router.push(`/events/${event.id}`)}
              >
                {/* Hover glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-secondary-500/0 via-accent-500/0 to-rose-500/0 group-hover:from-secondary-500/5 group-hover:via-accent-500/5 group-hover:to-rose-500/5 transition-all duration-500"></div>
                
                <div className="relative flex items-center gap-6">
                  {/* Event Logo or Number Badge */}
                  <div className="flex-shrink-0">
                    {event.posterURL ? (
                      <img
                        src={event.posterURL}
                        alt={event.title}
                        className="w-16 h-16 object-cover rounded-2xl shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                        {idx + 1}
                      </div>
                    )}
                  </div>

                  {/* Event Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-purple-900 mb-4 text-2xl group-hover:text-secondary-600 transition-colors duration-300 truncate">
                      {event.title}
                    </h3>
                    <div className="flex items-center flex-wrap gap-4">
                      <span className="flex items-center gap-2 bg-gradient-to-r from-pink-100 to-purple-50 px-4 py-2.5 rounded-xl group-hover:from-secondary-100 group-hover:to-secondary-50 group-hover:text-secondary-700 transition-all duration-300 font-semibold text-sm">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>{formatDate(event.startAt)}</span>
                      </span>
                      <span className="flex items-center gap-2 bg-gradient-to-r from-purple-100 to-rose-50 px-4 py-2.5 rounded-xl text-purple-700 transition-all duration-300 font-semibold text-sm">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span>{event.attendeesCount || event.currentAttendees || 0} attendees</span>
                      </span>
                      {event.price && (
                        <span className="flex items-center gap-2 bg-gradient-to-r from-rose-100 to-accent-50 px-4 py-2.5 rounded-xl text-rose-700 transition-all duration-300 font-semibold text-sm">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>${event.price}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status and Action */}
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <span
                      className={`px-6 py-3 rounded-xl text-sm font-black transition-all duration-300 ${
                        event.isPublished
                          ? 'bg-gradient-to-r from-rose-50 to-accent-50 text-rose-700 group-hover:from-rose-100 group-hover:to-accent-100'
                          : 'bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 group-hover:from-amber-100 group-hover:to-orange-100'
                      }`}
                    >
                      {event.isPublished ? '✓ Live' : '○ Draft'}
                    </span>
                    <button className="p-4 hover:bg-secondary-100 rounded-xl transition-all duration-300 opacity-0 group-hover:opacity-100 hover:scale-110 active:scale-95">
                      <svg className="w-6 h-6 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {events.length === 0 && !loadingStats && (
              <div className="px-10 py-20 text-center">
                <div className="text-6xl mb-4">🎯</div>
                <h3 className="text-2xl font-bold text-purple-900 mb-2">No events yet</h3>
                <p className="text-purple-500 mb-6">Create your first event to get started</p>
                <button className="bg-gradient-to-r from-secondary-500 to-accent-600 text-white px-8 py-4 rounded-xl font-bold hover:shadow-xl hover:shadow-secondary-500/30 hover:scale-105 transition-all duration-300">
                  Create Your First Event
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Premium Tips Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: '🎨',
              title: 'Visual Excellence',
              desc: 'Use high-quality images and compelling descriptions to make your events irresistible',
              color: 'from-secondary-500 via-accent-500 to-rose-500',
              bgColor: 'from-pink-50 to-purple-50'
            },
            {
              icon: '📱',
              title: 'Social Amplification',
              desc: 'Share your events across social platforms to maximize reach and engagement',
              color: 'from-purple-500 via-secondary-500 to-accent-500',
              bgColor: 'from-purple-50 to-secondary-50'
            },
            {
              icon: '⚡',
              title: 'Early Bird Strategy',
              desc: 'Offer early bird pricing to create urgency and boost initial ticket sales',
              color: 'from-accent-500 via-rose-500 to-orange-500',
              bgColor: 'from-rose-50 to-accent-50'
            },
          ].map((tip, i) => (
            <div
              key={i}
              className="group relative bg-white/80 backdrop-blur-xl rounded-3xl p-8 border border-pink-200/50 hover:border-purple-300/50 hover:shadow-2xl transition-all duration-500 cursor-pointer overflow-hidden"
              style={{ animation: `slideUp 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) ${i * 0.15}s backwards` }}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${tip.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>
              <div className={`absolute -right-12 -bottom-12 w-40 h-40 bg-gradient-to-br ${tip.bgColor} rounded-full blur-2xl opacity-50 group-hover:scale-150 transition-transform duration-700`}></div>
              
              <div className="relative z-10">
                <div className="text-5xl mb-5 group-hover:scale-125 group-hover:rotate-12 transition-transform duration-500 inline-block">
                  {tip.icon}
                </div>
                <h3 className="font-black text-purple-900 mb-3 text-xl group-hover:bg-gradient-to-r group-hover:from-secondary-600 group-hover:to-accent-600 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">
                  {tip.title}
                </h3>
                <p className="text-sm text-purple-600 leading-relaxed font-medium">
                  {tip.desc}
                </p>
              </div>
            </div>
          ))}
        </div>a

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
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes growWidth {
          from {
            width: 0;
          }
        }

        @keyframes drawLine {
          to {
            stroke-dashoffset: 0;
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

        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </DashboardLayout>
  );
}