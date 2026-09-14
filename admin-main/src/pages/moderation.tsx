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

const STATUS_STYLES: Record<string, string> = {
    pending: 'bg-accent-50 text-accent-700',
    resolved: 'bg-emerald-50 text-emerald-700',
    dismissed: 'bg-gray-100 text-gray-600',
    reviewed: 'bg-gray-100 text-gray-600',
};

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

            alert(`Action "${action}" completed successfully!`);
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
                    <h1 className="text-2xl font-extrabold text-gray-900">Content Moderation</h1>
                    <p className="text-sm text-gray-500 mt-1">Review and manage reported content</p>
                </div>

                {/* Filters */}
                <div className="flex gap-2.5 mb-6">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4.5 py-2.5 rounded-xl font-bold text-sm transition-colors ${filter === 'all'
                            ? 'bg-primary-600 text-white'
                            : 'bg-white text-gray-600 border border-gray-200'
                            }`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setFilter('pending')}
                        className={`px-4.5 py-2.5 rounded-xl font-bold text-sm transition-colors ${filter === 'pending'
                            ? 'bg-accent-500 text-white'
                            : 'bg-white text-gray-600 border border-gray-200'
                            }`}
                    >
                        Pending {reports.filter(r => r.status === 'pending').length > 0 && `(${reports.filter(r => r.status === 'pending').length})`}
                    </button>
                    <button
                        onClick={() => setFilter('reviewed')}
                        className={`px-4.5 py-2.5 rounded-xl font-bold text-sm transition-colors ${filter === 'reviewed'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-white text-gray-600 border border-gray-200'
                            }`}
                    >
                        Reviewed
                    </button>
                </div>

                {/* Reports List */}
                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-primary-600 mx-auto"></div>
                        <p className="mt-4 text-gray-500 text-sm">Loading reports...</p>
                    </div>
                ) : reports.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                        <p className="text-gray-500 text-sm">No reports found</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {reports.map(report => (
                            <div key={report.id} className="bg-white rounded-2xl border border-gray-100 p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="px-2.5 py-1 text-[10.5px] font-extrabold rounded-full bg-primary-50 text-primary-700 uppercase">
                                                {report.contentType}
                                            </span>
                                            <span className={`px-2.5 py-1 text-[10.5px] font-extrabold rounded-full uppercase ${STATUS_STYLES[report.status] || 'bg-gray-100 text-gray-600'}`}>
                                                {report.status}
                                            </span>
                                        </div>
                                        <h3 className="text-base font-extrabold text-gray-900 mb-1.5">{report.reason}</h3>
                                        <p className="text-sm text-gray-500 mb-3 leading-relaxed">{report.description}</p>
                                        <div className="text-xs text-gray-400 leading-relaxed">
                                            <p>Reported: {report.createdAt ? new Date(report.createdAt).toLocaleString() : 'Unknown'}</p>
                                            <p>Content ID: {report.contentId}</p>
                                            <p>Reported User: {report.reportedUserEmail || report.reportedUserId}</p>
                                        </div>
                                    </div>
                                </div>

                                {report.status === 'pending' && (
                                    <div className="flex gap-2 pt-4 border-t border-gray-100">
                                        <button
                                            onClick={() => handleAction(report.id, 'warning')}
                                            className="flex items-center gap-1.5 px-4 py-2.5 bg-accent-50 text-accent-700 rounded-xl hover:bg-accent-100 text-sm font-bold transition-colors"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" /></svg>
                                            Warn
                                        </button>
                                        <button
                                            onClick={() => handleAction(report.id, 'suspend')}
                                            className="flex items-center gap-1.5 px-4 py-2.5 bg-secondary-50 text-secondary-700 rounded-xl hover:bg-secondary-100 text-sm font-bold transition-colors"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" strokeWidth={2} /><path strokeLinecap="round" strokeWidth={2} d="M10 9v6M14 9v6" /></svg>
                                            Suspend 30d
                                        </button>
                                        <button
                                            onClick={() => handleAction(report.id, 'ban')}
                                            className="flex items-center gap-1.5 px-4 py-2.5 bg-red-50 text-red-700 rounded-xl hover:bg-red-100 text-sm font-bold transition-colors"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" strokeWidth={2} /><path strokeLinecap="round" strokeWidth={2} d="M6 6l12 12" /></svg>
                                            Ban Permanently
                                        </button>
                                        <button
                                            onClick={() => handleAction(report.id, 'dismiss')}
                                            className="px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 text-sm font-bold transition-colors ml-auto"
                                        >
                                            Dismiss
                                        </button>
                                    </div>
                                )}

                                {report.status !== 'pending' && report.action && (
                                    <div className="pt-4 border-t border-gray-100">
                                        <p className="text-sm text-gray-500">
                                            Action taken: <span className="font-bold text-gray-700">{report.action}</span>
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