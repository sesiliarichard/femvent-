/**
 * CONTENT MODERATION - Moderation Queue Page
 * Admin page for reviewing reported content
 */

import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { AdminLayout } from '../components/AdminLayout';

interface ContentReport {
    id: string;
    reportedBy: string;
    reportedUserId: string;
    reportedUserEmail?: string;
    contentType: 'event' | 'user' | 'comment';
    contentId: string;
    reason: string;
    description: string;
    status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
    createdAt: string;
    reviewedAt?: string;
    reviewedBy?: string;
    action?: 'none' | 'warning' | 'suspend' | 'ban' | 'delete';
}

export default function ModerationPage() {
    const [reports, setReports] = useState<ContentReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'pending' | 'reviewed'>('pending');

    useEffect(() => {
        fetchReports();
    }, [filter]);

    const fetchReports = async () => {
        try {
            let q = supabase
                .from('content_reports')
                .select('*')
                .order('created_at', { ascending: false });

            if (filter !== 'all') {
                q = q.eq('status', filter);
            }

            const { data, error } = await q;
            if (error) throw error;

            const reportsData: ContentReport[] = (data || []).map((row: any) => ({
                id: row.id,
                reportedBy: row.reported_by,
                reportedUserId: row.reported_user_id,
                reportedUserEmail: row.reported_user_email,
                contentType: row.content_type,
                contentId: row.content_id,
                reason: row.reason,
                description: row.description,
                status: row.status,
                createdAt: row.created_at,
                reviewedAt: row.reviewed_at,
                reviewedBy: row.reviewed_by,
                action: row.action,
            }));

            setReports(reportsData);
        } catch (error) {
            console.error('Error fetching reports:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (reportId: string, action: 'warning' | 'suspend' | 'ban' | 'delete' | 'dismiss') => {
        if (!confirm(`Are you sure you want to ${action} this content/user?`)) return;

        try {
            const report = reports.find(r => r.id === reportId);

            // Update report
            const { error: updateError } = await supabase
                .from('content_reports')
                .update({
                    status: action === 'dismiss' ? 'dismissed' : 'resolved',
                    action,
                    reviewed_at: new Date().toISOString(),
                    reviewed_by: 'admin', // Replace with actual admin ID from auth
                })
                .eq('id', reportId);

            if (updateError) throw updateError;

            // If banning or suspending, create ban record
            if ((action === 'ban' || action === 'suspend') && report) {
                const expiresAt = action === 'suspend'
                    ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                    : null;

                const { error: banError } = await supabase.from('user_bans').insert({
                    user_id: report.reportedUserId,
                    reason: report.description,
                    banned_by: 'admin',
                    expires_at: expiresAt,
                    type: action,
                    active: true,
                });

                if (banError) throw banError;
            }

            alert(`✅ Action "${action}" completed successfully!`);
            fetchReports();
        } catch (error) {
            console.error('Error taking action:', error);
            alert('Failed to complete action');
        }
    };

    return (
        <AdminLayout>
            <div className="p-6">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Content Moderation</h1>
                    <p className="text-gray-600">Review and manage reported content</p>
                </div>

                {/* Filters */}
                <div className="flex gap-3 mb-6">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-lg font-medium ${filter === 'all'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-700 border border-gray-300'
                            }`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setFilter('pending')}
                        className={`px-4 py-2 rounded-lg font-medium ${filter === 'pending'
                            ? 'bg-orange-600 text-white'
                            : 'bg-white text-gray-700 border border-gray-300'
                            }`}
                    >
                        Pending {reports.filter(r => r.status === 'pending').length > 0 && `(${reports.filter(r => r.status === 'pending').length})`}
                    </button>
                    <button
                        onClick={() => setFilter('reviewed')}
                        className={`px-4 py-2 rounded-lg font-medium ${filter === 'reviewed'
                            ? 'bg-green-600 text-white'
                            : 'bg-white text-gray-700 border border-gray-300'
                            }`}
                    >
                        Reviewed
                    </button>
                </div>

                {/* Reports List */}
                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading reports...</p>
                    </div>
                ) : reports.length === 0 ? (
                    <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                        <p className="text-gray-500">No reports found</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {reports.map(report => (
                            <div key={report.id} className="bg-white rounded-lg border border-gray-200 p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                                {report.contentType}
                                            </span>
                                            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${report.status === 'pending' ? 'bg-orange-100 text-orange-800' :
                                                report.status === 'resolved' ? 'bg-green-100 text-green-800' :
                                                    'bg-gray-100 text-gray-800'
                                                }`}>
                                                {report.status}
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-1">{report.reason}</h3>
                                        <p className="text-gray-600 mb-2">{report.description}</p>
                                        <div className="text-sm text-gray-500">
                                           <p>Reported: {report.createdAt ? new Date(report.createdAt).toLocaleString() : 'Unknown'}</p>
                                            <p>Content ID: {report.contentId}</p>
                                            <p>Reported User: {report.reportedUserEmail || report.reportedUserId}</p>
                                        </div>
                                    </div>
                                </div>

                                {report.status === 'pending' && (
                                    <div className="flex gap-2 pt-4 border-t border-gray-200">
                                        <button
                                            onClick={() => handleAction(report.id, 'warning')}
                                            className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-md hover:bg-yellow-200 font-medium"
                                        >
                                            ⚠️ Warn
                                        </button>
                                        <button
                                            onClick={() => handleAction(report.id, 'suspend')}
                                            className="px-4 py-2 bg-orange-100 text-orange-800 rounded-md hover:bg-orange-200 font-medium"
                                        >
                                            ⏸️ Suspend 30d
                                        </button>
                                        <button
                                            onClick={() => handleAction(report.id, 'ban')}
                                            className="px-4 py-2 bg-red-100 text-red-800 rounded-md hover:bg-red-200 font-medium"
                                        >
                                            🚫 Ban Permanently
                                        </button>
                                        <button
                                            onClick={() => handleAction(report.id, 'dismiss')}
                                            className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 font-medium ml-auto"
                                        >
                                            Dismiss
                                        </button>
                                    </div>
                                )}

                                {report.status !== 'pending' && report.action && (
                                    <div className="pt-4 border-t border-gray-200">
                                        <p className="text-sm text-gray-600">
                                            Action taken: <span className="font-medium">{report.action}</span>
                                            {report.reviewedAt && ` on ${new Date(report.reviewedAt).toLocaleString()}`}
                                        </p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
