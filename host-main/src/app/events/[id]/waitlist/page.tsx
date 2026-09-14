'use client';

import React, { useEffect, useState } from 'react';
import { use } from 'react';
import { supabase } from '@/lib/supabase';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import { useRouter } from 'next/navigation';

interface WaitlistEntry {
    id: string;
    user_id: string;
    user_email: string;
    user_name: string;
    added_at: string;
    position: number;
    priority: number;
    notified: boolean;
    converted_to_ticket: boolean;
}

export default function WaitlistPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: eventId } = use(params);
    const router = useRouter();
    const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
    const [event, setEvent] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [notifying, setNotifying] = useState(false);

    useEffect(() => {
        async function fetchData() {
            try {
                const { data: eventData } = await supabase
                    .from('events')
                    .select('*')
                    .eq('id', eventId)
                    .maybeSingle();

                if (eventData) setEvent(eventData);

                const { data: entries, error } = await supabase
                    .from('waitlist')
                    .select('*')
                    .eq('event_id', eventId)
                    .order('priority', { ascending: false })
                    .order('added_at', { ascending: true });

                if (error) throw error;

                setWaitlist(entries ?? []);
            } catch (error) {
                console.error('Error fetching waitlist:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [eventId]);

    const handleNotify = async (count: number) => {
        if (!confirm(`Notify the next ${count} people on the waitlist?`)) return;

        setNotifying(true);
        try {
            const response = await fetch(`/api/events/${eventId}/waitlist/notify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ count }),
            });

            if (response.ok) {
                const { notified } = await response.json();
                alert(`✅ Successfully notified ${notified} people!`);
                window.location.reload();
            } else {
                alert('Failed to notify waitlist');
            }
        } catch (error) {
            console.error('Notify error:', error);
            alert('Error notifying waitlist');
        } finally {
            setNotifying(false);
        }
    };

    const handleRemove = async (entryId: string, userName: string) => {
        if (!confirm(`Remove ${userName} from the waitlist?`)) return;

        try {
            const { error } = await supabase.from('waitlist').delete().eq('id', entryId);
            if (error) throw error;

            setWaitlist(waitlist.filter((entry) => entry.id !== entryId));
            alert(`✅ Removed ${userName} from waitlist`);
        } catch (error) {
            console.error('Remove error:', error);
            alert('Error removing from waitlist');
        }
    };

    if (loading) {
        return (
            <ProtectedRoute>
                <DashboardLayout currentPage="events">
                    <div className="flex items-center justify-center min-h-screen">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto"></div>
                            <p className="mt-4 text-gray-600">Loading waitlist...</p>
                        </div>
                    </div>
                </DashboardLayout>
            </ProtectedRoute>
        );
    }

    const activeWaitlist = waitlist.filter((e) => !e.converted_to_ticket && !e.notified);
    const notifiedWaitlist = waitlist.filter((e) => e.notified && !e.converted_to_ticket);
    const convertedWaitlist = waitlist.filter((e) => e.converted_to_ticket);

    return (
        <ProtectedRoute>
            <DashboardLayout currentPage="events">
                <div className="container mx-auto p-6 max-w-6xl">
                    <div className="mb-6">
                        <button
                            onClick={() => router.push(`/events/${eventId}`)}
                            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            Back to Event
                        </button>

                        <h1 className="text-2xl font-extrabold text-gray-900">Waitlist Management</h1>
                        <p className="text-gray-500 mt-1">{event?.title}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white rounded-xl border border-gray-200 p-4">
                            <p className="text-sm text-gray-500">Total Waitlist</p>
                            <p className="text-2xl font-bold text-gray-900">{waitlist.length}</p>
                        </div>
                        <div className="bg-orange-50 rounded-xl border border-orange-200 p-4">
                            <p className="text-sm text-orange-600">Active</p>
                            <p className="text-2xl font-bold text-orange-900">{activeWaitlist.length}</p>
                        </div>
                        <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
                            <p className="text-sm text-blue-600">Notified</p>
                            <p className="text-2xl font-bold text-blue-900">{notifiedWaitlist.length}</p>
                        </div>
                        <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-4">
                            <p className="text-sm text-emerald-600">Converted</p>
                            <p className="text-2xl font-bold text-emerald-900">{convertedWaitlist.length}</p>
                        </div>
                    </div>

                    {activeWaitlist.length > 0 && (
                        <div className="bg-primary-50 border border-primary-100 rounded-xl p-5 mb-6">
                            <div className="flex items-center justify-between flex-wrap gap-3">
                                <div>
                                    <p className="font-bold text-gray-900">Notify Waitlist</p>
                                    <p className="text-sm text-gray-500">Send email notifications when spots become available</p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleNotify(1)}
                                        disabled={notifying}
                                        className="px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-bold text-sm disabled:opacity-50 transition-colors"
                                    >
                                        Notify Next 1
                                    </button>
                                    {activeWaitlist.length >= 5 && (
                                        <button
                                            onClick={() => handleNotify(5)}
                                            disabled={notifying}
                                            className="px-4 py-2.5 bg-secondary-500 hover:bg-secondary-600 text-white rounded-lg font-bold text-sm disabled:opacity-50 transition-colors"
                                        >
                                            Notify Next 5
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Position</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Email</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Joined</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {waitlist.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                                No one on the waitlist yet
                                            </td>
                                        </tr>
                                    ) : (
                                        waitlist.map((entry, index) => (
                                            <tr key={entry.id} className={entry.converted_to_ticket ? 'bg-emerald-50' : entry.notified ? 'bg-blue-50' : ''}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">#{index + 1}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entry.user_name}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{entry.user_email}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                    {new Date(entry.added_at).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    {entry.converted_to_ticket ? (
                                                        <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800">Converted</span>
                                                    ) : entry.notified ? (
                                                        <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-800">Notified</span>
                                                    ) : (
                                                        <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-orange-100 text-orange-800">Waiting</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    <button
                                                        onClick={() => handleRemove(entry.id, entry.user_name)}
                                                        className="text-red-600 hover:text-red-700 font-semibold"
                                                    >
                                                        Remove
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    );
}