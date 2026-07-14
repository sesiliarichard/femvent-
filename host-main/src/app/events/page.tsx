/**
 * ENHANCED EVENTS LIST PAGE (/events)
 * Premium events display with filtering, search, and modern UI
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

    // Filter by status
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

    // Filter by search
    if (searchQuery) {
      result = result.filter((e: any) => 
        e.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-rose-50 relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary-400/10 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-secondary-400/10 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
      </div>

      <div className="relative z-10 p-8">
        {/* Premium Header */}
        <div className="mb-10 animate-[fadeIn_0.8s_ease-out]">
          <div className="flex items-center justify-between flex-wrap gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-secondary-500 to-accent-600 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg">
                  🎫
                </div>
                <div>
                  <h1 className="text-5xl font-black bg-gradient-to-r from-purple-900 via-secondary-900 to-accent-900 bg-clip-text text-transparent">
                    My Events
                  </h1>
                  <p className="text-lg text-purple-600 font-medium mt-1">
                    Manage and track all your events in one place
                  </p>
                </div>
              </div>
            </div>
            <a 
              href="/events/create" 
              className="group relative bg-gradient-to-r from-secondary-500 via-secondary-600 to-accent-500 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:shadow-2xl hover:shadow-secondary-500/40 hover:scale-105 transition-all duration-300 active:scale-95 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-accent-500 to-secondary-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex items-center gap-3">
                <svg className="w-6 h-6 group-hover:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                <span>Create New Event</span>
              </div>
            </a>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {[
            { label: 'Total Events', value: stats.total, icon: '🎯', color: 'from-secondary-500 to-accent-500', bgColor: 'bg-pink-50' },
            { label: 'Upcoming', value: stats.upcoming, icon: '🚀', color: 'from-emerald-500 to-teal-500', bgColor: 'bg-emerald-50' },
            { label: 'Completed', value: stats.completed, icon: '✅', color: 'from-purple-500 to-pink-500', bgColor: 'bg-purple-50' },
            { label: 'Drafts', value: stats.drafts, icon: '📝', color: 'from-amber-500 to-orange-500', bgColor: 'bg-amber-50' },
          ].map((stat, idx) => (
            <div
              key={idx}
              className="group relative bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-pink-200/50 hover:border-purple-300/50 hover:shadow-2xl transition-all duration-500 cursor-pointer overflow-hidden"
              style={{ animation: `slideUp 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) ${idx * 0.1}s backwards` }}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-purple-500 uppercase tracking-wider mb-2">{stat.label}</p>
                  <p className="text-4xl font-black text-purple-900 group-hover:scale-110 transition-transform duration-300">
                    {loading ? '...' : stat.value}
                  </p>
                </div>
                <div className={`${stat.bgColor} p-4 rounded-2xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
                  <span className="text-3xl">{stat.icon}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filter & Search Section */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-pink-200/50 shadow-xl p-8 mb-8">
          {/* Filter Tabs */}
          <div className="mb-6">
            <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-purple-600">Filter by:</span>
              </div>
              <div className="flex items-center gap-3">
                {/* View Mode Toggle */}
                <div className="flex items-center gap-2 bg-pink-100 p-1.5 rounded-xl">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2.5 rounded-lg transition-all duration-300 ${
                      viewMode === 'grid'
                        ? 'bg-white text-secondary-600 shadow-lg'
                        : 'text-purple-600 hover:text-purple-900'
                    }`}
                    title="Grid View"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2.5 rounded-lg transition-all duration-300 ${
                      viewMode === 'list'
                        ? 'bg-white text-secondary-600 shadow-lg'
                        : 'text-purple-600 hover:text-purple-900'
                    }`}
                    title="List View"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
                </div>

                {/* Sort Dropdown */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-pink-100 border-none px-4 py-2.5 rounded-xl font-semibold text-sm text-purple-700 hover:bg-pink-200 transition-all duration-300 cursor-pointer focus:ring-2 focus:ring-secondary-500 focus:bg-white"
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
                    className="w-full px-6 py-4 pr-12 rounded-2xl border-2 border-pink-200 focus:border-secondary-500 focus:ring-4 focus:ring-secondary-500/20 transition-all duration-300 text-purple-900 placeholder-purple-400 font-medium"
                  />
                  <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {(['all', 'upcoming', 'completed', 'drafts'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setFilter(tab)}
                    className={`px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${
                      filter === tab
                        ? 'bg-gradient-to-r from-secondary-500 to-accent-500 text-white shadow-lg shadow-secondary-500/30 scale-105'
                        : 'bg-pink-100 text-purple-600 hover:bg-pink-200 hover:scale-105'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    {filter === tab && (
                      <span className="ml-2 bg-white/30 px-2 py-0.5 rounded-full text-xs">
                        {filtered.length}
                      </span>
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
              <div className="absolute inset-0 rounded-full border-4 border-pink-200"></div>
              <div className="absolute inset-0 rounded-full border-4 border-secondary-500 border-t-transparent animate-spin"></div>
            </div>
            <p className="text-xl font-bold text-purple-600">Loading your events...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white/80 backdrop-blur-xl rounded-3xl border border-pink-200/50 shadow-xl">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-pink-100 to-purple-100 mx-auto flex items-center justify-center mb-6">
              <svg className="w-12 h-12 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-black text-purple-900 mb-3">
              {searchQuery ? 'No events found' : 'No events yet'}
            </h3>
            <p className="text-lg text-purple-500 mb-8">
              {searchQuery 
                ? 'Try adjusting your search or filters' 
                : 'Create your first event to get started'}
            </p>
            {!searchQuery && (
              <a 
                href="/events/create" 
                className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-secondary-500 to-accent-500 text-white font-bold hover:shadow-xl hover:shadow-secondary-500/30 hover:scale-105 transition-all duration-300"
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
            {filtered.map((item: any, idx: number) => {
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
              const statusConfig = {
                Draft: { bg: 'from-slate-100 to-slate-200', text: 'text-slate-700', icon: '📝' },
                Completed: { bg: 'from-purple-100 to-pink-100', text: 'text-purple-700', icon: '✅' },
                Upcoming: { bg: 'from-emerald-100 to-teal-100', text: 'text-emerald-700', icon: '🚀' },
                Scheduled: { bg: 'from-blue-100 to-cyan-100', text: 'text-blue-700', icon: '📅' },
              };
              const config = statusConfig[status as keyof typeof statusConfig];

              return (
                <div
                  key={item.id}
                  className="group bg-white/80 backdrop-blur-xl rounded-3xl overflow-hidden border border-pink-200/50 hover:border-purple-300/50 hover:shadow-2xl transition-all duration-500"
                  style={{ animation: `slideUp 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) ${idx * 0.1}s backwards` }}
                >
                  {/* Event Header Image */}
                  <div className="relative h-56 bg-gradient-to-br from-secondary-500 via-accent-500 to-rose-500 overflow-hidden">
                    {item.posterURL ? (
                      <img
                        src={item.posterURL}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                        <div className="absolute inset-0 flex items-center justify-center text-white">
                          <div className="text-center">
                            <div className="w-16 h-16 mx-auto mb-4 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <h3 className="text-xl font-black px-4 line-clamp-2">{item.title}</h3>
                          </div>
                        </div>
                      </>
                    )}
                    
                    {/* Status Badge */}
                    <div className="absolute top-4 right-4">
                      <div className={`bg-gradient-to-r ${config.bg} ${config.text} px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 shadow-lg`}>
                        <span>{config.icon}</span>
                        <span>{status}</span>
                      </div>
                    </div>
                  </div>

                  {/* Event Content */}
                  <div className="p-6 space-y-4">
                    {/* Date & Attendees */}
                    <div className="flex items-center gap-3 text-sm">
                      <div className="flex items-center gap-2 bg-pink-100 px-3 py-2 rounded-xl font-semibold text-purple-700">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>{date ? date.toLocaleDateString() : 'Date TBD'}</span>
                      </div>
                      <div className="flex items-center gap-2 bg-purple-100 px-3 py-2 rounded-xl font-semibold text-purple-700">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span>{item.currentAttendees || 0} attending</span>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-purple-600 text-sm line-clamp-3 leading-relaxed">
                      {item.description || 'No description available'}
                    </p>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-3 gap-3 pt-4">
                      <a
                        href={`/events/${item.id}`}
                        className="group/btn flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3 px-4 rounded-xl text-sm font-bold hover:shadow-xl hover:shadow-emerald-500/30 hover:scale-105 transition-all duration-300"
                      >
                        <svg className="w-4 h-4 group-hover/btn:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <span>View</span>
                      </a>
                      <a
                        href={`/events/${item.id}/attendees`}
                        className="group/btn flex items-center justify-center gap-2 bg-gradient-to-r from-secondary-500 to-accent-500 text-white py-3 px-4 rounded-xl text-sm font-bold hover:shadow-xl hover:shadow-secondary-500/30 hover:scale-105 transition-all duration-300"
                      >
                        <svg className="w-4 h-4 group-hover/btn:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        <span>Attendees</span>
                      </a>
                      <a
                        href={`/events/${item.id}/edit`}
                        className="group/btn flex items-center justify-center gap-2 bg-white border-2 border-pink-300 text-purple-700 py-3 px-4 rounded-xl text-sm font-bold hover:border-purple-400 hover:bg-pink-50 hover:scale-105 transition-all duration-300"
                      >
                        <svg className="w-4 h-4 group-hover/btn:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <span>Edit</span>
                      </a>
                    </div>

                    {/* Delete Button */}
                    <button
                      onClick={() => removeEvent(item.id, item.title)}
                      className="group/btn w-full flex items-center justify-center gap-2 bg-red-50 border-2 border-red-200 text-red-600 py-3 px-4 rounded-xl text-sm font-bold hover:bg-red-100 hover:border-red-300 hover:scale-105 transition-all duration-300"
                    >
                      <svg className="w-4 h-4 group-hover/btn:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            {filtered.map((item: any, idx: number) => {
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
              const statusConfig = {
                Draft: { bg: 'from-slate-100 to-slate-200', text: 'text-slate-700', icon: '📝' },
                Completed: { bg: 'from-purple-100 to-pink-100', text: 'text-purple-700', icon: '✅' },
                Upcoming: { bg: 'from-emerald-100 to-teal-100', text: 'text-emerald-700', icon: '🚀' },
                Scheduled: { bg: 'from-blue-100 to-cyan-100', text: 'text-blue-700', icon: '📅' },
              };
              const config = statusConfig[status as keyof typeof statusConfig];

              return (
                <div
                  key={item.id}
                  className="group bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-pink-200/50 hover:border-purple-300/50 hover:shadow-2xl transition-all duration-500"
                  style={{ animation: `slideRight 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) ${idx * 0.05}s backwards` }}
                >
                  <div className="flex items-center gap-6">
                    {/* Event Icon */}
                    <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-secondary-500 to-accent-500 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                      🎫
                    </div>

                    {/* Event Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-black text-purple-900 truncate group-hover:text-secondary-600 transition-colors duration-300">
                          {item.title}
                        </h3>
                        <div className={`bg-gradient-to-r ${config.bg} ${config.text} px-3 py-1 rounded-lg text-xs font-black flex items-center gap-1.5`}>
                          <span>{config.icon}</span>
                          <span>{status}</span>
                        </div>
                      </div>
                      <p className="text-sm text-purple-600 line-clamp-1 mb-3">
                        {item.description || 'No description available'}
                      </p>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-2 bg-pink-100 px-3 py-1.5 rounded-lg font-semibold text-purple-700">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>{date ? date.toLocaleDateString() : 'Date TBD'}</span>
                        </span>
                        <span className="flex items-center gap-2 bg-rose-100 px-3 py-1.5 rounded-lg font-semibold text-rose-700">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          <span>{item.currentAttendees || 0} attendees</span>
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <a
                        href={`/events/${item.id}/attendees`}
                        className="group/btn p-3 bg-pink-100 text-secondary-600 rounded-xl hover:bg-pink-200 hover:scale-110 transition-all duration-300"
                        title="Manage Attendees"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      </a>
                      <a
                        href={`/events/${item.id}/edit`}
                        className="group/btn p-3 bg-pink-100 text-purple-600 rounded-xl hover:bg-pink-200 hover:scale-110 transition-all duration-300"
                        title="Edit Event"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </a>
                      <button
                        onClick={() => removeEvent(item.id, item.title)}
                        className="group/btn p-3 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 hover:scale-110 transition-all duration-300"
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