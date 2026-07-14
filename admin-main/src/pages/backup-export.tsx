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
        { name: 'events', label: 'Events', icon: '📅' },
        { name: 'users', label: 'Users', icon: '👥' },
        { name: 'tickets', label: 'Tickets', icon: '🎫' },
        { name: 'payments', label: 'Payments', icon: '💰' },
        { name: 'content_reports', label: 'Content Reports', icon: '🚩' },
        { name: 'event_templates', label: 'Event Templates', icon: '📋' },
        { name: 'platform_settings', label: 'Platform Settings', icon: '⚙️' },
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

            setExportProgress(`✅ Exported ${data.length} records from ${collectionName}`);
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
        alert('✅ All collections exported!');
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

            alert('✅ GDPR export complete!');
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
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Backup & Export</h1>
                    <p className="text-gray-600">Export data collections and manage backups</p>
                </div>

                {/* Export Progress */}
                {exportProgress && (
                    <div className="mb-6 p-4 bg-pink-50 border border-pink-200 rounded-lg">
                        <p className="text-secondary-900">{exportProgress}</p>
                    </div>
                )}

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <button
                        onClick={exportAll}
                        disabled={exporting}
                        className="p-6 bg-gradient-to-br from-secondary-500 to-accent-500 text-white rounded-lg hover:from-secondary-600 hover:to-accent-600 disabled:opacity-50 transition-all"
                    >
                        <div className="text-4xl mb-2">📦</div>
                        <h3 className="text-lg font-semibold mb-1">Export All</h3>
                        <p className="text-sm text-blue-100">Download complete database backup</p>
                    </button>

                    <button
                        onClick={exportGDPR}
                        disabled={exporting}
                        className="p-6 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 disabled:opacity-50 transition-all"
                    >
                        <div className="text-4xl mb-2">🔒</div>
                        <h3 className="text-lg font-semibold mb-1">GDPR Export</h3>
                        <p className="text-sm text-purple-100">Export specific user data</p>
                    </button>

                    <div className="p-6 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg">
                        <div className="text-4xl mb-2">☁️</div>
                        <h3 className="text-lg font-semibold mb-1">Auto Backup</h3>
                        <p className="text-sm text-green-100">Coming soon - scheduled backups</p>
                    </div>
                </div>

                {/* Individual Collections */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Export Collections</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {collections.map(coll => (
                            <div key={coll.name} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">{coll.icon}</span>
                                        <span className="font-medium text-gray-900">{coll.label}</span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => exportCollection(coll.name, 'csv')}
                                        disabled={exporting}
                                        className="flex-1 px-3 py-2 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 disabled:opacity-50 text-sm font-medium"
                                    >
                                        CSV
                                    </button>
                                    <button
                                        onClick={() => exportCollection(coll.name, 'json')}
                                        disabled={exporting}
                                        className="flex-1 px-3 py-2 bg-purple-50 text-purple-700 rounded-md hover:bg-purple-100 disabled:opacity-50 text-sm font-medium"
                                    >
                                        JSON
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Info Box */}
                <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">ℹ️ Export Information</h3>
                    <ul className="text-sm text-gray-600 space-y-1">
                        <li>• CSV format: Best for spreadsheets and data analysis</li>
                        <li>• JSON format: Preserves data structure, best for backups</li>
                        <li>• GDPR exports include all data related to a specific user</li>
                        <li>• Timestamps are converted to ISO date format</li>
                    </ul>
                </div>
            </div>
        </AdminLayout>
    );
}
