/**
 * EVENTS LIST PAGE (/events)
 */
'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function Events() {
  const { userProfile } = useAuth();

  return (
    <ProtectedRoute>
      <DashboardLayout currentPage="events">
        <EventsContent userProfile={userProfile} />
      </DashboardLayout>
    </ProtectedRoute>
  );
}

function EventsContent({ userProfile }: { userProfile: any }) {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed' | 'drafts'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'attendees'>('date');

  useEffect(() => {
    if (!userProfile?.id) return;

    const loadEvents = async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('host_id', userProfile.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading events:', error);
        setLoading(false);
        return;
      }

      const rows = (data || []).map((row: any) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        startAt: row.event_date,
        isPublished: row.status === 'published',
        currentAttendees: row.tickets_sold || 0,
        capacity: row.capacity || 0,
        price: row.price || 0,
      }));

      setEvents(rows);
      setLoading(false);
    };

    loadEvents();

    const channel = supabase
      .channel(`host-events-list-${userProfile.id}`)
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

  const filtered = useMemo(() => {
    const now = new Date();
    let result = events;

    if (filter === 'upcoming') {
      result = events.filter((e: any) => {
        if (!e.startAt) return false;
        const date = e.startAt?.toDate ? e.startAt.toDate() : (e.startAt.seconds ? new Date(e.startAt.seconds * 1000) : new Date(e.startAt));
        return date > now;
      });
    } else if (filter === 'completed') {
      result = events.filter((e: any) => {
        if (!e.startAt) return false;
        const date = e.startAt?.toDate ? e.startAt.toDate() : (e.startAt.seconds ? new Date(e.startAt.seconds * 1000) : new Date(e.startAt));
        return date < now;
      });
    } else if (filter === 'drafts') {
      result = events.filter((e: any) => e.isPublished === false);
    }

    if (searchQuery) {
      result = result.filter((e: any) =>
        e.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (sortBy === 'title') {
      result = [...result].sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    } else if (sortBy === 'attendees') {
      result = [...result].sort((a, b) => (b.currentAttendees || 0) - (a.currentAttendees || 0));
    }

    return result;
  }, [events, filter, searchQuery, sortBy]);

  const removeEvent = async (id: string, title: string) => {
    if (!id) return;
    const confirmed = window.confirm(`Delete "${title}"? This action cannot be undone.`);
    if (!confirmed) return;
    const { error } = await supabase.from('events').delete().eq('id', id);
    if (error) console.error('Error deleting event:', error);
  };

  const stats = useMemo(() => {
    const now = new Date();
    return {
      total: events.length,
      upcoming: events.filter((e: any) => {
        if (!e.startAt) return false;
        const date = e.startAt?.toDate ? e.startAt.toDate() : (e.startAt.seconds ? new Date(e.startAt.seconds * 1000) : new Date(e.startAt));
        return date > now;
      }).length,
      completed: events.filter((e: any) => {
        if (!e.startAt) return false;
        const date = e.startAt?.toDate ? e.startAt.toDate() : (e.startAt.seconds ? new Date(e.startAt.seconds * 1000) : new Date(e.startAt));
        return date < now;
      }).length,
      drafts: events.filter((e: any) => e.isPublished === false).length,
    };
  }, [events]);

  const gridStatusConfig = {
    Draft: { bg: 'bg-gray-100', text: 'text-gray-700', icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg> },
    Completed: { bg: 'bg-secondary-50', text: 'text-secondary-700', icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
    Upcoming: { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" /></svg> },
    Scheduled: { bg: 'bg-primary-50', text: 'text-primary-700', icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg> },
  };

  const listStatusConfig = {
    Draft: { bg: 'bg-gray-100', text: 'text-gray-700' },
    Completed: { bg: 'bg-secondary-50', text: 'text-secondary-700' },
    Upcoming: { bg: 'bg-emerald-50', text: 'text-emerald-700' },
    Scheduled: { bg: 'bg-primary-50', text: 'text-primary-700' },
  };

  const getStatus = (item: any) => {
    let date: Date | null = null;
    if (item.startAt) {
      if (item.startAt?.toDate) {
        date = item.startAt.toDate();
      } else if (item.startAt.seconds) {
        date = new Date(item.startAt.seconds * 1000);
      } else if (item.startAt instanceof Date) {
        date = item.startAt;
      } else {
        date = new Date(item.startAt);
      }
    }
    const status = item.isPublished === false ? 'Draft' : date ? (date < new Date() ? 'Completed' : 'Upcoming') : 'Scheduled';
    return { date, status };
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-8">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center justify-between flex-wrap gap-6">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-primary-600 rounded-2xl flex items-center justify-center text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h2a2 2 0 002-2 1 1 0 112 0 2 2 0 002 2h2a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2h-2a2 2 0 00-2 2 1 1 0 11-2 0 2 2 0 00-2-2z" /></svg>
              </div>
              <div>
                <h1 className="text-3xl font-extrabold text-gray-900">My Events</h1>
                <p className="text-sm text-gray-500 mt-1">Manage and track all your events in one place</p>
              </div>
            </div>
            <a
              href="/host/events/create"
              className="flex items-center gap-2 bg-secondary-500 hover:bg-secondary-600 text-white px-6 py-3.5 rounded-xl font-bold text-sm transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              <span>Create New Event</span>
            </a>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {[
            { label: 'Total Events', value: stats.total, icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><circle cx="12" cy="12" r="9" strokeWidth={2} /></svg>, iconBg: 'bg-primary-50', iconColor: 'text-primary-600' },
            { label: 'Upcoming', value: stats.upcoming, icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" /></svg>, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
            { label: 'Completed', value: stats.completed, icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>, iconBg: 'bg-secondary-50', iconColor: 'text-secondary-600' },
            { label: 'Drafts', value: stats.drafts, icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>, iconBg: 'bg-accent-50', iconColor: 'text-accent-600' },
          ].map((stat, idx) => (
            <div key={idx} className="bg-white rounded-2xl p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{stat.label}</p>
                  <p className="text-3xl font-extrabold text-gray-900">{loading ? '...' : stat.value}</p>
                </div>
                <div className={`${stat.iconBg} ${stat.iconColor} p-3 rounded-xl`}>{stat.icon}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Filter & Search */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-8">
          <div className="mb-6">
            <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
              <span className="text-sm font-bold text-gray-600">Filter by:</span>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-xl">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white text-secondary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    title="Grid View"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white text-secondary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    title="List View"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
                </div>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-gray-50 border-none px-4 py-2.5 rounded-xl font-semibold text-sm text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer focus:ring-2 focus:ring-secondary-500 focus:bg-white"
                >
                  <option value="date">Sort by Date</option>
                  <option value="title">Sort by Title</option>
                  <option value="attendees">Sort by Attendees</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex-1 min-w-[300px]">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search events by title or description..."
                    className="w-full px-5 py-3.5 pr-12 rounded-xl border border-gray-200 focus:border-secondary-500 focus:ring-2 focus:ring-secondary-500/20 transition-colors text-gray-900 placeholder-gray-400 font-medium"
                  />
                  <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {(['all', 'upcoming', 'completed', 'drafts'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setFilter(tab)}
                    className={`px-6 py-3 rounded-xl font-bold text-sm transition-colors ${filter === tab ? 'bg-secondary-500 text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    {filter === tab && (
                      <span className="ml-2 bg-white/30 px-2 py-0.5 rounded-full text-xs">{filtered.length}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Events Display */}
        {loading ? (
          <div className="text-center py-20">
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
              <div className="absolute inset-0 rounded-full border-4 border-secondary-500 border-t-transparent animate-spin"></div>
            </div>
            <p className="text-xl font-bold text-gray-600">Loading your events...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
            <div className="w-20 h-20 rounded-2xl bg-primary-50 mx-auto flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-extrabold text-gray-900 mb-2">
              {searchQuery ? 'No events found' : 'No events yet'}
            </h3>
            <p className="text-gray-500 mb-8">
              {searchQuery ? 'Try adjusting your search or filters' : 'Create your first event to get started'}
            </p>
            {!searchQuery && (
              <a
                href="/host/events/create"
                className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-secondary-500 hover:bg-secondary-600 text-white font-bold text-sm transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                Create Your First Event
              </a>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          // Grid View
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filtered.map((item: any) => {
              const { date, status } = getStatus(item);
              const config = gridStatusConfig[status as keyof typeof gridStatusConfig];

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-primary-200 transition-colors"
                >
                  <div className="relative h-48 bg-secondary-500 overflow-hidden">
                    {item.posterURL ? (
                      <img src={item.posterURL} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                        <div className="absolute inset-0 flex items-center justify-center text-white">
                          <div className="text-center">
                            <div className="w-16 h-16 mx-auto mb-4 bg-white/20 rounded-2xl flex items-center justify-center">
                              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <h3 className="text-xl font-black px-4 line-clamp-2">{item.title}</h3>
                          </div>
                        </div>
                      </>
                    )}
                    <div className="absolute top-4 right-4">
                      <div className={`${config.bg} ${config.text} px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2`}>
                        <span>{config.icon}</span>
                        <span>{status}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 space-y-4">
                    <div className="flex items-center gap-3 text-sm">
                      <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl font-semibold text-gray-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>{date ? date.toLocaleDateString() : 'Date TBD'}</span>
                      </div>
                      <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl font-semibold text-gray-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span>{item.currentAttendees || 0} attending</span>
                      </div>
                    </div>

                    <p className="text-gray-500 text-sm line-clamp-3 leading-relaxed">
                      {item.description || 'No description available'}
                    </p>

                    <div className="grid grid-cols-3 gap-3 pt-4">
                      <a
                        href={`/host/events/${item.id}`}
                        className="flex items-center justify-center gap-2 bg-primary-50 text-primary-600 py-3 px-4 rounded-xl text-sm font-bold hover:bg-primary-100 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <span>View</span>
                      </a>
                      <a
                        href={`/host/events/${item.id}/attendees`}
                        className="flex items-center justify-center gap-2 bg-secondary-50 text-secondary-600 py-3 px-4 rounded-xl text-sm font-bold hover:bg-secondary-100 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        <span>Attendees</span>
                      </a>
                      <a
                        href={`/host/events/${item.id}/edit`}
                        className="flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 py-3 px-4 rounded-xl text-sm font-bold hover:border-primary-300 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <span>Edit</span>
                      </a>
                    </div>

                    <button
                      onClick={() => removeEvent(item.id, item.title)}
                      className="w-full flex items-center justify-center gap-2 bg-red-50 border border-red-200 text-red-600 py-3 px-4 rounded-xl text-sm font-bold hover:bg-red-100 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span>Delete Event</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // List View
          <div className="space-y-4">
            {filtered.map((item: any) => {
              const { date, status } = getStatus(item);
              const config = listStatusConfig[status as keyof typeof listStatusConfig];

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-primary-200 transition-colors"
                >
                  <div className="flex items-center gap-6">
                    <div className="flex-shrink-0 w-14 h-14 bg-secondary-500 rounded-xl flex items-center justify-center text-white">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h2a2 2 0 002-2 1 1 0 112 0 2 2 0 002 2h2a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2h-2a2 2 0 00-2 2 1 1 0 11-2 0 2 2 0 00-2-2z" /></svg>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-extrabold text-gray-900 truncate">{item.title}</h3>
                        <div className={`${config.bg} ${config.text} px-3 py-1 rounded-lg text-xs font-black`}>
                          <span>{status}</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 line-clamp-1 mb-3">
                        {item.description || 'No description available'}
                      </p>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg font-semibold text-gray-600">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>{date ? date.toLocaleDateString() : 'Date TBD'}</span>
                        </span>
                        <span className="flex items-center gap-2 bg-secondary-50 px-3 py-1.5 rounded-lg font-semibold text-secondary-700">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          <span>{item.currentAttendees || 0} attendees</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      <a
                        href={`/host/events/${item.id}/attendees`}
                        className="p-3 bg-secondary-50 text-secondary-600 rounded-xl hover:bg-secondary-100 transition-colors"
                        title="Manage Attendees"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      </a>
                      <a
                        href={`/host/events/${item.id}/announcements`}
                        className="p-3 bg-primary-50 text-primary-600 rounded-xl hover:bg-primary-100 transition-colors"
                        title="Announcements"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>
                      </a>
                      <a
                        href={`/host/events/${item.id}/edit`}
                        className="p-3 bg-primary-50 text-primary-600 rounded-xl hover:bg-primary-100 transition-colors"
                        title="Edit Event"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </a>
                      <button
                        onClick={() => removeEvent(item.id, item.title)}
                        className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
                        title="Delete Event"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style jsx global>{`
        .line-clamp-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}