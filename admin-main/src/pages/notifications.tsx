/**
 * NOTIFICATION MANAGEMENT - Platform-wide Notifications
 * Send announcements, schedule notifications, view history
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { AdminLayout } from '../components/AdminLayout';

interface PlatformNotification {
    id: string;
    title: string;
    message: string;
    type: 'announcement' | 'alert' | 'update' | 'maintenance';
    targetAudience: 'all' | 'hosts' | 'attendees';
    scheduledFor?: string;
    sentAt?: string;
    createdBy: string;
    createdAt: string;
    status: 'draft' | 'scheduled' | 'sent';
    deliveryMethod: string[];
    stats?: {
        sent: number;
        delivered: number;
    };
}

const TYPE_ICONS: Record<PlatformNotification['type'], React.ReactNode> = {
    announcement: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>,
    alert: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" /></svg>,
    update: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>,
    maintenance: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.65 1.65 0 004.6 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 4.6" /></svg>,
};

const AUDIENCE_ICONS: Record<'all' | 'hosts' | 'attendees', React.ReactNode> = {
    all: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
    hosts: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
    attendees: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="4" y="7" width="16" height="12" rx="2" /><path d="M4 11h16" /></svg>,
};

const statusStyle = (status: PlatformNotification['status']) => {
    switch (status) {
        case 'sent':
            return 'bg-emerald-50 text-emerald-700';
        case 'scheduled':
            return 'bg-secondary-50 text-secondary-700';
        default:
            return 'bg-gray-100 text-gray-600';
    }
};

const typeStyle = (type: PlatformNotification['type']) => {
    switch (type) {
        case 'announcement':
            return 'bg-primary-50 text-primary-700';
        case 'alert':
            return 'bg-red-50 text-red-700';
        case 'update':
            return 'bg-accent-50 text-accent-700';
        default:
            return 'bg-gray-100 text-gray-600';
    }
};

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<PlatformNotification[]>([]);
    const [showComposer, setShowComposer] = useState(false);
    const [loading, setLoading] = useState(true);

    const [formData, setFormData] = useState({
        title: '',
        message: '',
        type: 'announcement' as PlatformNotification['type'],
        targetAudience: 'all' as PlatformNotification['targetAudience'],
        deliveryMethod: ['email'],
        scheduleDate: '',
        scheduleTime: '',
    });

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const { data, error } = await supabase
                .from('platform_notifications')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            const notifs: PlatformNotification[] = (data || []).map((row: any) => ({
                id: row.id,
                title: row.title,
                message: row.message,
                type: row.type,
                targetAudience: row.target_audience,
                scheduledFor: row.scheduled_for,
                sentAt: row.sent_at,
                createdBy: row.created_by,
                createdAt: row.created_at,
                status: row.status,
                deliveryMethod: row.delivery_method || [],
                stats: row.stats,
            }));

            setNotifications(notifs);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async (scheduled: boolean = false) => {
        if (!formData.title || !formData.message) {
            alert('Please fill in all required fields');
            return;
        }
        try {
            const scheduledFor = scheduled && formData.scheduleDate && formData.scheduleTime
                ? new Date(`${formData.scheduleDate}T${formData.scheduleTime}`).toISOString()
                : null;

            const { error } = await supabase.from('platform_notifications').insert({
                title: formData.title,
                message: formData.message,
                type: formData.type,
                target_audience: formData.targetAudience,
                delivery_method: formData.deliveryMethod,
                scheduled_for: scheduledFor,
                sent_at: !scheduled ? new Date().toISOString() : null,
                created_by: 'admin',
                status: scheduled ? 'scheduled' : 'sent',
                stats: { sent: 0, delivered: 0 },
            });

            if (error) throw error;

            alert(scheduled ? 'Notification scheduled.' : 'Notification sent.');

            setFormData({
                title: '',
                message: '',
                type: 'announcement',
                targetAudience: 'all',
                deliveryMethod: ['email'],
                scheduleDate: '',
                scheduleTime: '',
            });

            setShowComposer(false);
            fetchNotifications();
        } catch (error) {
            console.error('Error sending notification:', error);
            alert('Failed to send notification');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this notification?')) return;

        try {
            const { error } = await supabase.from('platform_notifications').delete().eq('id', id);
            if (error) throw error;
            fetchNotifications();
        } catch (error) {
            console.error('Error deleting notification:', error);
            alert('Failed to delete notification');
        }
    };

    return (
        <AdminLayout>
            <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-extrabold text-gray-900 mb-1">Notification Management</h1>
                        <p className="text-sm text-gray-500">Send platform-wide announcements and manage notifications</p>
                    </div>
                    <button
                        onClick={() => setShowComposer(!showComposer)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold text-sm transition-colors flex-shrink-0"
                    >
                        {!showComposer && (
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M22 2L11 13" /><path d="M22 2l-7 20-4-9-9-4 20-7z" /></svg>
                        )}
                        {showComposer ? 'Cancel' : 'New notification'}
                    </button>
                </div>

                {showComposer && (
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
                        <p className="text-base font-extrabold text-gray-900 mb-4">Compose notification</p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Title *</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                                    placeholder="Notification title..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Message *</label>
                                <textarea
                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                                    rows={4}
                                    placeholder="Your message here..."
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Type</label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value as PlatformNotification['type'] })}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                                    >
                                        <option value="announcement">Announcement</option>
                                        <option value="alert">Alert</option>
                                        <option value="update">Update</option>
                                        <option value="maintenance">Maintenance</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Target audience</label>
                                    <select
                                        value={formData.targetAudience}
                                        onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value as PlatformNotification['targetAudience'] })}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                                    >
                                        <option value="all">All users</option>
                                        <option value="hosts">Hosts only</option>
                                        <option value="attendees">Attendees only</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Delivery method</label>
                                    <div className="flex gap-4 items-center pt-2.5">
                                        <label className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={formData.deliveryMethod.includes('email')}
                                                onChange={(e) => {
                                                    const methods = e.target.checked
                                                        ? [...formData.deliveryMethod, 'email']
                                                        : formData.deliveryMethod.filter(m => m !== 'email');
                                                    setFormData({ ...formData, deliveryMethod: methods });
                                                }}
                                                className="rounded text-primary-600 focus:ring-primary-500"
                                            />
                                            <span className="text-sm text-gray-700">Email</span>
                                        </label>
                                        <label className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={formData.deliveryMethod.includes('push')}
                                                onChange={(e) => {
                                                    const methods = e.target.checked
                                                        ? [...formData.deliveryMethod, 'push']
                                                        : formData.deliveryMethod.filter(m => m !== 'push');
                                                    setFormData({ ...formData, deliveryMethod: methods });
                                                }}
                                                className="rounded text-primary-600 focus:ring-primary-500"
                                            />
                                            <span className="text-sm text-gray-700">Push</span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Schedule date (optional)</label>
                                    <input
                                        type="date"
                                        value={formData.scheduleDate}
                                        onChange={(e) => setFormData({ ...formData, scheduleDate: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Schedule time (optional)</label>
                                    <input
                                        type="time"
                                        value={formData.scheduleTime}
                                        onChange={(e) => setFormData({ ...formData, scheduleTime: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => handleSend(false)}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-secondary-500 hover:bg-secondary-600 text-white rounded-xl font-bold text-sm transition-colors"
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M22 2L11 13" /><path d="M22 2l-7 20-4-9-9-4 20-7z" /></svg>
                                    Send now
                                </button>
                                {formData.scheduleDate && formData.scheduleTime && (
                                    <button
                                        onClick={() => handleSend(true)}
                                        className="flex items-center gap-2 px-5 py-2.5 bg-accent-500 hover:bg-accent-600 text-white rounded-xl font-bold text-sm transition-colors"
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></svg>
                                        Schedule
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-100">
                        <p className="text-base font-extrabold text-gray-900">Notification history</p>
                    </div>

                    {loading ? (
                        <div className="p-12 text-center">
                            <div className="inline-block w-9 h-9 border-4 border-gray-200 border-t-primary-600 rounded-full animate-spin" />
                            <p className="mt-4 text-sm text-gray-500">Loading notifications...</p>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="p-12 text-center text-sm text-gray-400">
                            No notifications yet
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {notifications.map(notif => (
                                <div key={notif.id} className="p-6 hover:bg-gray-50">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <h3 className="text-sm font-bold text-gray-900">{notif.title}</h3>
                                                <span className={`px-2.5 py-1 text-[10.5px] font-bold rounded-full ${statusStyle(notif.status)}`}>
                                                    {notif.status}
                                                </span>
                                                <span className={`flex items-center gap-1 px-2.5 py-1 text-[10.5px] font-bold rounded-full ${typeStyle(notif.type)}`}>
                                                    {TYPE_ICONS[notif.type]}
                                                    {notif.type}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500 mb-2">{notif.message}</p>
                                            <div className="flex gap-4 text-[11.5px] text-gray-400">
                                                <span className="flex items-center gap-1.5">{AUDIENCE_ICONS[notif.targetAudience]}{notif.targetAudience}</span>
                                                <span>{notif.deliveryMethod.join(', ')}</span>
                                                <span>
                                                    {notif.sentAt
                                                        ? `Sent: ${new Date(notif.sentAt).toLocaleString()}`
                                                        : notif.scheduledFor
                                                            ? `Scheduled: ${new Date(notif.scheduledFor).toLocaleString()}`
                                                            : 'Draft'
                                                    }
                                                </span>
                                            </div>
                                        </div>
                                        {notif.status === 'scheduled' && (
                                            <button
                                                onClick={() => handleDelete(notif.id)}
                                                className="text-red-600 hover:text-red-800 text-xs font-bold flex-shrink-0"
                                            >
                                                Cancel
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}