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

  useEffect(() => {
    setMounted(true);
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

  const navigation = [
    { label: 'Dashboard', icon: '📊', href: '/dashboard', key: 'dashboard' },
    { label: 'Events', icon: '🎫', href: '/events', key: 'events' },
    { label: 'Attendees', icon: '👥', href: '/attendees', key: 'attendees' },
    { label: 'Analytics', icon: '📈', href: '/analytics', key: 'analytics' },
    { label: 'Create Event', icon: '➕', href: '/events/create', key: 'create' },
    { label: 'Settings', icon: '⚙️', href: '/settings', key: 'settings' },
  ];

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Sidebar - desktop */}
      <aside
        className={`hidden lg:flex fixed left-0 top-0 h-screen ${
          isCollapsed ? 'w-20' : 'w-64'
        } bg-white border-r border-slate-200 transition-all duration-300 z-50 shadow-lg`}
      >
        <div className="flex flex-col h-full w-full">
          {/* Logo */}
          <div className="h-20 flex items-center justify-between px-4 border-b border-slate-200">
            {!isCollapsed && (
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Host
              </h1>
            )}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-2 hover:bg-slate-100 rounded-lg transition"
            >
              <svg
                className={`w-5 h-5 transition-transform ${isCollapsed ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-2">
            {navigation.map((item) => {
              const isActive = currentPage === item.key;
              return (
                <a
                  key={item.key}
                  href={item.href}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition cursor-pointer ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  {!isCollapsed && <span className="text-sm">{item.label}</span>}
                </a>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-slate-200 space-y-2">
            <button 
              onClick={logout as any}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition text-sm font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          <div className="absolute inset-0 bg-black/40" onClick={() => setIsSidebarOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-64 bg-white border-r border-slate-200 shadow-lg">
            <div className="flex flex-col h-full">
              <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200">
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Host
                </h1>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-2 hover:bg-pink-100 rounded-lg transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <nav className="flex-1 overflow-y-auto p-4 space-y-2">
                {navigation.map((item) => {
                  const isActive = currentPage === item.key;
                  return (
                    <a
                      key={item.key}
                      href={item.href}
                      onClick={() => setIsSidebarOpen(false)}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition cursor-pointer ${
                        isActive
                          ? 'bg-gradient-to-r from-secondary-50 to-accent-50 text-secondary-600 font-medium'
                          : 'text-purple-600 hover:bg-pink-50'
                      }`}
                    >
                      <span className="text-xl">{item.icon}</span>
                      <span className="text-sm">{item.label}</span>
                    </a>
                  );
                })}
              </nav>
              <div className="p-4 border-t border-pink-200 space-y-2">
                <button 
                  onClick={logout as any}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition text-sm font-medium"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <header className="sticky top-0 z-40 bg-white/80 border-b border-pink-200 shadow-sm backdrop-blur-sm">
          <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16 lg:h-20">
            <div className="flex items-center flex-1 gap-3">
              <button
                className="lg:hidden inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-pink-200 text-purple-700 bg-white shadow-sm active:scale-95 transition"
                onClick={() => setIsSidebarOpen(true)}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h10" />
                </svg>
              </button>
              <div className="relative w-full max-w-lg">
                <svg className="absolute left-3 top-3 text-slate-400 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search events..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                />
              </div>
            </div>
            <div className="flex items-center space-x-4 ml-4">
              {/* Notification Bell */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition relative"
                >
                  <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse flex items-center justify-center">
                      <span className="text-xs text-white font-bold">{unreadCount > 9 ? '9+' : unreadCount}</span>
                    </span>
                  )}
                </button>

                {/* Notification Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 top-12 w-96 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 max-h-96 overflow-hidden flex flex-col">
                    <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                      <h3 className="font-semibold text-slate-900">Notifications</h3>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-xs text-blue-600 hover:text-blue-700 font-medium"
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
                            className={`px-6 py-4 border-b border-pink-100 cursor-pointer transition ${
                              notif.read ? 'bg-white' : 'bg-pink-50 hover:bg-pink-100'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <p className={`text-sm ${notif.read ? 'text-purple-600' : 'font-semibold text-purple-900'}`}>
                                  {notif.message}
                                </p>
                                <p className="text-xs text-purple-500 mt-1">
                                  {formatTime(notif.timestamp)}
                                </p>
                              </div>
                              {!notif.read && (
                                <div className="w-2 h-2 bg-secondary-600 rounded-full mt-1.5 flex-shrink-0"></div>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="px-6 py-12 text-center">
                          <p className="text-sm text-purple-500">No notifications yet</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-secondary-500 to-accent-500 cursor-pointer hover:shadow-lg transition"></div>
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
