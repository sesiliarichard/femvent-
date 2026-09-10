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

      if (eventId) {
        await updateAttendeeCount(eventId);
      }

      if (selectedAttendee.userInfo?.email) {
        try {
          await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: selectedAttendee.userInfo.email,
              subject: `Your ticket for ${event?.title || 'the event'} is confirmed`,
              body: `Thanks for your payment! Your ticket for ${event?.title || 'the event'} is now confirmed.`,
            }),
          });
        } catch (emailError) {
          console.error('Confirmation email failed (payment still confirmed):', emailError);
        }
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
      const { data, error } = await supabase
        .from('tickets')
        .delete()
        .eq('id', attendee.id)
        .select();
      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error('Delete blocked — no rows were removed (likely an RLS policy on the tickets table)');
      }
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
      alert(error instanceof Error ? error.message : 'Failed to delete attendee. Please try again.');
    }
  };

  const handleBulkConfirm = async () => {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ status: 'confirmed', confirmed_at: new Date().toISOString() })
        .in('id', Array.from(selectedAttendees));

      if (error) throw error;

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

  // Status colors kept functional (green/amber/red) rather than brand — these signal state, not identity
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', badge: 'bg-emerald-100', solid: 'bg-emerald-500' };
      case 'pending':
        return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', badge: 'bg-amber-100', solid: 'bg-amber-500' };
      case 'cancelled':
        return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', badge: 'bg-red-100', solid: 'bg-red-500' };
      default:
        return { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', badge: 'bg-gray-100', solid: 'bg-gray-400' };
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-5">
            <div className="absolute inset-0 rounded-full border-4 border-primary-100"></div>
            <div className="absolute inset-0 rounded-full border-4 border-primary-600 border-t-transparent animate-spin"></div>
          </div>
          <p className="text-lg font-bold text-gray-700">
            Loading attendees...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div>
        {/* Header */}
        <div className="p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between flex-wrap gap-6 mb-7">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.back()}
                  className="p-2.5 bg-white border border-gray-200 rounded-xl hover:border-primary-300 transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div>
                  <h1 className="text-2xl font-extrabold text-gray-900">
                    Attendees Management
                  </h1>
                  <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-primary-500 rounded-full"></span>
                    {event?.title || 'Loading event...'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => router.push(`/events/${eventId}/scanner`)}
                  className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                  <span>Scan QR Code</span>
                </button>
                <div className="relative">
                  <button
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-5 py-2.5 rounded-xl font-bold text-sm hover:border-primary-300 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span>Export</span>
                  </button>
                  {showExportMenu && (
                    <div className="absolute right-0 top-14 bg-white rounded-xl shadow-xl border border-gray-200 w-56 overflow-hidden z-50">
                      <button
                        onClick={() => { exportToCSV(); setShowExportMenu(false); }}
                        className="w-full text-left px-5 py-3.5 hover:bg-gray-50 text-gray-700 font-semibold text-sm transition-colors flex items-center gap-3"
                      >
                        <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Export as CSV
                      </button>
                      <button
                        onClick={() => { window.print(); setShowExportMenu(false); }}
                        className="w-full text-left px-5 py-3.5 hover:bg-gray-50 text-gray-700 font-semibold text-sm transition-colors border-t border-gray-100 flex items-center gap-3"
                      >
                        <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    className="flex items-center gap-2 bg-secondary-500 hover:bg-secondary-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-colors"
                  >
                    <span className="bg-white/25 px-2 py-0.5 rounded-md text-xs font-extrabold">
                      {selectedAttendees.size}
                    </span>
                    <span>selected</span>
                  </button>
                )}
              </div>
            </div>

            {/* Stats — uniform treatment, no per-card color cycling */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { label: 'Total Attendees', value: stats.total, icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg> },
                { label: 'Confirmed', value: stats.confirmed, icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
                { label: 'Pending', value: stats.pending, icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
                { label: 'Checked In', value: stats.checkedIn, icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h2a2 2 0 002-2 1 1 0 112 0 2 2 0 002 2h2a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2h-2a2 2 0 00-2 2 1 1 0 11-2 0 2 2 0 00-2-2z" /></svg> },
                { label: 'Revenue', value: `$${stats.totalRevenue.toFixed(0)}`, icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
              ].map((stat, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-2xl p-5 border border-gray-100"
                >
                  <div className="bg-primary-50 text-primary-600 w-10 h-10 rounded-xl flex items-center justify-center mb-3.5">
                    {stat.icon}
                  </div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">{stat.label}</p>
                  <p className="text-2xl font-extrabold text-gray-900">
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="max-w-7xl mx-auto px-8 mb-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search by name, email, or company..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-5 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors text-gray-900 placeholder-gray-400 font-medium"
                />
              </div>
              <div className="flex gap-2.5">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="px-5 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 bg-white font-semibold text-gray-700 transition-colors cursor-pointer"
                >
                  <option value="all">All Status</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="pending">Pending</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-5 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 bg-white font-semibold text-gray-700 transition-colors cursor-pointer"
                >
                  <option value="date">Latest First</option>
                  <option value="name">Name (A-Z)</option>
                  <option value="status">Status</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Attendees Display */}
        <div className="max-w-7xl mx-auto px-8 pb-8">
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {filteredAttendees.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-full bg-gray-100 mx-auto flex items-center justify-center mb-5">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-extrabold text-gray-900 mb-2">
                  {searchQuery ? 'No attendees found' : 'No attendees yet'}
                </h3>
                <p className="text-gray-500">
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
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-4 text-left">
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
                            className="w-4 h-4 rounded border-gray-300 cursor-pointer accent-primary-600"
                          />
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Attendee</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Ticket Type</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Payment</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Check-in</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Registered</th>
                        <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredAttendees.map((attendee) => {
                        const colors = getStatusColor(attendee.status);
                        return (
                          <tr
                            key={attendee.id}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-6 py-4">
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
                                className="w-4 h-4 rounded border-gray-300 cursor-pointer accent-primary-600"
                              />
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3.5">
                                <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600 text-sm font-extrabold">
                                  {attendee.userInfo?.name?.charAt(0).toUpperCase() || '?'}
                                </div>
                                <div>
                                  <p className="font-bold text-gray-900 text-sm">
                                    {attendee.userInfo?.name}
                                  </p>
                                  <p className="text-xs text-gray-500">{attendee.userInfo?.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-xs text-gray-700 font-semibold bg-gray-100 px-2.5 py-1 rounded-md">
                                {attendee.ticketType}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-3 py-1.5 rounded-lg text-xs font-bold ${colors.badge} ${colors.text} uppercase tracking-wide`}>
                                {attendee.status}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              {attendee.status === 'confirmed' ? (
                                <span className="text-sm font-bold text-emerald-600">
                                  ${attendee.paymentAmount || '0'}
                                </span>
                              ) : (
                                <button
                                onClick={() => {
                                  setSelectedAttendee(attendee);
                                  setPaymentAmount(attendee.paymentAmount ? String(attendee.paymentAmount) : '');
                                  setPaymentMethod(attendee.paymentMethod || 'cash');
                                  setShowPaymentModal(true);
                                }}
                                className="px-3.5 py-1.5 rounded-lg bg-secondary-500 hover:bg-secondary-600 text-white text-xs font-bold transition-colors"
                              >
                                Record
                              </button>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <button
                                onClick={() => handleCheckIn(attendee)}
                                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${attendee.checkInStatus === 'checked-in'
                                  ? 'bg-emerald-500 text-white'
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                  }`}
                              >
                                {attendee.checkInStatus === 'checked-in' ? '✓ Checked' : 'Check In'}
                              </button>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 font-medium">
                              {attendee.createdAt.toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex justify-center gap-1.5">
                                <button
                                  onClick={() => {
                                    setSelectedAttendee(attendee);
                                    setShowDetailModal(true);
                                  }}
                                  className="p-2.5 hover:bg-primary-50 rounded-lg transition-colors"
                                >
                                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handleDeleteAttendee(attendee)}
                                  className="p-2.5 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Remove attendee"
                                >
                                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                <div className="lg:hidden space-y-3 p-5">
                  {filteredAttendees.map((attendee) => {
                    const colors = getStatusColor(attendee.status);
                    return (
                      <div
                        key={attendee.id}
                        className="bg-white border border-gray-200 rounded-2xl p-5"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3.5 flex-1">
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
                              className="w-4 h-4 rounded border-gray-300 accent-primary-600"
                            />
                            <div className="w-11 h-11 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600 text-base font-extrabold">
                              {attendee.userInfo?.name?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-gray-900 text-sm truncate">{attendee.userInfo?.name}</p>
                              <p className="text-xs text-gray-500 truncate">{attendee.userInfo?.email}</p>
                            </div>
                          </div>
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${colors.badge} ${colors.text} uppercase`}>
                            {attendee.status}
                          </span>
                        </div>
                        <div className="space-y-2 text-sm mb-4">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500 font-medium">Ticket:</span>
                            <span className="font-semibold text-gray-900">{attendee.ticketType}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500 font-medium">Registered:</span>
                            <span className="font-semibold text-gray-900">{attendee.createdAt.toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2.5">
                          <button
                            onClick={() => handleCheckIn(attendee)}
                            className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-colors ${attendee.checkInStatus === 'checked-in'
                              ? 'bg-emerald-500 text-white'
                              : 'bg-gray-100 text-gray-600'
                              }`}
                          >
                            {attendee.checkInStatus === 'checked-in' ? '✓ Checked' : 'Check In'}
                          </button>
                          {attendee.status === 'pending' && (
                            <button
                              onClick={() => {
                                setSelectedAttendee(attendee);
                                setPaymentAmount(attendee.paymentAmount ? String(attendee.paymentAmount) : '');
                                setPaymentMethod(attendee.paymentMethod || 'cash');
                                setShowPaymentModal(true);
                              }}
                              className="px-4 py-2.5 rounded-xl bg-secondary-500 text-white text-sm font-bold"
                            >
                              Record Pay
                            </button>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteAttendee(attendee)}
                          className="mt-2.5 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 text-red-600 text-sm font-bold hover:bg-red-100 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>Remove Attendee
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-gray-200">
            <div className="px-7 py-5 border-b border-gray-100 bg-primary-50">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-extrabold text-gray-900 flex items-center gap-2"><svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" /></svg>Record Payment</h2>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="text-gray-400 hover:text-gray-700 text-2xl font-bold transition-colors"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-7 space-y-5">
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                <p className="text-xs font-bold text-gray-500 mb-2.5 uppercase tracking-wide">Attendee</p>
                <p className="font-extrabold text-gray-900 text-base mb-1.5">{selectedAttendee.userInfo?.name}</p>
                <p className="text-sm text-gray-600">{selectedAttendee.userInfo?.email}</p>
                {selectedAttendee.paymentId?.startsWith('FV-') && (
                  <div className="mt-3.5 pt-3.5 border-t border-gray-200">
                    <p className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>Awaiting {selectedAttendee.paymentMethod} payment
                    </p>
                    <p className="text-sm text-gray-700">
                      Reference: <span className="font-mono font-bold">{selectedAttendee.paymentId}</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Check that this reference matches what the buyer sent before confirming.
                    </p>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Amount ($)</label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-5 py-3.5 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors text-gray-900 font-bold text-base"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-5 py-3.5 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors text-gray-900 font-semibold cursor-pointer"
                >
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="mobile_money">Mobile Money</option>
                  <option value="card">Card</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 px-5 py-3.5 rounded-xl border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePaymentConfirmation}
                  disabled={!paymentAmount}
                  className="flex-1 px-5 py-3.5 rounded-xl bg-secondary-500 hover:bg-secondary-600 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedAttendee && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-gray-200">
            <div className="sticky top-0 px-7 py-5 border-b border-gray-100 bg-primary-50 z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-extrabold text-gray-900 flex items-center gap-2"><svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>Attendee Details</h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-700 text-2xl font-bold transition-colors"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-7 space-y-5">
              <div className="flex items-center gap-4 pb-5 border-b border-gray-100">
                <div className={`w-16 h-16 rounded-2xl ${getStatusColor(selectedAttendee.status).solid} flex items-center justify-center text-white text-2xl font-extrabold`}>
                  {selectedAttendee.userInfo?.name?.charAt(0).toUpperCase() || '?'}
                </div>
                <div className="flex-1">
                  <h3 className="font-extrabold text-gray-900 text-lg mb-1">{selectedAttendee.userInfo?.name}</h3>
                  <p className="text-sm text-gray-500">{selectedAttendee.userInfo?.jobTitle || 'Attendee'}</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-5 space-y-3.5 border border-gray-100">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-primary-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wide mb-1">Email</p>
                    <p className="text-sm font-bold text-gray-900">{selectedAttendee.userInfo?.email}</p>
                  </div>
                </div>
                {selectedAttendee.userInfo?.phone && (
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-primary-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 font-bold uppercase tracking-wide mb-1">Phone</p>
                      <p className="text-sm font-bold text-gray-900">{selectedAttendee.userInfo?.phone}</p>
                    </div>
                  </div>
                )}
                {selectedAttendee.userInfo?.company && (
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-primary-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 font-bold uppercase tracking-wide mb-1">Company</p>
                      <p className="text-sm font-bold text-gray-900">{selectedAttendee.userInfo?.company}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {[
                  { label: 'Status', value: selectedAttendee.status, badge: true },
                  { label: 'Ticket Type', value: selectedAttendee.ticketType },
                  { label: 'Check-in Status', value: selectedAttendee.checkInStatus === 'checked-in' ? '✓ Checked In' : 'Not Checked In', checkIn: true },
                  selectedAttendee.paymentAmount && { label: 'Payment Amount', value: `$${selectedAttendee.paymentAmount}` },
                  selectedAttendee.paymentMethod && { label: 'Payment Method', value: selectedAttendee.paymentMethod.replace('_', ' ') },
                  selectedAttendee.paymentId?.startsWith('FV-') && { label: 'Payment Reference', value: selectedAttendee.paymentId },
                  { label: 'Registered', value: selectedAttendee.createdAt.toLocaleDateString() },
                  selectedAttendee.checkInTime && { label: 'Checked In', value: selectedAttendee.checkInTime.toLocaleString() },
                ].filter(Boolean).map((item: any, idx) => (
                  <div key={idx} className="flex justify-between items-center py-2.5 border-b border-gray-100 last:border-0">
                    <span className="text-sm text-gray-500 font-semibold">{item.label}</span>
                    {item.badge ? (
                      <span className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase ${getStatusColor(item.value).badge} ${getStatusColor(item.value).text}`}>
                        {item.value}
                      </span>
                    ) : item.checkIn ? (
                      <span className={`text-xs font-bold px-2.5 py-1.5 rounded-lg ${selectedAttendee.checkInStatus === 'checked-in'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-gray-100 text-gray-700'
                        }`}>
                        {item.value}
                      </span>
                    ) : (
                      <span className="text-sm font-bold text-gray-900 capitalize">{item.value}</span>
                    )}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-5 border-t border-gray-100">
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setShowPaymentModal(true);
                  }}
                  className="px-5 py-3.5 rounded-xl bg-primary-50 text-primary-600 hover:bg-primary-100 font-bold text-sm transition-colors"
                >
                  <svg className="inline-block w-4 h-4 mr-1.5 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" /></svg>Record Payment
                </button>
                <button
                  onClick={() => {
                    handleCheckIn(selectedAttendee);
                    setShowDetailModal(false);
                  }}
                  className="px-5 py-3.5 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 font-bold text-sm transition-colors"
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-gray-200">
            <div className="px-7 py-5 border-b border-gray-100 bg-primary-50">
              <h2 className="text-lg font-extrabold text-gray-900 flex items-center gap-2"><svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>Bulk Actions</h2>
              <p className="text-sm text-gray-500 font-semibold mt-2">
                <span className="bg-primary-100 text-primary-700 px-2 py-0.5 rounded-md">{selectedAttendees.size}</span> attendees selected
              </p>
            </div>
            <div className="p-7 space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Select Action</label>
                <select
                  value={bulkAction}
                  onChange={(e) => setBulkAction(e.target.value as any)}
                  className="w-full px-5 py-3.5 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors font-semibold cursor-pointer"
                >
                  <option value="confirm">Confirm Payments</option>
                  <option value="message">Send Message</option>
                  <option value="export">Export Data</option>
                </select>
              </div>

              {bulkAction === 'message' && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Message</label>
                  <textarea
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    placeholder="Type your message..."
                    rows={4}
                    className="w-full px-5 py-3.5 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors resize-none font-medium"
                  />
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowBulkActionModal(false)}
                  className="flex-1 px-5 py-3.5 rounded-xl border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition-colors"
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
                  className="flex-1 px-5 py-3.5 rounded-xl bg-secondary-500 hover:bg-secondary-600 text-white font-bold transition-colors"
                >
                  {bulkAction === 'confirm' ? 'Confirm All' : bulkAction === 'export' ? 'Export' : 'Send'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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

                console.log(`Refund processed for ${attendee.userInfo?.name}: $${amount}`);
              } catch (error) {
                console.error(`Failed to refund ${attendee.id}:`, error);
              }
            }

            if (eventId) {
              await updateAttendeeCount(eventId);
            }

            alert(`Refunded ${successCount} of ${selectedAttendeesData.length} tickets. Total: $${totalAmount}`);
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

            if (eventId && (status === 'confirmed' || status === 'cancelled')) {
              await updateAttendeeCount(eventId);
            }

            console.log(`Updated ${selectedAttendees.size} tickets to status: ${status}`);
            alert(`Updated ${selectedAttendees.size} tickets to ${status}`);
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
            const selectedAttendeesData = attendees.filter(a => selectedAttendees.has(a.id));

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
                const templateData = emailData.html ? {
                  recipientName: attendee.userInfo?.name || 'there',
                  eventTitle: event?.title || '',
                  eventDate: event?.startAt ? new Date(event.startAt.seconds * 1000).toLocaleDateString() : '',
                  eventTime: event?.startAt ? new Date(event.startAt.seconds * 1000).toLocaleTimeString() : '',
                  eventLocation: event?.venue || '',
                  organizerName: event?.organizer || 'Hostdweb Team',
                  ticketType: attendee.ticketType || 'Standard',
                } : undefined;

                const response = await fetch('/api/send-email', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    to: attendee.userInfo?.email,
                    subject: personalizedSubject,
                    body: personalizedBody,
                    templateId: emailData.html,
                    templateData,
                  }),
                });

                if (response.ok) {
                  successCount++;
                  console.log(`Email sent to: ${attendee.userInfo?.email}`);
                } else {
                  const error = await response.json();
                  failedCount++;
                  console.error(`Failed to send to ${attendee.userInfo?.email}:`, error);
                }
              } catch (error) {
                failedCount++;
                console.error(`Error sending to ${attendee.userInfo?.email}:`, error);
              }
            }

            if (successCount > 0) {
              alert(`Sent ${successCount} emails successfully!${failedCount > 0 ? ` (${failedCount} failed)` : ''}`);
            } else {
              alert(`Failed to send all emails. Check console for details.`);
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