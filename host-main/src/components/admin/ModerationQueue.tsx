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

const FILTERS = [
    { id: 'all', label: 'All', icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 10h18" /></svg>
    )},
    { id: 'pending', label: 'Pending', icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></svg>
    )},
    { id: 'reviewed', label: 'Reviewed', icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M20 6L9 17l-5-5" /></svg>
    )},
] as const;

const contentTypeIcon = (type: ContentReport['content_type']) => {
    switch (type) {
        case 'event':
            return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>;
        case 'comment':
            return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" /></svg>;
        default:
            return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /></svg>;
    }
};

const statusPill = (status: ContentReport['status']) => {
    switch (status) {
        case 'pending':
            return { label: 'pending', style: 'background:#fdf2f8;color:#A82C60;border:1px solid #f6d9e4;' };
        case 'resolved':
            return { label: 'resolved', style: 'background:#f4f1f9;color:#5A4485;border:1px solid #E9E3EF;' };
        case 'dismissed':
            return { label: 'dismissed', style: 'background:#f9fafb;color:#6b7280;border:1px solid #E9E3EF;' };
        default:
            return { label: status, style: 'background:#f9fafb;color:#6b7280;border:1px solid #E9E3EF;' };
    }
};

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

            alert(`Action "${action}" completed successfully.`);
            fetchReports();
        } catch (error) {
            console.error('Error taking action:', error);
            alert('Failed to complete action');
        }
    };

    if (loading) {
        return (
            <div style={{ background: '#EDE7ED', borderRadius: 20, padding: '28px 16px' }}>
                <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center', padding: '60px 0', color: '#6b7280', fontSize: 13 }}>
                    Loading reports...
                </div>
            </div>
        );
    }

    return (
        <div style={{ background: '#EDE7ED', borderRadius: 20, padding: '28px 16px' }}>
            <div style={{ maxWidth: 800, margin: '0 auto', background: '#F7F5FA', borderRadius: 20, padding: 32 }}>

                <div style={{ marginBottom: 20 }}>
                    <p style={{ fontSize: 24, fontWeight: 800, color: '#171717', margin: '0 0 4px' }}>Content Moderation</p>
                    <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>Review and manage reported content</p>
                </div>

                <div style={{ display: 'flex', gap: 6, background: '#fff', border: '1px solid #E9E3EF', borderRadius: 14, padding: 6, marginBottom: 18 }}>
                    {FILTERS.map((f) => (
                        <button
                            key={f.id}
                            onClick={() => setFilter(f.id)}
                            style={{
                                flex: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 7,
                                padding: '11px 18px',
                                borderRadius: 10,
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: 12.5,
                                fontWeight: 700,
                                background: filter === f.id ? '#5A4485' : 'transparent',
                                color: filter === f.id ? '#fff' : '#6b7280',
                            }}
                        >
                            {f.icon}
                            {f.label}{f.id === 'all' ? ` (${reports.length})` : ''}
                        </button>
                    ))}
                </div>

                <div style={{ background: '#fff', border: '1px solid #E9E3EF', borderRadius: 16, padding: 26 }}>
                    {reports.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af', fontSize: 13 }}>
                            No reports found
                        </div>
                    ) : (
                        reports.map((report, i) => {
                            const pill = statusPill(report.status);
                            return (
                                <div key={report.id} style={{ marginBottom: i === reports.length - 1 ? 0 : 10 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px', border: '1px solid #E9E3EF', borderRadius: 12 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <div style={{ width: 38, height: 38, borderRadius: 10, background: '#f4f1f9', color: '#5A4485', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                {contentTypeIcon(report.content_type)}
                                            </div>
                                            <div>
                                                <div style={{ fontSize: 13.5, fontWeight: 700, color: '#171717' }}>{report.reason}</div>
                                                <div style={{ fontSize: 11.5, color: '#6b7280', marginTop: 2 }}>
                                                    {report.description} · {new Date(report.created_at).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </div>
                                        <span style={{ padding: '5px 12px', borderRadius: 999, fontSize: 11, fontWeight: 700, flexShrink: 0, ...cssToObj(pill.style) }}>
                                            {pill.label}
                                        </span>
                                    </div>

                                    {report.status === 'pending' && (
                                        <div style={{ display: 'flex', gap: 8, margin: '10px 0 0', paddingLeft: 2 }}>
                                            {(['warning', 'suspend', 'ban', 'dismiss'] as const).map((action) => (
                                                <button
                                                    key={action}
                                                    onClick={() => handleAction(report.id, action)}
                                                    style={{ padding: '7px 14px', borderRadius: 8, background: '#fff', border: '1px solid #E9E3EF', color: '#6b7280', fontSize: 11.5, fontWeight: 700, cursor: 'pointer' }}
                                                >
                                                    {action === 'warning' ? 'Warn' : action.charAt(0).toUpperCase() + action.slice(1)}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

function cssToObj(css: string): React.CSSProperties {
    const obj: Record<string, string> = {};
    css.split(';').filter(Boolean).forEach((rule) => {
        const [prop, val] = rule.split(':');
        const camel = prop.trim().replace(/-([a-z])/g, (_, c) => c.toUpperCase());
        obj[camel] = val.trim();
    });
    return obj as React.CSSProperties;
}

export default ModerationQueue;