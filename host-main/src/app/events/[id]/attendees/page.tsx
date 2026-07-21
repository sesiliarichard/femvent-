'use client';

import React, { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import BulkActionsBar from '@/components/BulkActionsBar';
import BulkEmailModal from '@/components/BulkEmailModal';
import BulkSMSModal from '@/components/BulkSMSModal';

interface Attendee {
  id: string;
  userId: string;
  eventId: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: Date;
  paymentId: string;
  paymentAmount?: number;
  paymentMethod?: string;
  confirmedAt?: Date;
  userInfo?: {
    name: string;
    email: string;
    phone?: string;
    company?: string;
    jobTitle?: string;
    avatar?: string;
  };
  ticketType?: string;
  checkInStatus?: 'checked-in' | 'not-checked-in';
  checkInTime?: Date;
}

function EventAttendeesContent() {
  const { userProfile } = useAuth();
  const params = useParams();
  const router = useRouter();
  const eventId = params?.id as string;

  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showBulkActionModal, setShowBulkActionModal] = useState(false);
  const [selectedAttendee, setSelectedAttendee] = useState<Attendee | null>(null);
  const [selectedAttendees, setSelectedAttendees] = useState<Set<string>>(new Set());
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'confirmed' | 'pending' | 'cancelled'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'status'>('date');
  const [bulkAction, setBulkAction] = useState<'confirm' | 'message' | 'export'>('confirm');
  const [messageContent, setMessageContent] = useState('');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showBulkEmailModal, setShowBulkEmailModal] = useState(false);
  const [showBulkSMSModal, setShowBulkSMSModal] = useState(false);

  useEffect(() => {
    if (!eventId) return;

    const getEvent = async () => {
      try {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .eq('id', eventId)
          .maybeSingle();
        if (error) throw error;
        if (data) setEvent(data);
      } catch (error) {
        console.error('Error fetching event:', error);
      }
    };

    getEvent();

    const loadAttendees = async () => {
      try {
        const { data: tickets, error } = await supabase
          .from('tickets')
          .select('*, attendee:users(name, email, phone, company, job_title, photo_url)')
          .eq('event_id', eventId);

        if (error) throw error;

        const attendeesData: Attendee[] = (tickets || []).map((ticketData: any) => ({
          id: ticketData.id,
          userId: ticketData.user_id,
          eventId: ticketData.event_id,
          status: ticketData.status || 'pending',
          createdAt: ticketData.created_at ? new Date(ticketData.created_at) : new Date(),
          paymentId: ticketData.payment_id,
          paymentAmount: ticketData.payment_amount,
          paymentMethod: ticketData.payment_method,
          confirmedAt: ticketData.confirmed_at ? new Date(ticketData.confirmed_at) : undefined,
          ticketType: ticketData.ticket_type || 'Standard',
          checkInStatus: ticketData.check_in_status || 'not-checked-in',
          checkInTime: ticketData.check_in_time ? new Date(ticketData.check_in_time) : undefined,
          userInfo: {
            name: ticketData.attendee?.name || 'Unknown User',
            email: ticketData.attendee?.email || 'No email',
            phone: ticketData.attendee?.phone || '',
            company: ticketData.attendee?.company || '',
            jobTitle: ticketData.attendee?.job_title || '',
            avatar: ticketData.attendee?.photo_url || '',
          },
        }));

        setAttendees(attendeesData);
      } catch (error) {
        console.error('Error loading attendees:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAttendees();

    const channel = supabase
      .channel(`event-attendees-${eventId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tickets', filter: `event_id=eq.${eventId}` },
        loadAttendees
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId]);
  // Helper function to recalculate and update attendee count from database
  const updateAttendeeCount = async (eventId: string) => {
    try {
      const { data: confirmedTickets, error: fetchError } = await supabase
        .from('tickets')
        .select('user_id')
        .eq('event_id', eventId)
        .eq('status', 'confirmed');

      if (fetchError) throw fetchError;

      const uniqueUserIds = new Set<string>();
      (confirmedTickets || []).forEach((ticket: any) => {
        if (ticket.user_id) uniqueUserIds.add(ticket.user_id);
      });

      const { error: updateError } = await supabase
        .from('events')
        .update({ tickets_sold: uniqueUserIds.size })
        .eq('id', eventId);

      if (updateError) throw updateError;

      return uniqueUserIds.size;
    } catch (error) {
      console.error('Error updating attendee count:', error);
      throw error;
    }
  };

  const handlePaymentConfirmation = async () => {
    if (!selectedAttendee || !paymentAmount) return;

    try {
      const { error } = await supabase
      .from('tickets')
      .update({
        status: 'confirmed',
        payment_amount: parseFloat(paymentAmount),
        payment_method: paymentMethod,
        confirmed_at: new Date().toISOString(),
      })
      .eq('id', selectedAttendee.id);

    if (error) throw error;

      // Recalculate and update event's currentAttendees count from database
      if (eventId) {
        await updateAttendeeCount(eventId);
      }

      setShowPaymentModal(false);
      setSelectedAttendee(null);
      setPaymentAmount('');
      setPaymentMethod('cash');
    } catch (error) {
      console.error('Error confirming payment:', error);
      alert('Failed to confirm payment. Please try again.');
    }
  };

  const handleCheckIn = async (attendee: Attendee) => {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({
          check_in_status: attendee.checkInStatus === 'checked-in' ? 'not-checked-in' : 'checked-in',
          check_in_time: attendee.checkInStatus !== 'checked-in' ? new Date().toISOString() : null,
        })
        .eq('id', attendee.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating check-in status:', error);
    }
  };

  const handleDeleteAttendee = async (attendee: Attendee) => {
    if (!confirm(`Remove ${attendee.userInfo?.name || 'this attendee'} from this event? This will permanently delete their ticket/registration.`)) {
      return;
    }
    try {
      const { error } = await supabase
        .from('tickets')
        .delete()
        .eq('id', attendee.id);
      if (error) throw error;
      setAttendees((prev) => prev.filter((a) => a.id !== attendee.id));
      setSelectedAttendees((prev) => {
        const next = new Set(prev);
        next.delete(attendee.id);
        return next;
      });
      if (eventId) {
        await updateAttendeeCount(eventId);
      }
    } catch (error) {
      console.error('Error deleting attendee:', error);
      alert('Failed to delete attendee. Please try again.');
    }
  };

  const handleBulkConfirm = async () => {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ status: 'confirmed', confirmed_at: new Date().toISOString() })
        .in('id', Array.from(selectedAttendees));

      if (error) throw error;

      // Recalculate and update event's currentAttendees count from database
      if (eventId) {
        await updateAttendeeCount(eventId);
      }

      setSelectedAttendees(new Set());
      setShowBulkActionModal(false);
    } catch (error) {
      console.error('Error bulk confirming payments:', error);
      alert('Failed to confirm payments. Please try again.');
    }
  };

  const filteredAttendees = attendees
    .filter(a => {
      const matchesSearch = a.userInfo?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.userInfo?.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.userInfo?.company?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filterStatus === 'all' || a.status === filterStatus;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.userInfo?.name.localeCompare(b.userInfo?.name || '') || 0;
      if (sortBy === 'status') return a.status.localeCompare(b.status);
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

  const stats = {
    total: attendees.length,
    confirmed: attendees.filter(a => a.status === 'confirmed').length,
    pending: attendees.filter(a => a.status === 'pending').length,
    checkedIn: attendees.filter(a => a.checkInStatus === 'checked-in').length,
    totalRevenue: attendees
      .filter(a => a.status === 'confirmed')
      .reduce((sum, a) => sum + (a.paymentAmount || 0), 0),
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', badge: 'bg-emerald-100', gradient: 'from-emerald-500 to-teal-500' };
      case 'pending':
        return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', badge: 'bg-amber-100', gradient: 'from-amber-500 to-orange-500' };
      case 'cancelled':
        return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', badge: 'bg-red-100', gradient: 'from-red-500 to-pink-500' };
      default:
        return { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200', badge: 'bg-slate-100', gradient: 'from-slate-500 to-slate-600' };
    }
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Company', 'Phone', 'Status', 'Payment Amount', 'Registered Date'];
    const rows = filteredAttendees.map(a => [
      a.userInfo?.name || '',
      a.userInfo?.email || '',
      a.userInfo?.company || '',
      a.userInfo?.phone || '',
      a.status,
      a.paymentAmount || '',
      a.createdAt.toLocaleDateString(),
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendees-${event?.title}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 flex items-center justify-center relative overflow-hidden">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-blob"></div>
          <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
        </div>
        <div className="text-center relative z-10">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-blue-200"></div>
            <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
          </div>
          <p className="text-2xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Loading attendees...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
      </div>

      <div className="relative z-10">
        {/* Premium Header */}
        <div className="mb-10 p-8 animate-[fadeIn_0.8s_ease-out]">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between flex-wrap gap-6 mb-8">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.back()}
                  className="group p-3 hover:bg-white/80 backdrop-blur-sm rounded-2xl transition-all duration-300 hover:scale-110 hover:shadow-lg border border-slate-200/50"
                >
                  <svg className="w-6 h-6 text-slate-700 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div>
                  <h1 className="text-5xl font-black bg-gradient-to-r from-slate-900 via-blue-900 to-purple-900 bg-clip-text text-transparent">
                    Attendees Management
                  </h1>
                  <p className="text-xl text-slate-600 font-medium mt-2 flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                    {event?.title || 'Loading event...'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => router.push(`/events/${eventId}/scanner`)}
                  className="group flex items-center gap-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white px-6 py-3 rounded-2xl font-bold hover:shadow-xl hover:scale-105 transition-all duration-300"
                >
                  <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                  <span>Scan QR Code</span>
                </button>
                <div className="relative">
                  <button
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    className="group flex items-center gap-3 bg-white/80 backdrop-blur-xl border border-slate-200/50 text-slate-700 px-6 py-3 rounded-2xl font-bold hover:shadow-xl hover:scale-105 transition-all duration-300"
                  >
                    <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span>Export</span>
                  </button>
                  {showExportMenu && (
                    <div className="absolute right-0 top-16 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200/50 w-56 overflow-hidden z-50 animate-[slideUp_0.3s_ease-out]">
                      <button
                        onClick={() => { exportToCSV(); setShowExportMenu(false); }}
                        className="w-full text-left px-6 py-4 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 text-slate-700 font-semibold transition-all duration-300 flex items-center gap-3"
                      >
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Export as CSV
                      </button>
                      <button
                        onClick={() => { window.print(); setShowExportMenu(false); }}
                        className="w-full text-left px-6 py-4 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 text-slate-700 font-semibold transition-all duration-300 border-t border-slate-100 flex items-center gap-3"
                      >
                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        Print Report
                      </button>
                    </div>
                  )}
                </div>
                {selectedAttendees.size > 0 && (
                  <button
                    onClick={() => setShowBulkActionModal(true)}
                    className="group relative bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-2xl font-bold hover:shadow-2xl hover:shadow-blue-500/40 hover:scale-105 transition-all duration-300 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative flex items-center gap-2">
                      <span className="bg-white/30 px-2 py-0.5 rounded-lg text-sm font-black">
                        {selectedAttendees.size}
                      </span>
                      <span>selected</span>
                    </div>
                  </button>
                )}
              </div>
            </div>

            {/* Premium Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
              {[
                { label: 'Total Attendees', value: stats.total, icon: '👥', color: 'from-blue-500 via-blue-600 to-cyan-600', bgColor: 'bg-blue-50', textColor: 'text-blue-600' },
                { label: 'Confirmed', value: stats.confirmed, icon: '✅', color: 'from-emerald-500 via-green-500 to-teal-600', bgColor: 'bg-emerald-50', textColor: 'text-emerald-600' },
                { label: 'Pending', value: stats.pending, icon: '⏰', color: 'from-amber-500 via-orange-500 to-yellow-600', bgColor: 'bg-amber-50', textColor: 'text-amber-600' },
                { label: 'Checked In', value: stats.checkedIn, icon: '🎫', color: 'from-purple-500 via-violet-500 to-indigo-600', bgColor: 'bg-purple-50', textColor: 'text-purple-600' },
                { label: 'Revenue', value: `$${stats.totalRevenue.toFixed(0)}`, icon: '💎', color: 'from-green-500 via-emerald-500 to-teal-600', bgColor: 'bg-green-50', textColor: 'text-green-600' },
              ].map((stat, idx) => (
                <div
                  key={idx}
                  className="group relative bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-200/50 hover:border-slate-300/50 hover:shadow-2xl transition-all duration-500 cursor-pointer overflow-hidden"
                  style={{ animation: `slideUp 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) ${idx * 0.1}s backwards` }}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`${stat.bgColor} p-3 rounded-2xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg`}>
                        <span className="text-2xl">{stat.icon}</span>
                      </div>
                    </div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{stat.label}</p>
                    <p className={`text-3xl font-black ${stat.textColor} group-hover:scale-110 transition-transform duration-300`}>
                      {stat.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Search and Filters Section */}
        <div className="max-w-7xl mx-auto px-8 mb-8">
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-slate-200/50 shadow-xl p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search by name, email, or company..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-6 py-4 rounded-2xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 text-slate-900 placeholder-slate-400 font-medium bg-white"
                />
              </div>
              <div className="flex gap-3">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="px-6 py-4 rounded-2xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 bg-white font-bold text-slate-700 transition-all duration-300 cursor-pointer"
                >
                  <option value="all">All Status</option>
                  <option value="confirmed">✅ Confirmed</option>
                  <option value="pending">⏰ Pending</option>
                  <option value="cancelled">❌ Cancelled</option>
                </select>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-6 py-4 rounded-2xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 bg-white font-bold text-slate-700 transition-all duration-300 cursor-pointer"
                >
                  <option value="date">📅 Latest First</option>
                  <option value="name">🔤 Name (A-Z)</option>
                  <option value="status">📊 Status</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Attendees Display */}
        <div className="max-w-7xl mx-auto px-8 pb-8">
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-slate-200/50 shadow-2xl overflow-hidden">
            {filteredAttendees.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 mx-auto flex items-center justify-center mb-6">
                  <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-3">
                  {searchQuery ? 'No attendees found' : 'No attendees yet'}
                </h3>
                <p className="text-lg text-slate-500">
                  {searchQuery
                    ? 'Try adjusting your search or filters'
                    : 'Attendees will appear here when they register for your event'}
                </p>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-slate-50 to-blue-50/50 border-b-2 border-slate-200">
                      <tr>
                        <th className="px-6 py-5 text-left">
                          <input
                            type="checkbox"
                            checked={selectedAttendees.size === filteredAttendees.length && filteredAttendees.length > 0}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedAttendees(new Set(filteredAttendees.map(a => a.id)));
                              } else {
                                setSelectedAttendees(new Set());
                              }
                            }}
                            className="w-5 h-5 rounded-lg border-2 border-slate-300 cursor-pointer checked:bg-blue-600 checked:border-blue-600 transition-all duration-300"
                          />
                        </th>
                        <th className="px-6 py-5 text-left text-sm font-black text-slate-700 uppercase tracking-wider">Attendee</th>
                        <th className="px-6 py-5 text-left text-sm font-black text-slate-700 uppercase tracking-wider">Ticket Type</th>
                        <th className="px-6 py-5 text-left text-sm font-black text-slate-700 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-5 text-left text-sm font-black text-slate-700 uppercase tracking-wider">Payment</th>
                        <th className="px-6 py-5 text-left text-sm font-black text-slate-700 uppercase tracking-wider">Check-in</th>
                        <th className="px-6 py-5 text-left text-sm font-black text-slate-700 uppercase tracking-wider">Registered</th>
                        <th className="px-6 py-5 text-center text-sm font-black text-slate-700 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredAttendees.map((attendee, idx) => {
                        const colors = getStatusColor(attendee.status);
                        return (
                          <tr
                            key={attendee.id}
                            className="group hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/30 transition-all duration-300"
                            style={{ animation: `fadeIn 0.5s ease-out ${idx * 0.05}s backwards` }}
                          >
                            <td className="px-6 py-5">
                              <input
                                type="checkbox"
                                checked={selectedAttendees.has(attendee.id)}
                                onChange={(e) => {
                                  const newSelected = new Set(selectedAttendees);
                                  if (e.target.checked) {
                                    newSelected.add(attendee.id);
                                  } else {
                                    newSelected.delete(attendee.id);
                                  }
                                  setSelectedAttendees(newSelected);
                                }}
                                className="w-5 h-5 rounded-lg border-2 border-slate-300 cursor-pointer checked:bg-blue-600 checked:border-blue-600 transition-all duration-300"
                              />
                            </td>
                            <td className="px-6 py-5">
                              <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${colors.gradient} flex items-center justify-center text-white text-lg font-black shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
                                  {attendee.userInfo?.name?.charAt(0).toUpperCase() || '?'}
                                </div>
                                <div>
                                  <p className="font-black text-slate-900 group-hover:text-blue-600 transition-colors duration-300">
                                    {attendee.userInfo?.name}
                                  </p>
                                  <p className="text-sm text-slate-500 font-medium">{attendee.userInfo?.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-5">
                              <span className="text-sm text-slate-700 font-bold bg-slate-100 px-3 py-1.5 rounded-lg">
                                {attendee.ticketType}
                              </span>
                            </td>
                            <td className="px-6 py-5">
                              <span className={`px-4 py-2 rounded-xl text-xs font-black ${colors.badge} ${colors.text} uppercase tracking-wide`}>
                                {attendee.status}
                              </span>
                            </td>
                            <td className="px-6 py-5">
                              {attendee.status === 'confirmed' ? (
                                <span className="text-base font-black text-emerald-600">
                                  ${attendee.paymentAmount || '0'}
                                </span>
                              ) : (
                                <button
                                  onClick={() => {
                                    setSelectedAttendee(attendee);
                                    setShowPaymentModal(true);
                                  }}
                                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-bold hover:shadow-lg hover:scale-105 transition-all duration-300"
                                >
                                  Record
                                </button>
                              )}
                            </td>
                            <td className="px-6 py-5">
                              <button
                                onClick={() => handleCheckIn(attendee)}
                                className={`px-4 py-2 rounded-xl text-xs font-black transition-all duration-300 ${attendee.checkInStatus === 'checked-in'
                                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg'
                                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:scale-105'
                                  }`}
                              >
                                {attendee.checkInStatus === 'checked-in' ? '✓ Checked' : 'Check In'}
                              </button>
                            </td>
                            <td className="px-6 py-5 text-sm text-slate-600 font-semibold">
                              {attendee.createdAt.toLocaleDateString()}
                            </td>
                            <td className="px-6 py-5">
                              <div className="flex justify-center gap-2">
                                <button
                                  onClick={() => {
                                    setSelectedAttendee(attendee);
                                    setShowDetailModal(true);
                                  }}
                                  className="p-3 hover:bg-blue-100 rounded-xl transition-all duration-300 hover:scale-110 group/btn"
                                >
                                  <svg className="w-5 h-5 text-slate-600 group-hover/btn:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handleDeleteAttendee(attendee)}
                                  className="p-3 hover:bg-red-100 rounded-xl transition-all duration-300 hover:scale-110 group/btn"
                                  title="Remove attendee"
                                >
                                  <svg className="w-5 h-5 text-slate-600 group-hover/btn:text-red-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="lg:hidden space-y-4 p-6">
                  {filteredAttendees.map((attendee, idx) => {
                    const colors = getStatusColor(attendee.status);
                    return (
                      <div
                        key={attendee.id}
                        className="bg-white border-2 border-slate-200 rounded-2xl p-6 hover:shadow-xl transition-all duration-300"
                        style={{ animation: `slideUp 0.5s ease-out ${idx * 0.05}s backwards` }}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-4 flex-1">
                            <input
                              type="checkbox"
                              checked={selectedAttendees.has(attendee.id)}
                              onChange={(e) => {
                                const newSelected = new Set(selectedAttendees);
                                if (e.target.checked) {
                                  newSelected.add(attendee.id);
                                } else {
                                  newSelected.delete(attendee.id);
                                }
                                setSelectedAttendees(newSelected);
                              }}
                              className="w-5 h-5 rounded-lg border-2 border-slate-300"
                            />
                            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${colors.gradient} flex items-center justify-center text-white text-xl font-black shadow-lg`}>
                              {attendee.userInfo?.name?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-black text-slate-900 truncate">{attendee.userInfo?.name}</p>
                              <p className="text-sm text-slate-500 font-medium truncate">{attendee.userInfo?.email}</p>
                            </div>
                          </div>
                          <span className={`px-3 py-1.5 rounded-xl text-xs font-black ${colors.badge} ${colors.text} uppercase`}>
                            {attendee.status}
                          </span>
                        </div>
                        <div className="space-y-3 text-sm mb-4">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-600 font-semibold">Ticket:</span>
                            <span className="font-bold text-slate-900">{attendee.ticketType}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-600 font-semibold">Registered:</span>
                            <span className="font-bold text-slate-900">{attendee.createdAt.toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            onClick={() => handleCheckIn(attendee)}
                            className={`px-4 py-3 rounded-xl text-sm font-black transition-all duration-300 ${attendee.checkInStatus === 'checked-in'
                              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white'
                              : 'bg-slate-100 text-slate-700'
                              }`}
                          >
                            {attendee.checkInStatus === 'checked-in' ? '✓ Checked' : 'Check In'}
                          </button>
                          {attendee.status === 'pending' && (
                            <button
                              onClick={() => {
                                setSelectedAttendee(attendee);
                                setShowPaymentModal(true);
                              }}
                              className="px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-black"
                            >
                              Record Pay
                            </button>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteAttendee(attendee)}
                          className="mt-3 w-full px-4 py-3 rounded-xl bg-red-50 text-red-600 text-sm font-black hover:bg-red-100 transition-all duration-300"
                        >
                          🗑 Remove Attendee
                        </button>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedAttendee && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-[fadeIn_0.3s_ease-out]">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl animate-[slideUp_0.4s_ease-out] border-2 border-slate-200">
            <div className="px-8 py-6 border-b-2 border-slate-100 bg-gradient-to-r from-blue-50 to-purple-50">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black text-slate-900">💳 Record Payment</h2>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="text-slate-400 hover:text-slate-900 text-3xl font-bold transition-colors hover:rotate-90 transition-transform duration-300"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-8 space-y-6">
              <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl p-6 border border-slate-200">
                <p className="text-sm font-bold text-slate-600 mb-3 uppercase tracking-wide">Attendee</p>
                <p className="font-black text-slate-900 text-lg mb-2">{selectedAttendee.userInfo?.name}</p>
                <p className="text-sm text-slate-600 font-semibold">{selectedAttendee.userInfo?.email}</p>
              </div>
              <div>
                <label className="block text-sm font-black text-slate-900 mb-3 uppercase tracking-wide">Amount ($)</label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-6 py-4 rounded-2xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 text-slate-900 font-bold text-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-black text-slate-900 mb-3 uppercase tracking-wide">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-6 py-4 rounded-2xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 text-slate-900 font-bold cursor-pointer"
                >
                  <option value="cash">💵 Cash</option>
                  <option value="bank_transfer">🏦 Bank Transfer</option>
                  <option value="mobile_money">📱 Mobile Money</option>
                  <option value="card">💳 Card</option>
                  <option value="other">📦 Other</option>
                </select>
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 px-6 py-4 rounded-2xl border-2 border-slate-200 text-slate-700 font-black hover:bg-slate-50 transition-all duration-300 hover:scale-105"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePaymentConfirmation}
                  disabled={!paymentAmount}
                  className="flex-1 px-6 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-black hover:shadow-2xl hover:shadow-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105 disabled:hover:scale-100"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal - Enhanced */}
      {showDetailModal && selectedAttendee && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-[fadeIn_0.3s_ease-out]">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto animate-[slideUp_0.4s_ease-out] border-2 border-slate-200">
            <div className="sticky top-0 px-8 py-6 border-b-2 border-slate-100 bg-gradient-to-r from-blue-50 to-purple-50 z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black text-slate-900">👤 Attendee Details</h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-slate-400 hover:text-slate-900 text-3xl font-bold transition-colors hover:rotate-90 transition-transform duration-300"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-8 space-y-6">
              <div className="flex items-center gap-5 pb-6 border-b-2 border-slate-100">
                <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${getStatusColor(selectedAttendee.status).gradient} flex items-center justify-center text-white text-3xl font-black shadow-lg`}>
                  {selectedAttendee.userInfo?.name?.charAt(0).toUpperCase() || '?'}
                </div>
                <div className="flex-1">
                  <h3 className="font-black text-slate-900 text-xl mb-1">{selectedAttendee.userInfo?.name}</h3>
                  <p className="text-sm text-slate-600 font-semibold">{selectedAttendee.userInfo?.jobTitle || 'Attendee'}</p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl p-6 space-y-4 border border-slate-200">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-xs text-slate-600 font-bold uppercase tracking-wide mb-1">Email</p>
                    <p className="text-sm font-black text-slate-900">{selectedAttendee.userInfo?.email}</p>
                  </div>
                </div>
                {selectedAttendee.userInfo?.phone && (
                  <div className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-emerald-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-xs text-slate-600 font-bold uppercase tracking-wide mb-1">Phone</p>
                      <p className="text-sm font-black text-slate-900">{selectedAttendee.userInfo?.phone}</p>
                    </div>
                  </div>
                )}
                {selectedAttendee.userInfo?.company && (
                  <div className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-purple-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-xs text-slate-600 font-bold uppercase tracking-wide mb-1">Company</p>
                      <p className="text-sm font-black text-slate-900">{selectedAttendee.userInfo?.company}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {[
                  { label: 'Status', value: selectedAttendee.status, badge: true },
                  { label: 'Ticket Type', value: selectedAttendee.ticketType },
                  { label: 'Check-in Status', value: selectedAttendee.checkInStatus === 'checked-in' ? '✓ Checked In' : 'Not Checked In', checkIn: true },
                  selectedAttendee.paymentAmount && { label: 'Payment Amount', value: `$${selectedAttendee.paymentAmount}` },
                  selectedAttendee.paymentMethod && { label: 'Payment Method', value: selectedAttendee.paymentMethod.replace('_', ' ') },
                  { label: 'Registered', value: selectedAttendee.createdAt.toLocaleDateString() },
                  selectedAttendee.checkInTime && { label: 'Checked In', value: selectedAttendee.checkInTime.toLocaleString() },
                ].filter(Boolean).map((item: any, idx) => (
                  <div key={idx} className="flex justify-between items-center py-3 border-b border-slate-100 last:border-0">
                    <span className="text-sm text-slate-600 font-bold">{item.label}</span>
                    {item.badge ? (
                      <span className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase ${getStatusColor(item.value).badge} ${getStatusColor(item.value).text}`}>
                        {item.value}
                      </span>
                    ) : item.checkIn ? (
                      <span className={`text-xs font-black px-3 py-1.5 rounded-xl ${selectedAttendee.checkInStatus === 'checked-in'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-700'
                        }`}>
                        {item.value}
                      </span>
                    ) : (
                      <span className="text-sm font-black text-slate-900 capitalize">{item.value}</span>
                    )}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-6 border-t-2 border-slate-100">
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setShowPaymentModal(true);
                  }}
                  className="px-6 py-4 rounded-2xl bg-gradient-to-r from-blue-50 to-blue-100 text-blue-600 hover:from-blue-100 hover:to-blue-200 font-black text-sm transition-all duration-300 hover:scale-105"
                >
                  💳 Record Payment
                </button>
                <button
                  onClick={() => {
                    handleCheckIn(selectedAttendee);
                    setShowDetailModal(false);
                  }}
                  className="px-6 py-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-600 hover:from-emerald-100 hover:to-emerald-200 font-black text-sm transition-all duration-300 hover:scale-105"
                >
                  ✓ Check In
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Action Modal */}
      {showBulkActionModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-[fadeIn_0.3s_ease-out]">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl animate-[slideUp_0.4s_ease-out] border-2 border-slate-200">
            <div className="px-8 py-6 border-b-2 border-slate-100 bg-gradient-to-r from-blue-50 to-purple-50">
              <h2 className="text-2xl font-black text-slate-900">⚡ Bulk Actions</h2>
              <p className="text-sm text-slate-600 font-bold mt-2">
                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-lg">{selectedAttendees.size}</span> attendees selected
              </p>
            </div>
            <div className="p-8 space-y-6">
              <div>
                <label className="block text-sm font-black text-slate-900 mb-3 uppercase tracking-wide">Select Action</label>
                <select
                  value={bulkAction}
                  onChange={(e) => setBulkAction(e.target.value as any)}
                  className="w-full px-6 py-4 rounded-2xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 font-bold cursor-pointer"
                >
                  <option value="confirm">✅ Confirm Payments</option>
                  <option value="message">💬 Send Message</option>
                  <option value="export">📥 Export Data</option>
                </select>
              </div>

              {bulkAction === 'message' && (
                <div>
                  <label className="block text-sm font-black text-slate-900 mb-3 uppercase tracking-wide">Message</label>
                  <textarea
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    placeholder="Type your message..."
                    rows={4}
                    className="w-full px-6 py-4 rounded-2xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 resize-none font-medium"
                  />
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => setShowBulkActionModal(false)}
                  className="flex-1 px-6 py-4 rounded-2xl border-2 border-slate-200 text-slate-700 font-black hover:bg-slate-50 transition-all duration-300 hover:scale-105"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (bulkAction === 'confirm') {
                      handleBulkConfirm();
                    } else if (bulkAction === 'export') {
                      exportToCSV();
                      setShowBulkActionModal(false);
                    } else if (bulkAction === 'message') {
                      console.log('Send message to', selectedAttendees);
                      setShowBulkActionModal(false);
                    }
                  }}
                  className="flex-1 px-6 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-black hover:shadow-2xl hover:shadow-blue-500/40 transition-all duration-300 hover:scale-105"
                >
                  {bulkAction === 'confirm' ? 'Confirm All' : bulkAction === 'export' ? 'Export' : 'Send'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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

      {/* Bulk Actions Bar */}
      <BulkActionsBar
        selectedCount={selectedAttendees.size}
        onEmail={() => setShowBulkEmailModal(true)}
        onSMS={() => setShowBulkSMSModal(true)}
        onRefund={async () => {
          if (!confirm(`Process refund for ${selectedAttendees.size} attendees?`)) return;

          const reason = prompt('Enter refund reason:');
          if (!reason) return;

          try {
            const selectedAttendeesData = attendees.filter(a => selectedAttendees.has(a.id));
            let successCount = 0;
            let totalAmount = 0;

            for (const attendee of selectedAttendeesData) {
              try {
                // Update ticket
                const { error: refundError } = await supabase
                .from('tickets')
                .update({
                  status: 'cancelled',
                  refund_reason: reason,
                  refunded_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                })
                .eq('id', attendee.id);

              if (refundError) throw refundError;

                // Update payment if exists
                if (attendee.paymentId) {
                  try {
                    const { error: paymentError } = await supabase
                      .from('payments')
                      .update({
                        status: 'refunded',
                        refunded_at: new Date().toISOString(),
                        refund_reason: reason,
                      })
                      .eq('id', attendee.paymentId);

                    if (paymentError) throw paymentError;
                  } catch (e) {
                    console.log('Payment record not found');
                  }
                }

                const amount = attendee.paymentAmount || 0;
                totalAmount += amount;
                successCount++;

                console.log(`💰 Refund processed for ${attendee.userInfo?.name}: $${amount}`);
              } catch (error) {
                console.error(`Failed to refund ${attendee.id}:`, error);
              }
            }

            // Recalculate and update event's currentAttendees count after refunds
            if (eventId) {
              await updateAttendeeCount(eventId);
            }

            alert(`✅ Refunded ${successCount} of ${selectedAttendeesData.length} tickets. Total: $${totalAmount}`);
            setSelectedAttendees(new Set());
          } catch (error) {
            console.error('Refund error:', error);
            alert('Error processing refunds');
          }
        }}
        onStatusUpdate={async () => {
          const status = prompt('Enter new status (confirmed/pending/cancelled):');
          if (!status || !['confirmed', 'pending', 'cancelled'].includes(status)) {
            alert('Invalid status');
            return;
          }

          try {
            const { error: statusError } = await supabase
            .from('tickets')
            .update({
              status,
              updated_at: new Date().toISOString(),
            })
            .in('id', Array.from(selectedAttendees));

          if (statusError) throw statusError;

            // Recalculate and update event's currentAttendees count if status changed to/from confirmed
            if (eventId && (status === 'confirmed' || status === 'cancelled')) {
              await updateAttendeeCount(eventId);
            }

            console.log(`✅ Updated ${selectedAttendees.size} tickets to status: ${status}`);
            alert(`✅ Updated ${selectedAttendees.size} tickets to ${status}`);
            setSelectedAttendees(new Set());
          } catch (error) {
            console.error('Status update error:', error);
            alert('Error updating status');
          }
        }}
        onClearSelection={() => setSelectedAttendees(new Set())}
      />

      {/* Bulk Email Modal */}
      <BulkEmailModal
        isOpen={showBulkEmailModal}
        onClose={() => setShowBulkEmailModal(false)}
        recipientCount={selectedAttendees.size}
        onSend={async (emailData) => {
          try {
            // Get selected attendees data
            const selectedAttendeesData = attendees.filter(a => selectedAttendees.has(a.id));

            // Send emails
            let successCount = 0;
            let failedCount = 0;

            for (const attendee of selectedAttendeesData) {
              const personalizedSubject = emailData.subject
                .replace(/{{name}}/g, attendee.userInfo?.name || '')
                .replace(/{{event}}/g, event?.title || '')
                .replace(/{{date}}/g, event?.startAt ? new Date(event.startAt.seconds * 1000).toLocaleDateString() : '');

              const personalizedBody = emailData.body
                .replace(/{{name}}/g, attendee.userInfo?.name || '')
                .replace(/{{event}}/g, event?.title || '')
                .replace(/{{date}}/g, event?.startAt ? new Date(event.startAt.seconds * 1000).toLocaleDateString() : '');

              try {
                // Prepare template data if using a template
                const templateData = emailData.html ? {
                  recipientName: attendee.userInfo?.name || 'there',
                  eventTitle: event?.title || '',
                  eventDate: event?.startAt ? new Date(event.startAt.seconds * 1000).toLocaleDateString() : '',
                  eventTime: event?.startAt ? new Date(event.startAt.seconds * 1000).toLocaleTimeString() : '',
                  eventLocation: event?.venue || '',
                  organizerName: event?.organizer || 'Hostdweb Team',
                  ticketType: attendee.ticketType || 'Standard',
                } : undefined;

                // Send email via API
                const response = await fetch('/api/send-email', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    to: attendee.userInfo?.email,
                    subject: personalizedSubject,
                    body: personalizedBody,
                    templateId: emailData.html, // Template ID or undefined
                    templateData,
                  }),
                });

                if (response.ok) {
                  successCount++;
                  console.log(`✅ Email sent to: ${attendee.userInfo?.email}`);
                } else {
                  const error = await response.json();
                  failedCount++;
                  console.error(`❌ Failed to send to ${attendee.userInfo?.email}:`, error);
                }
              } catch (error) {
                failedCount++;
                console.error(`❌ Error sending to ${attendee.userInfo?.email}:`, error);
              }
            }

            if (successCount > 0) {
              alert(`✅ Sent ${successCount} emails successfully!${failedCount > 0 ? ` (${failedCount} failed)` : ''}`);
            } else {
              alert(`❌ Failed to send all emails. Check console for details.`);
            }

            setSelectedAttendees(new Set());
            setShowBulkEmailModal(false);
          } catch (error) {
            console.error('Email error:', error);
            alert('Error sending emails');
          }
        }}
      />

      {/* Bulk SMS Modal */}
      <BulkSMSModal
        isOpen={showBulkSMSModal}
        onClose={() => setShowBulkSMSModal(false)}
        recipientCount={selectedAttendees.size}
        onSend={async (message) => {
          console.log('SMS would be sent to', selectedAttendees.size, 'attendees:', message);
          alert(`SMS feature: would send to ${selectedAttendees.size} attendees`);
          setSelectedAttendees(new Set());
        }}
      />
    </div>
  );
}

export default function EventAttendeesPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout currentPage="events">
        <EventAttendeesContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}