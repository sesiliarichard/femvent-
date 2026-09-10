/**
 * SHARED DASHBOARD LAYOUT COMPONENT
 * Reusable layout with sidebar and top navigation for all host pages
 */
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
interface DashboardLayoutProps {
  children: React.ReactNode;
  currentPage?: string;
}

export default function DashboardLayout({ children, currentPage = 'dashboard' }: DashboardLayoutProps) {
  const { userProfile, logout } = useAuth();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Add shadow depth to topbar on scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

// Fetch events for notifications
useEffect(() => {
  if (!userProfile?.id) return;

  const loadEvents = async () => {
    const { data } = await supabase
      .from('events')
      .select('*')
      .eq('host_id', userProfile.id)
      .order('created_at', { ascending: false });
    setEvents(data || []);
  };

  loadEvents();

  const channel = supabase
    .channel('dashboard-layout-events')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'events', filter: `host_id=eq.${userProfile.id}` }, loadEvents)
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [userProfile?.id]);

 // Real-time notifications listener
 useEffect(() => {
  if (!userProfile?.id || events.length === 0) return;

  const eventIds = events.slice(0, 10).map((e: any) => e.id);
  if (eventIds.length === 0) return;

  const channel = supabase
    .channel('dashboard-layout-tickets')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'tickets' },
      (payload: any) => {
        const ticket = payload.new;
        if (!eventIds.includes(ticket.event_id) || ticket.status !== 'confirmed') return;

        const event = events.find((e: any) => e.id === ticket.event_id);
        const newNotification = {
          id: ticket.id,
          message: `New attendee registered for ${event?.title || 'your event'}`,
          timestamp: ticket.created_at ? new Date(ticket.created_at) : new Date(),
          read: false,
          type: 'attendee',
        };

        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [userProfile?.id, events]);

  const markNotificationAsRead = (notifId: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notifId ? { ...notif, read: true } : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
    setUnreadCount(0);
  };

  const formatTime = (date: any) => {
    if (!date) return '';
    if (!mounted) return '';
    
    try {
      const dateObj = date?.toDate ? date.toDate() : 
        (date?.seconds ? new Date(date.seconds * 1000) : new Date(date));
      return dateObj.toLocaleTimeString();
    } catch {
      return '';
    }
  };

  const initials = (userProfile?.name || 'Host')
    .split(' ')
    .map((p: string) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

   const navigation = [
    {
      label: 'Dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.25} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      href: '/host/dashboard',
      key: 'dashboard',
    },
    {
      label: 'Events',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.25} d="M6 5.5a1.5 1.5 0 011.5-1.5h9A1.5 1.5 0 0118 5.5v1.75a1.75 1.75 0 000 3.5V12.5a1.75 1.75 0 000 3.5v1.75a1.5 1.5 0 01-1.5 1.5h-9A1.5 1.5 0 016 18.25v-1.75a1.75 1.75 0 000-3.5v-1.75a1.75 1.75 0 000-3.5V5.5z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.25} strokeDasharray="2 2.5" d="M12 5v14" />
        </svg>
      ),
      href: '/host/events',
      key: 'events',
    },
    {
      label: 'Attendees',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.25} d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4zm6 0a4 4 0 10-3.87-5H15" />
        </svg>
      ),
      href: '/host/attendees',
      key: 'attendees',
    },
    {
      label: 'Analytics',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.25} d="M9 19v-6.5m0 0L4 15.5M9 12.5l4-4m2 10.5V9m0 0l-4-4m4 4l4-4m1 12.5V5" />
        </svg>
      ),
      href: '/host/analytics',
      key: 'analytics',
    },
    {
      label: 'Create Event',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.25} d="M12 4v16m8-8H4" />
        </svg>
      ),
      href: '/host/events/create',
      key: 'create',
    },
    {
      label: 'Settings',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.25} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.25} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      href: '/host/settings',
      key: 'settings',
    },
  ];

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Sidebar - desktop */}
      <aside
        className={`hidden lg:flex fixed left-0 top-0 h-screen ${
          isCollapsed ? 'w-20' : 'w-64'
        } bg-white border-r border-slate-100 transition-all duration-300 z-50 shadow-[4px_0_24px_-8px_rgba(90,68,133,0.08)]`}
      >
        <div className="flex flex-col h-full w-full">
          {/* Logo */}
          <div className="h-20 flex items-center justify-between px-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 via-secondary-500 to-accent-500 flex items-center justify-center flex-shrink-0 shadow-md shadow-primary-500/20">
                <span className="text-white font-extrabold text-sm">F</span>
              </div>
              {!isCollapsed && (
                <h1 className="text-xl font-extrabold bg-gradient-to-r from-primary-600 to-secondary-500 bg-clip-text text-transparent truncate">
                  Host
                </h1>
              )}
            </div>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-2 hover:bg-primary-50 rounded-lg transition-colors flex-shrink-0"
            >
              <svg
                className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-3 space-y-1">
            {navigation.map((item) => {
              const isActive = currentPage === item.key;
              return (
                <a
                  key={item.key}
                  href={item.href}
                  className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-primary-50 to-secondary-50 text-primary-700 font-semibold'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-gradient-to-b from-primary-500 to-secondary-500" />
                  )}
                  <span
                    className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                      isActive
                        ? 'bg-white text-primary-600 shadow-sm'
                        : 'bg-transparent text-slate-400 group-hover:bg-white group-hover:text-primary-500 group-hover:shadow-sm'
                    }`}
                  >
                    {item.icon}
                  </span>
                  {!isCollapsed && <span className="text-sm">{item.label}</span>}
                </a>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-3 border-t border-slate-100">
            <button
              onClick={logout as any}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors text-sm font-semibold"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              {!isCollapsed && <span>Sign Out</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Sidebar - mobile drawer */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-64 bg-white border-r border-slate-100 shadow-2xl">
            <div className="flex flex-col h-full">
              <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 via-secondary-500 to-accent-500 flex items-center justify-center">
                    <span className="text-white font-extrabold text-xs">F</span>
                  </div>
                  <h1 className="text-lg font-extrabold bg-gradient-to-r from-primary-600 to-secondary-500 bg-clip-text text-transparent">
                    Host
                  </h1>
                </div>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-2 hover:bg-primary-50 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <nav className="flex-1 overflow-y-auto p-3 space-y-1">
                {navigation.map((item) => {
                  const isActive = currentPage === item.key;
                  return (
                    <a
                      key={item.key}
                      href={item.href}
                      onClick={() => setIsSidebarOpen(false)}
                      className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer ${
                        isActive
                          ? 'bg-gradient-to-r from-primary-50 to-secondary-50 text-primary-700 font-semibold'
                          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-gradient-to-b from-primary-500 to-secondary-500" />
                      )}
                      <span
                        className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${
                          isActive ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-400'
                        }`}
                      >
                        {item.icon}
                      </span>
                      <span className="text-sm">{item.label}</span>
                    </a>
                  );
                })}
              </nav>
              <div className="p-3 border-t border-slate-100">
                <button
                  onClick={logout as any}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors text-sm font-semibold"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className={`${isCollapsed ? 'lg:ml-20' : 'lg:ml-64'} ml-0 transition-all duration-300`}>
        {/* Top Navigation */}
        <header
          className={`sticky top-0 z-40 bg-white/90 backdrop-blur-sm border-b border-slate-100 transition-shadow duration-200 ${
            scrolled ? 'shadow-[0_4px_20px_-8px_rgba(90,68,133,0.15)]' : ''
          }`}
        >
          {/* Brand gradient hairline */}
          <div className="h-[3px] w-full bg-gradient-to-r from-primary-500 via-secondary-500 to-accent-500" />

          <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16 lg:h-20">
            <div className="flex items-center flex-1 gap-3">
              <button
                className="lg:hidden inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-primary-600 bg-white shadow-sm active:scale-95 transition"
                onClick={() => setIsSidebarOpen(true)}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h10" />
                </svg>
              </button>
              <div className="relative w-full max-w-lg group">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-primary-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search events..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 bg-slate-50 focus:bg-white transition-colors text-sm"
                />
              </div>
            </div>
            <div className="flex items-center space-x-3 ml-4">
              {/* Notification Bell */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2.5 hover:bg-primary-50 rounded-xl transition-colors relative"
                >
                  <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 bg-gradient-to-br from-secondary-500 to-accent-500 rounded-full flex items-center justify-center ring-2 ring-white">
                      <span className="text-[10px] text-white font-bold leading-none">{unreadCount > 9 ? '9+' : unreadCount}</span>
                    </span>
                  )}
                </button>

                {/* Notification Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 top-14 w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 max-h-96 overflow-hidden flex flex-col">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-primary-50 to-secondary-50">
                      <h3 className="font-bold text-slate-900">Notifications</h3>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-xs text-primary-600 hover:text-primary-700 font-semibold"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>

                    <div className="overflow-y-auto flex-1">
                      {notifications.length > 0 ? (
                        notifications.map((notif) => (
                          <div
                            key={notif.id}
                            onClick={() => markNotificationAsRead(notif.id)}
                            className={`px-6 py-4 border-b border-slate-50 cursor-pointer transition-colors ${
                              notif.read ? 'bg-white' : 'bg-primary-50/50 hover:bg-primary-50'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <p className={`text-sm ${notif.read ? 'text-slate-600' : 'font-semibold text-slate-900'}`}>
                                  {notif.message}
                                </p>
                                <p className="text-xs text-slate-400 mt-1">
                                  {formatTime(notif.timestamp)}
                                </p>
                              </div>
                              {!notif.read && (
                                <div className="w-2 h-2 bg-secondary-500 rounded-full mt-1.5 flex-shrink-0"></div>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="px-6 py-12 text-center">
                          <p className="text-sm text-slate-400">No notifications yet</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-secondary-500 to-accent-500 cursor-pointer hover:shadow-lg hover:shadow-secondary-500/30 transition-shadow ring-2 ring-white flex items-center justify-center">
                <span className="text-white text-xs font-bold">{initials}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}