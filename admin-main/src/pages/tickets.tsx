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

const STATUS_STYLES: Record<string, string> = {
    confirmed: 'bg-emerald-50 text-emerald-700',
    pending: 'bg-accent-50 text-accent-700',
    cancelled: 'bg-red-50 text-red-700',
    refunded: 'bg-gray-100 text-gray-600',
};

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

        const confirmAction = window.confirm(
            `Are you sure you want to ${bulkAction} ${selectedTickets.size} ticket(s)?`
        );

        if (!confirmAction) return;

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
                    <div className="inline-block w-10 h-10 border-4 border-gray-200 border-t-primary-600 rounded-full animate-spin" />
                </div>
            </AdminLayout>
        );
    }

    if (!user) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center min-h-screen">
                    <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center max-w-sm">
                        <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                        </div>
                        <h2 className="text-base font-extrabold text-gray-900 mb-1">Access denied</h2>
                        <p className="text-sm text-gray-500">Please sign in to access this page.</p>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="p-6">
                <div className="mb-6">
                    <h1 className="text-2xl font-extrabold text-gray-900">Ticket Management</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage all tickets across all events</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                    {[
                        { label: 'Total tickets', value: stats.total },
                        { label: 'Confirmed', value: stats.confirmed },
                        { label: 'Pending', value: stats.pending },
                        { label: 'Cancelled', value: stats.cancelled },
                        { label: 'Checked in', value: stats.checkedIn },
                        { label: 'Revenue', value: `$${stats.revenue.toFixed(0)}` },
                    ].map((stat, idx) => (
                        <div key={idx} className="bg-white rounded-2xl border border-gray-100 p-4">
                            <p className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wide mb-1">{stat.label}</p>
                            <p className="text-xl font-extrabold text-gray-900">{stat.value}</p>
                        </div>
                    ))}
                </div>

                {/* Search and Filters */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6">
                    <div className="flex flex-col md:flex-row gap-3">
                        <div className="flex-1 relative">
                            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Search by attendee, email, event, or ticket ID..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-sm text-gray-900"
                            />
                        </div>
                        <div className="flex gap-2.5">
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value as any)}
                                className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-bold text-gray-700 cursor-pointer outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                            >
                                <option value="all">All status</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="pending">Pending</option>
                                <option value="cancelled">Cancelled</option>
                                <option value="refunded">Refunded</option>
                            </select>
                            <select
                                value={filterEvent}
                                onChange={(e) => setFilterEvent(e.target.value)}
                                className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-bold text-gray-700 cursor-pointer outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                            >
                                <option value="all">All events</option>
                                {events.map(event => (
                                    <option key={event.id} value={event.id}>{event.title}</option>
                                ))}
                            </select>
                            <button
                                onClick={exportCSV}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
                                Export
                            </button>
                        </div>
                    </div>
                </div>

                {/* Bulk Actions */}
                {selectedTickets.size > 0 && (
                    <div className="bg-primary-600 rounded-2xl p-5 mb-6 flex items-center justify-between">
                        <div className="text-white">
                            <p className="text-xs font-semibold opacity-90">Selected tickets</p>
                            <p className="text-2xl font-extrabold">{selectedTickets.size}</p>
                        </div>
                        <button
                            onClick={() => setShowBulkActionModal(true)}
                            className="bg-white text-primary-700 px-6 py-2.5 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity"
                        >
                            Bulk actions
                        </button>
                    </div>
                )}

                {/* Tickets Table */}
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="px-4 py-3.5 text-left">
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
                                            className="w-4 h-4 rounded text-primary-600 cursor-pointer"
                                        />
                                    </th>
                                    <th className="px-4 py-3.5 text-left text-[10.5px] font-extrabold text-gray-400 uppercase tracking-wide">Event</th>
                                    <th className="px-4 py-3.5 text-left text-[10.5px] font-extrabold text-gray-400 uppercase tracking-wide">Attendee</th>
                                    <th className="px-4 py-3.5 text-left text-[10.5px] font-extrabold text-gray-400 uppercase tracking-wide">Status</th>
                                    <th className="px-4 py-3.5 text-left text-[10.5px] font-extrabold text-gray-400 uppercase tracking-wide">Amount</th>
                                    <th className="px-4 py-3.5 text-left text-[10.5px] font-extrabold text-gray-400 uppercase tracking-wide">Check-in</th>
                                    <th className="px-4 py-3.5 text-left text-[10.5px] font-extrabold text-gray-400 uppercase tracking-wide">Date</th>
                                    <th className="px-4 py-3.5 text-center text-[10.5px] font-extrabold text-gray-400 uppercase tracking-wide">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTickets.map((ticket) => (
                                    <tr key={ticket.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3.5">
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
                                                className="w-4 h-4 rounded text-primary-600 cursor-pointer"
                                            />
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <p className="font-bold text-gray-900 text-sm">{ticket.eventTitle}</p>
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <p className="font-bold text-gray-900 text-sm">{ticket.userName || 'Unknown'}</p>
                                            <p className="text-xs text-gray-500">{ticket.userEmail}</p>
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <select
                                                value={ticket.status}
                                                onChange={(e) => handleTicketStatusChange(ticket.id, e.target.value)}
                                                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border-0 cursor-pointer outline-none ${STATUS_STYLES[ticket.status]}`}
                                            >
                                                <option value="confirmed">Confirmed</option>
                                                <option value="pending">Pending</option>
                                                <option value="cancelled">Cancelled</option>
                                                <option value="refunded">Refunded</option>
                                            </select>
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <p className="font-bold text-gray-900 text-sm">${ticket.paymentAmount || '0'}</p>
                                            <p className="text-xs text-gray-400">{ticket.paymentMethod || 'N/A'}</p>
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                                ticket.checkInStatus === 'checked-in' ? 'bg-primary-50 text-primary-700' : 'bg-gray-100 text-gray-500'
                                            }`}>
                                                {ticket.checkInStatus === 'checked-in' ? 'Checked in' : 'Not checked in'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3.5 text-xs text-gray-500 font-semibold">
                                            {ticket.createdAt.toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3.5 text-center">
                                            <button
                                                onClick={() => {
                                                    setSelectedTicket(ticket);
                                                    setShowQRModal(true);
                                                }}
                                                className="text-primary-600 hover:text-primary-700 font-bold text-xs"
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
                                <svg className="w-10 h-10 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                <h3 className="text-base font-extrabold text-gray-900 mb-1">No tickets found</h3>
                                <p className="text-sm text-gray-500">Try adjusting your search or filters</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Bulk Action Modal */}
            {showBulkActionModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6">
                        <h2 className="text-lg font-extrabold text-gray-900 mb-2">Bulk actions</h2>
                        <p className="text-sm text-gray-500 mb-5">
                            You have selected {selectedTickets.size} ticket(s). What would you like to do?
                        </p>
                        <div className="space-y-2.5 mb-6">
                            {([
                                { value: 'confirm', title: 'Confirm tickets', desc: 'Mark selected tickets as confirmed' },
                                { value: 'cancel', title: 'Cancel tickets', desc: 'Cancel selected tickets' },
                                { value: 'refund', title: 'Refund tickets', desc: 'Mark selected tickets as refunded' },
                            ] as const).map((opt) => (
                                <label key={opt.value} className={`flex items-center gap-3 p-3.5 border rounded-xl cursor-pointer transition-colors ${bulkAction === opt.value ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}>
                                    <input
                                        type="radio"
                                        name="bulkAction"
                                        value={opt.value}
                                        checked={bulkAction === opt.value}
                                        onChange={(e) => setBulkAction(e.target.value as any)}
                                        className="w-4 h-4 text-primary-600"
                                    />
                                    <div>
                                        <p className="font-bold text-gray-900 text-sm">{opt.title}</p>
                                        <p className="text-xs text-gray-500">{opt.desc}</p>
                                    </div>
                                </label>
                            ))}
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowBulkActionModal(false)}
                                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleBulkAction}
                                className="flex-1 px-4 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm transition-colors"
                            >
                                Apply
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* QR Code Modal */}
            {showQRModal && selectedTicket && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-lg font-extrabold text-gray-900">Ticket QR code</h2>
                            <button
                                onClick={() => {
                                    setShowQRModal(false);
                                    setSelectedTicket(null);
                                }}
                                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                            >
                                ×
                            </button>
                        </div>

                        <div className="bg-primary-50 rounded-2xl p-5 mb-5">
                            <div className="flex items-center justify-center bg-white rounded-xl p-5 mb-3">
                                <QRCodeCanvas
                                    value={JSON.stringify({
                                        ticketId: selectedTicket.id,
                                        eventId: selectedTicket.eventId,
                                        userId: selectedTicket.userId,
                                        qrCodeId: selectedTicket.qrCodeId || `qr_${selectedTicket.id}`,
                                        timestamp: Date.now(),
                                    })}
                                    size={280}
                                    level="H"
                                    includeMargin
                                />
                            </div>
                            <p className="text-center text-sm font-bold text-gray-600">
                                Ticket ID: {selectedTicket.id.slice(-8).toUpperCase()}
                            </p>
                        </div>

                        <div className="space-y-2 mb-6 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500 font-semibold">Event:</span>
                                <span className="font-bold text-gray-900">{selectedTicket.eventTitle}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500 font-semibold">Attendee:</span>
                                <span className="font-bold text-gray-900">{selectedTicket.userName}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500 font-semibold">Status:</span>
                                <span className={`font-bold ${
                                    selectedTicket.status === 'confirmed' ? 'text-emerald-600' :
                                    selectedTicket.status === 'pending' ? 'text-accent-700' :
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
                            className="w-full px-4 py-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}