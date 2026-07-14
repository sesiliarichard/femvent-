import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface ContentReport {
    id: string;
    reported_by: string;
    reported_user_id: string;
    content_type: 'event' | 'user' | 'comment';
    content_id: string;
    reason: string;
    description: string;
    status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
    created_at: string;
    reviewed_at?: string;
    reviewed_by?: string;
    action?: 'none' | 'warning' | 'suspend' | 'ban' | 'delete';
}

const ModerationQueue: React.FC = () => {
    const [reports, setReports] = useState<ContentReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'pending' | 'reviewed'>('pending');

    useEffect(() => {
        fetchReports();
    }, [filter]);

    const fetchReports = async () => {
        try {
            let query = supabase.from('content_reports').select('*').order('created_at', { ascending: false });

            if (filter !== 'all') {
                query = query.eq('status', filter);
            }

            const { data, error } = await query;
            if (error) throw error;

            setReports(data ?? []);
        } catch (error) {
            console.error('Error fetching reports:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (reportId: string, action: 'warning' | 'suspend' | 'ban' | 'delete' | 'dismiss') => {
        if (!confirm(`Are you sure you want to ${action} this content/user?`)) return;

        try {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            const report = reports.find((r) => r.id === reportId);

            const { error: updateError } = await supabase
                .from('content_reports')
                .update({
                    status: action === 'dismiss' ? 'dismissed' : 'resolved',
                    action,
                    reviewed_at: new Date().toISOString(),
                    reviewed_by: user?.id,
                })
                .eq('id', reportId);

            if (updateError) throw updateError;

            if ((action === 'ban' || action === 'suspend') && report) {
                const { error: banError } = await supabase.from('user_bans').insert({
                    user_id: report.reported_user_id,
                    reason: report.description,
                    banned_by: user?.id,
                    expires_at:
                        action === 'suspend' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : null,
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

    if (loading) {
        return <div className="p-8 text-center">Loading reports...</div>;
    }

    return (
        <div className="p-6">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Content Moderation</h2>
                <p className="text-gray-600">Review and manage reported content</p>
            </div>

            <div className="flex gap-2 mb-6">
                <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-2 rounded-md ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                >
                    All ({reports.length})
                </button>
                <button
                    onClick={() => setFilter('pending')}
                    className={`px-4 py-2 rounded-md ${filter === 'pending' ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                >
                    Pending
                </button>
                <button
                    onClick={() => setFilter('reviewed')}
                    className={`px-4 py-2 rounded-md ${filter === 'reviewed' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                >
                    Reviewed
                </button>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reported</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {reports.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                    No reports found
                                </td>
                            </tr>
                        ) : (
                            reports.map((report) => (
                                <tr key={report.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="px-2 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-800">
                                            {report.content_type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div>
                                            <p className="font-medium text-gray-900">{report.reason}</p>
                                            <p className="text-sm text-gray-500 truncate max-w-xs">{report.description}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {new Date(report.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span
                                            className={`px-2 py-1 text-xs font-semibold rounded ${
                                                report.status === 'pending'
                                                    ? 'bg-orange-100 text-orange-800'
                                                    : report.status === 'resolved'
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-gray-100 text-gray-800'
                                            }`}
                                        >
                                            {report.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {report.status === 'pending' && (
                                            <div className="flex gap-2">
                                                <button onClick={() => handleAction(report.id, 'warning')} className="text-yellow-600 hover:text-yellow-900 text-sm">Warn</button>
                                                <button onClick={() => handleAction(report.id, 'suspend')} className="text-orange-600 hover:text-orange-900 text-sm">Suspend</button>
                                                <button onClick={() => handleAction(report.id, 'ban')} className="text-red-600 hover:text-red-900 text-sm">Ban</button>
                                                <button onClick={() => handleAction(report.id, 'dismiss')} className="text-gray-600 hover:text-gray-900 text-sm">Dismiss</button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ModerationQueue;