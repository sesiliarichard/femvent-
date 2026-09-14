/**
 * BACKUP & EXPORT - Data Export and Backup Management
 * Export collections to CSV/JSON, manage backups
 */

import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { AdminLayout } from '../components/AdminLayout';
import Papa from 'papaparse';

export default function BackupExportPage() {
    const [exporting, setExporting] = useState(false);
    const [exportProgress, setExportProgress] = useState('');

    const collections = [
        { name: 'events', label: 'Events', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2" strokeWidth={2} /><path strokeWidth={2} d="M3 10h18M8 3v4M16 3v4" /></svg> },
        { name: 'users', label: 'Users', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="9" cy="8" r="3" strokeWidth={2} /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2 20c0-3.3 3.1-6 7-6s7 2.7 7 6M17 8a3 3 0 010 6" /></svg> },
        { name: 'tickets', label: 'Tickets', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="4" y="7" width="16" height="12" rx="2" strokeWidth={2} /><path strokeWidth={2} d="M4 11h16" /></svg> },
        { name: 'payments', label: 'Payments', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m-3-2.8l.9.7c1.2.9 3 .9 4.2 0" /><circle cx="12" cy="12" r="9" strokeWidth={2} /></svg> },
        { name: 'content_reports', label: 'Content Reports', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" /></svg> },
        { name: 'event_templates', label: 'Event Templates', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
        { name: 'platform_settings', label: 'Platform Settings', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
    ];

    const exportCollection = async (collectionName: string, format: 'csv' | 'json') => {
        setExporting(true);
        setExportProgress(`Exporting ${collectionName}...`);

        try {
            const { data, error } = await supabase.from(collectionName).select('*');
            if (error) throw error;

            if (!data || data.length === 0) {
                alert(`No data found in ${collectionName}`);
                return;
            }

            // Postgres already returns plain dates/JSON — just flatten nested objects for CSV-friendliness
            const cleanData = data.map((item: any) => {
                const cleaned: any = {};
                Object.entries(item).forEach(([key, value]: [string, any]) => {
                    if (typeof value === 'object' && value !== null) {
                        cleaned[key] = JSON.stringify(value);
                    } else {
                        cleaned[key] = value;
                    }
                });
                return cleaned;
            });

            let fileContent: string;
            let mimeType: string;
            let extension: string;

            if (format === 'csv') {
                fileContent = Papa.unparse(cleanData);
                mimeType = 'text/csv';
                extension = 'csv';
            } else {
                fileContent = JSON.stringify(cleanData, null, 2);
                mimeType = 'application/json';
                extension = 'json';
            }

            // Create and download file
            const blob = new Blob([fileContent], { type: mimeType });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${collectionName}_${new Date().toISOString().split('T')[0]}.${extension}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            setExportProgress(`Exported ${data.length} records from ${collectionName}`);
            setTimeout(() => setExportProgress(''), 3000);
        } catch (error) {
            console.error('Export error:', error);
            alert(`Failed to export ${collectionName}`);
        } finally {
            setExporting(false);
        }
    };

    const exportAll = async () => {
        if (!confirm('Export all collections? This may take a few minutes.')) return;

        setExporting(true);
        for (const coll of collections) {
            await exportCollection(coll.name, 'json');
        }
        alert('All collections exported!');
        setExporting(false);
    };

    const exportGDPR = async () => {
        const userId = prompt('Enter user ID for GDPR export:');
        if (!userId) return;

        setExporting(true);
        setExportProgress('Gathering user data...');

        try {
            const userData: any = {};

            // Collect data from all tables
            for (const coll of collections) {
                const { data, error } = await supabase.from(coll.name).select('*');
                if (error) throw error;

                userData[coll.name] = (data || []).filter((item: any) =>
                    item.user_id === userId ||
                    item.host_id === userId ||
                    item.id === userId
                );
            }

            const fileContent = JSON.stringify(userData, null, 2);
            const blob = new Blob([fileContent], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `gdpr_export_${userId}_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            alert('GDPR export complete!');
        } catch (error) {
            console.error('GDPR export error:', error);
            alert('Failed to export user data');
        } finally {
            setExporting(false);
            setExportProgress('');
        }
    };

    return (
        <AdminLayout>
            <div className="p-6">
                <div className="mb-6">
                    <h1 className="text-2xl font-extrabold text-gray-900">Backup & Export</h1>
                    <p className="text-sm text-gray-500 mt-1">Export data collections and manage backups</p>
                </div>

                {/* Export Progress */}
                {exportProgress && (
                    <div className="mb-6 p-4 bg-primary-50 border border-primary-100 rounded-xl">
                        <p className="text-primary-800 text-sm font-semibold">{exportProgress}</p>
                    </div>
                )}

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <button
                        onClick={exportAll}
                        disabled={exporting}
                        className="p-6 bg-secondary-500 hover:bg-secondary-600 text-white rounded-2xl disabled:opacity-50 transition-colors text-left"
                    >
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-4">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12v7a1 1 0 01-1 1H5a1 1 0 01-1-1v-7M16 6l-4-4-4 4M12 2v14" /></svg>
                        </div>
                        <h3 className="text-base font-extrabold mb-1">Export All</h3>
                        <p className="text-xs text-white/85">Download complete database backup</p>
                    </button>

                    <button
                        onClick={exportGDPR}
                        disabled={exporting}
                        className="p-6 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl disabled:opacity-50 transition-colors text-left"
                    >
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-4">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="4" y="11" width="16" height="10" rx="2" strokeWidth={2} /><path strokeWidth={2} d="M8 11V7a4 4 0 018 0v4" /></svg>
                        </div>
                        <h3 className="text-base font-extrabold mb-1">GDPR Export</h3>
                        <p className="text-xs text-white/85">Export specific user data</p>
                    </button>

                    <div className="p-6 bg-white border border-gray-200 rounded-2xl">
                        <div className="w-10 h-10 bg-primary-50 text-primary-600 rounded-xl flex items-center justify-center mb-4">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8" /></svg>
                        </div>
                        <h3 className="text-base font-extrabold mb-1 text-gray-900">Auto Backup</h3>
                        <p className="text-xs text-gray-500">Coming soon — scheduled backups</p>
                    </div>
                </div>

                {/* Individual Collections */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                    <h2 className="text-lg font-extrabold text-gray-900 mb-4">Export Collections</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {collections.map(coll => (
                            <div key={coll.name} className="border border-gray-200 rounded-xl p-4">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-8 h-8 bg-primary-50 text-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                        {coll.icon}
                                    </div>
                                    <span className="font-bold text-gray-900 text-sm">{coll.label}</span>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => exportCollection(coll.name, 'csv')}
                                        disabled={exporting}
                                        className="flex-1 px-3 py-2 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 disabled:opacity-50 text-sm font-bold transition-colors"
                                    >
                                        CSV
                                    </button>
                                    <button
                                        onClick={() => exportCollection(coll.name, 'json')}
                                        disabled={exporting}
                                        className="flex-1 px-3 py-2 bg-secondary-50 text-secondary-700 rounded-lg hover:bg-secondary-100 disabled:opacity-50 text-sm font-bold transition-colors"
                                    >
                                        JSON
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Info Box */}
                <div className="mt-6 bg-primary-50 border border-primary-100 rounded-2xl p-5">
                    <h3 className="font-extrabold text-primary-700 text-sm mb-2">Export Information</h3>
                    <ul className="text-sm text-gray-600 space-y-1 list-disc pl-5">
                        <li>CSV format: Best for spreadsheets and data analysis</li>
                        <li>JSON format: Preserves data structure, best for backups</li>
                        <li>GDPR exports include all data related to a specific user</li>
                        <li>Timestamps are converted to ISO date format</li>
                    </ul>
                </div>
            </div>
        </AdminLayout>
    );
}