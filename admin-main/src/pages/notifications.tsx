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

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<PlatformNotification[]>([]);
    const [showComposer, setShowComposer] = useState(false);
    const [loading, setLoading] = useState(true);

    const [formData, setFormData] = useState({
        title: '',
        message: '',
        type: 'announcement' as const,
        targetAudience: 'all' as const,
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

            alert(scheduled ? '✅ Notification scheduled!' : '✅ Notification sent!');

            // Reset form
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
            alert('✅ Notification deleted');
            fetchNotifications();
        } catch (error) {
            console.error('Error deleting notification:', error);
            alert('Failed to delete notification');
        }
    };

    return (
        <AdminLayout>
            <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Notification Management</h1>
                        <p className="text-gray-600">Send platform-wide announcements and manage notifications</p>
                    </div>
                    <button
                        onClick={() => setShowComposer(!showComposer)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                    >
                        {showComposer ? 'Cancel' : '✉️ New Notification'}
                    </button>
                </div>

                {/* Composer */}
                {showComposer && (
                    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Compose Notification</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="Notification title..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Message *</label>
                                <textarea
                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    rows={4}
                                    placeholder="Your message here..."
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="announcement">📢 Announcement</option>
                                        <option value="alert">⚠️ Alert</option>
                                        <option value="update">🔔 Update</option>
                                        <option value="maintenance">🔧 Maintenance</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Target Audience</label>
                                    <select
                                        value={formData.targetAudience}
                                        onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value as any })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="all">👥 All Users</option>
                                        <option value="hosts">🎯 Hosts Only</option>
                                        <option value="attendees">🎫 Attendees Only</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Method</label>
                                    <div className="flex gap-2 items-center pt-2">
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
                                                className="rounded"
                                            />
                                            <span className="text-sm">Email</span>
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
                                                className="rounded"
                                            />
                                            <span className="text-sm">Push</span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Schedule Date (Optional)</label>
                                    <input
                                        type="date"
                                        value={formData.scheduleDate}
                                        onChange={(e) => setFormData({ ...formData, scheduleDate: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Schedule Time (Optional)</label>
                                    <input
                                        type="time"
                                        value={formData.scheduleTime}
                                        onChange={(e) => setFormData({ ...formData, scheduleTime: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => handleSend(false)}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                                >
                                    📤 Send Now
                                </button>
                                {formData.scheduleDate && formData.scheduleTime && (
                                    <button
                                        onClick={() => handleSend(true)}
                                        className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
                                    >
                                        ⏰ Schedule
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Notifications History */}
                <div className="bg-white rounded-lg border border-gray-200">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-900">Notification History</h2>
                    </div>

                    {loading ? (
                        <div className="p-12 text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="mt-4 text-gray-600">Loading notifications...</p>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="p-12 text-center text-gray-500">
                            No notifications yet
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-200">
                            {notifications.map(notif => (
                                <div key={notif.id} className="p-6 hover:bg-gray-50">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-lg font-semibold text-gray-900">{notif.title}</h3>
                                                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${notif.status === 'sent' ? 'bg-green-100 text-green-800' :
                                                    notif.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                                                        'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {notif.status}
                                                </span>
                                                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                                                    {notif.type}
                                                </span>
                                            </div>
                                            <p className="text-gray-600 mb-2">{notif.message}</p>
                                            <div className="flex gap-4 text-sm text-gray-500">
                                                <span>👥 {notif.targetAudience}</span>
                                                <span>📧 {notif.deliveryMethod.join(', ')}</span>
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
                                                className="text-red-600 hover:text-red-800 text-sm font-medium"
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
