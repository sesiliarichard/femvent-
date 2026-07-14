import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../components/AdminLayout';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../services/supabase';
import { QRCodeCanvas } from 'qrcode.react';

interface Ticket {
    id: string;
    eventId: string;
    userId: string;
    status: 'pending' | 'confirmed' | 'cancelled' | 'refunded';
    createdAt: Date;
    paymentId?: string;
    paymentAmount?: number;
    paymentMethod?: string;
    confirmedAt?: Date;
    userName?: string;
    userEmail?: string;
    ticketType?: string;
    checkInStatus?: 'checked-in' | 'not-checked-in';
    checkInTime?: Date;
    qrCodeId?: string;
    eventTitle?: string;
}

export default function TicketsPage() {
    const { user, loading: authLoading } = useAuth();
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'confirmed' | 'pending' | 'cancelled' | 'refunded'>('all');
    const [filterEvent, setFilterEvent] = useState<string>('all');
    const [events, setEvents] = useState<{ id: string; title: string }[]>([]);
    const [selectedTickets, setSelectedTickets] = useState<Set<string>>(new Set());
    const [showBulkActionModal, setShowBulkActionModal] = useState(false);
    const [bulkAction, setBulkAction] = useState<'confirm' | 'cancel' | 'refund'>('confirm');
    const [showQRModal, setShowQRModal] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

    useEffect(() => {
        if (user) {
            loadTickets();
            loadEvents();
        }
    }, [user]);

    const loadTickets = async () => {
        try {
            setLoading(true);

            const { data, error } = await supabase
                .from('tickets')
                .select('*, event:events(title), attendee:users(name, email)')
                .order('created_at', { ascending: false });

            if (error) throw error;

            const ticketsData: Ticket[] = (data || []).map((row: any) => ({
                id: row.id,
                eventId: row.event_id,
                userId: row.user_id,
                status: row.status,
                createdAt: row.created_at ? new Date(row.created_at) : new Date(),
                paymentId: row.payment_id,
                paymentAmount: row.payment_amount,
                paymentMethod: row.payment_method,
                confirmedAt: row.confirmed_at ? new Date(row.confirmed_at) : undefined,
                userName: row.attendee?.name || row.attendee?.email?.split('@')[0] || 'Unknown',
                userEmail: row.attendee?.email || '',
                ticketType: row.ticket_type,
                checkInStatus: row.check_in_status,
                checkInTime: row.check_in_time ? new Date(row.check_in_time) : undefined,
                qrCodeId: row.qr_code_id,
                eventTitle: row.event?.title || 'Unknown Event',
            }));

            setTickets(ticketsData);
        } catch (error) {
            console.error('Error loading tickets:', error);
            alert('Failed to load tickets');
        } finally {
            setLoading(false);
        }
    };

    const loadEvents = async () => {
        try {
            const { data, error } = await supabase.from('events').select('id, title');
            if (error) throw error;
            setEvents((data || []).map((row: any) => ({ id: row.id, title: row.title || 'Untitled Event' })));
        } catch (error) {
            console.error('Error loading events:', error);
        }
    };

    const handleBulkAction = async () => {
        if (selectedTickets.size === 0) return;

        const confirm = window.confirm(
            `Are you sure you want to ${bulkAction} ${selectedTickets.size} ticket(s)?`
        );

        if (!confirm) return;

        try {
            const updateData: any = {};

            if (bulkAction === 'confirm') {
                updateData.status = 'confirmed';
                updateData.confirmed_at = new Date().toISOString();
            } else if (bulkAction === 'cancel') {
                updateData.status = 'cancelled';
            } else if (bulkAction === 'refund') {
                updateData.status = 'refunded';
            }

            const { error } = await supabase
                .from('tickets')
                .update(updateData)
                .in('id', Array.from(selectedTickets));

            if (error) throw error;

            await loadTickets();
            setSelectedTickets(new Set());
            setShowBulkActionModal(false);
            alert(`Successfully ${bulkAction}ed ${selectedTickets.size} ticket(s)`);
        } catch (error) {
            console.error('Error performing bulk action:', error);
            alert('Failed to perform bulk action');
        }
    };

    const handleTicketStatusChange = async (ticketId: string, newStatus: string) => {
        try {
            const updateData: any = { status: newStatus };

            if (newStatus === 'confirmed') {
                updateData.confirmed_at = new Date().toISOString();
            }

            const { error } = await supabase.from('tickets').update(updateData).eq('id', ticketId);
            if (error) throw error;
            await loadTickets();
        } catch (error) {
            console.error('Error updating ticket status:', error);
            alert('Failed to update ticket status');
        }
    };

    const filteredTickets = tickets.filter(ticket => {
        const matchesSearch =
            ticket.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ticket.userEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ticket.eventTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ticket.id.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = filterStatus === 'all' || ticket.status === filterStatus;
        const matchesEvent = filterEvent === 'all' || ticket.eventId === filterEvent;

        return matchesSearch && matchesStatus && matchesEvent;
    });

    const stats = {
        total: tickets.length,
        confirmed: tickets.filter(t => t.status === 'confirmed').length,
        pending: tickets.filter(t => t.status === 'pending').length,
        cancelled: tickets.filter(t => t.status === 'cancelled').length,
        checkedIn: tickets.filter(t => t.checkInStatus === 'checked-in').length,
        revenue: tickets
            .filter(t => t.status === 'confirmed')
            .reduce((sum, t) => sum + (t.paymentAmount || 0), 0),
    };

    const exportCSV = () => {
        const headers = ['ID', 'Event', 'Attendee', 'Email', 'Status', 'Amount', 'Payment Method', 'Check-In', 'Created'];
        const rows = filteredTickets.map(t => [
            t.id,
            t.eventTitle || '',
            t.userName || '',
            t.userEmail || '',
            t.status,
            t.paymentAmount || '',
            t.paymentMethod || '',
            t.checkInStatus || 'not-checked-in',
            t.createdAt.toLocaleDateString(),
        ]);

        const csv = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tickets-export-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    if (authLoading || loading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center min-h-screen">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            </AdminLayout>
        );
    }

    if (!user) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <div className="text-red-600 text-4xl mb-4">🚫</div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
                        <p className="text-gray-600">Please sign in to access this page.</p>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 relative overflow-hidden">
                {/* Animated Background */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-blob"></div>
                    <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
                </div>

                <div className="relative z-10 p-8">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-5xl font-black bg-gradient-to-r from-slate-900 via-blue-900 to-purple-900 bg-clip-text text-transparent mb-2">
                            Ticket Management
                        </h1>
                        <p className="text-xl text-slate-600 font-medium">
                            Manage all tickets across all events
                        </p>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">
                        {[
                            { label: 'Total Tickets', value: stats.total, icon: '🎫', gradient: 'from-blue-500 to-cyan-500' },
                            { label: 'Confirmed', value: stats.confirmed, icon: '✅', gradient: 'from-emerald-500 to-teal-500' },
                            { label: 'Pending', value: stats.pending, icon: '⏰', gradient: 'from-amber-500 to-orange-500' },
                            { label: 'Cancelled', value: stats.cancelled, icon: '❌', gradient: 'from-red-500 to-pink-500' },
                            { label: 'Checked In', value: stats.checkedIn, icon: '✓', gradient: 'from-purple-500 to-indigo-500' },
                            { label: 'Revenue', value: `$${stats.revenue.toFixed(0)}`, icon: '💰', gradient: 'from-green-500 to-emerald-500' },
                        ].map((stat, idx) => (
                            <div
                                key={idx}
                                className="relative bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-slate-200/50 hover:shadow-2xl transition-all duration-500 group overflow-hidden"
                                style={{ animation: `slideUp 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) ${idx * 0.1}s backwards` }}
                            >
                                <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-5 transition-opacity`}></div>
                                <div className="relative z-10">
                                    <div className="text-3xl mb-3">{stat.icon}</div>
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{stat.label}</p>
                                    <p className="text-2xl font-black text-slate-900">{stat.value}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Search and Filters */}
                    <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-slate-200/50 shadow-xl p-6 mb-8">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1 relative">
                                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input
                                    type="text"
                                    placeholder="Search by attendee, email, event, or ticket ID..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-12 pr-6 py-4 rounded-2xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all text-slate-900 font-medium bg-white"
                                />
                            </div>
                            <div className="flex gap-3">
                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value as any)}
                                    className="px-6 py-4 rounded-2xl border-2 border-slate-200 focus:border-blue-500 bg-white font-bold text-slate-700 cursor-pointer"
                                >
                                    <option value="all">All Status</option>
                                    <option value="confirmed">✅ Confirmed</option>
                                    <option value="pending">⏰ Pending</option>
                                    <option value="cancelled">❌ Cancelled</option>
                                    <option value="refunded">💸 Refunded</option>
                                </select>
                                <select
                                    value={filterEvent}
                                    onChange={(e) => setFilterEvent(e.target.value)}
                                    className="px-6 py-4 rounded-2xl border-2 border-slate-200 focus:border-blue-500 bg-white font-bold text-slate-700 cursor-pointer"
                                >
                                    <option value="all">All Events</option>
                                    {events.map(event => (
                                        <option key={event.id} value={event.id}>{event.title}</option>
                                    ))}
                                </select>
                                <button
                                    onClick={exportCSV}
                                    className="px-6 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold hover:shadow-xl transition-all"
                                >
                                    📥 Export
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Bulk Actions */}
                    {selectedTickets.size > 0 && (
                        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-6 mb-8 flex items-center justify-between">
                            <div className="text-white">
                                <p className="text-sm font-semibold opacity-90">Selected Tickets</p>
                                <p className="text-3xl font-black">{selectedTickets.size}</p>
                            </div>
                            <button
                                onClick={() => setShowBulkActionModal(true)}
                                className="bg-white text-blue-600 px-8 py-4 rounded-2xl font-black hover:scale-105 transition-transform"
                            >
                                Bulk Actions
                            </button>
                        </div>
                    )}

                    {/* Tickets Table */}
                    <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-slate-200/50 shadow-2xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gradient-to-r from-slate-50 to-blue-50/50 border-b-2 border-slate-200">
                                    <tr>
                                        <th className="px-6 py-5 text-left">
                                            <input
                                                type="checkbox"
                                                checked={selectedTickets.size === filteredTickets.length && filteredTickets.length > 0}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedTickets(new Set(filteredTickets.map(t => t.id)));
                                                    } else {
                                                        setSelectedTickets(new Set());
                                                    }
                                                }}
                                                className="w-5 h-5 rounded cursor-pointer"
                                            />
                                        </th>
                                        <th className="px-6 py-5 text-left text-sm font-black text-slate-700 uppercase">Event</th>
                                        <th className="px-6 py-5 text-left text-sm font-black text-slate-700 uppercase">Attendee</th>
                                        <th className="px-6 py-5 text-left text-sm font-black text-slate-700 uppercase">Status</th>
                                        <th className="px-6 py-5 text-left text-sm font-black text-slate-700 uppercase">Amount</th>
                                        <th className="px-6 py-5 text-left text-sm font-black text-slate-700 uppercase">Check-In</th>
                                        <th className="px-6 py-5 text-left text-sm font-black text-slate-700 uppercase">Date</th>
                                        <th className="px-6 py-5 text-center text-sm font-black text-slate-700 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredTickets.map((ticket, idx) => (
                                        <tr
                                            key={ticket.id}
                                            className="border-b border-slate-100 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/30 transition-all"
                                        >
                                            <td className="px-6 py-4">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedTickets.has(ticket.id)}
                                                    onChange={(e) => {
                                                        const newSelected = new Set(selectedTickets);
                                                        if (e.target.checked) {
                                                            newSelected.add(ticket.id);
                                                        } else {
                                                            newSelected.delete(ticket.id);
                                                        }
                                                        setSelectedTickets(newSelected);
                                                    }}
                                                    className="w-5 h-5 rounded cursor-pointer"
                                                />
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="font-bold text-slate-900 text-sm">{ticket.eventTitle}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="font-bold text-slate-900">{ticket.userName || 'Unknown'}</p>
                                                <p className="text-sm text-slate-500">{ticket.userEmail}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <select
                                                    value={ticket.status}
                                                    onChange={(e) => handleTicketStatusChange(ticket.id, e.target.value)}
                                                    className="px-3 py-1.5 rounded-xl text-xs font-bold border-2 cursor-pointer"
                                                    style={{
                                                        backgroundColor: ticket.status === 'confirmed' ? '#d1fae5' :
                                                            ticket.status === 'pending' ? '#fef3c7' :
                                                                ticket.status === 'cancelled' ? '#fee2e2' : '#f3f4f6',
                                                        color: ticket.status === 'confirmed' ? '#065f46' :
                                                            ticket.status === 'pending' ? '#92400e' :
                                                                ticket.status === 'cancelled' ? '#991b1b' : '#374151',
                                                        borderColor: ticket.status === 'confirmed' ? '#a7f3d0' :
                                                            ticket.status === 'pending' ? '#fde68a' :
                                                                ticket.status === 'cancelled' ? '#fecaca' : '#e5e7eb',
                                                    }}
                                                >
                                                    <option value="confirmed">Confirmed</option>
                                                    <option value="pending">Pending</option>
                                                    <option value="cancelled">Cancelled</option>
                                                    <option value="refunded">Refunded</option>
                                                </select>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="font-bold text-slate-900">${ticket.paymentAmount || '0'}</p>
                                                <p className="text-xs text-slate-500">{ticket.paymentMethod || 'N/A'}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${ticket.checkInStatus === 'checked-in'
                                                    ? 'bg-emerald-100 text-emerald-700'
                                                    : 'bg-slate-100 text-slate-600'
                                                    }`}>
                                                    {ticket.checkInStatus === 'checked-in' ? '✓ Checked In' : 'Not Checked In'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-600 font-semibold">
                                                {ticket.createdAt.toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    onClick={() => {
                                                        setSelectedTicket(ticket);
                                                        setShowQRModal(true);
                                                    }}
                                                    className="text-blue-600 hover:text-blue-800 font-bold text-sm underline"
                                                >
                                                    View QR
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {filteredTickets.length === 0 && (
                                <div className="text-center py-16">
                                    <div className="text-6xl mb-4">🎫</div>
                                    <h3 className="text-2xl font-black text-slate-900 mb-2">No Tickets Found</h3>
                                    <p className="text-slate-500">Try adjusting your search or filters</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Bulk Action Modal */}
            {showBulkActionModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full p-8">
                        <h2 className="text-2xl font-black mb-6">Bulk Actions</h2>
                        <p className="text-slate-600 mb-6">
                            You have selected {selectedTickets.size} ticket(s). What would you like to do?
                        </p>
                        <div className="space-y-3 mb-6">
                            <label className="flex items-center gap-3 p-4 border-2 rounded-2xl cursor-pointer hover:border-blue-500">
                                <input
                                    type="radio"
                                    name="bulkAction"
                                    value="confirm"
                                    checked={bulkAction === 'confirm'}
                                    onChange={(e) => setBulkAction(e.target.value as any)}
                                    className="w-5 h-5"
                                />
                                <div>
                                    <p className="font-bold text-slate-900">Confirm Tickets</p>
                                    <p className="text-sm text-slate-500">Mark selected tickets as confirmed</p>
                                </div>
                            </label>
                            <label className="flex items-center gap-3 p-4 border-2 rounded-2xl cursor-pointer hover:border-blue-500">
                                <input
                                    type="radio"
                                    name="bulkAction"
                                    value="cancel"
                                    checked={bulkAction === 'cancel'}
                                    onChange={(e) => setBulkAction(e.target.value as any)}
                                    className="w-5 h-5"
                                />
                                <div>
                                    <p className="font-bold text-slate-900">Cancel Tickets</p>
                                    <p className="text-sm text-slate-500">Cancel selected tickets</p>
                                </div>
                            </label>
                            <label className="flex items-center gap-3 p-4 border-2 rounded-2xl cursor-pointer hover:border-blue-500">
                                <input
                                    type="radio"
                                    name="bulkAction"
                                    value="refund"
                                    checked={bulkAction === 'refund'}
                                    onChange={(e) => setBulkAction(e.target.value as any)}
                                    className="w-5 h-5"
                                />
                                <div>
                                    <p className="font-bold text-slate-900">Refund Tickets</p>
                                    <p className="text-sm text-slate-500">Mark selected tickets as refunded</p>
                                </div>
                            </label>
                        </div>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setShowBulkActionModal(false)}
                                className="flex-1 px-6 py-4 rounded-2xl border-2 border-slate-200 text-slate-700 font-bold hover:bg-slate-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleBulkAction}
                                className="flex-1 px-6 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold hover:shadow-xl"
                            >
                                Apply
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* QR Code Modal */}
            {showQRModal && selectedTicket && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-8">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-black">Ticket QR Code</h2>
                            <button
                                onClick={() => {
                                    setShowQRModal(false);
                                    setSelectedTicket(null);
                                }}
                                className="text-slate-400 hover:text-slate-900 text-3xl font-bold"
                            >
                                ×
                            </button>
                        </div>

                        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 mb-6">
                            <div className="flex items-center justify-center bg-white rounded-2xl p-6 mb-4">
                                <QRCodeCanvas
                                    value={JSON.stringify({
                                        ticketId: selectedTicket.id,
                                        eventId: selectedTicket.eventId,
                                        userId: selectedTicket.userId,
                                        qrCodeId: selectedTicket.qrCodeId || `qr_${selectedTicket.id}`,
                                        timestamp: Date.now(),
                                    })}
                                    size={300}
                                    level="H"
                                    includeMargin
                                />
                            </div>
                            <p className="text-center text-sm font-bold text-slate-600">
                                Ticket ID: {selectedTicket.id.slice(-8).toUpperCase()}
                            </p>
                        </div>

                        <div className="space-y-3 mb-6">
                            <div className="flex justify-between">
                                <span className="text-slate-600 font-semibold">Event:</span>
                                <span className="font-bold text-slate-900">{selectedTicket.eventTitle}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-600 font-semibold">Attendee:</span>
                                <span className="font-bold text-slate-900">{selectedTicket.userName}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-600 font-semibold">Status:</span>
                                <span className={`font-bold ${selectedTicket.status === 'confirmed' ? 'text-emerald-600' :
                                        selectedTicket.status === 'pending' ? 'text-amber-600' :
                                            'text-red-600'
                                    }`}>
                                    {selectedTicket.status.toUpperCase()}
                                </span>
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                setShowQRModal(false);
                                setSelectedTicket(null);
                            }}
                            className="w-full px-6 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold hover:shadow-xl"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
