/**
 * BACKUP & EXPORT MANAGEMENT PAGE
 * Manual and automated backup/export functionality
 */
'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function BackupManagementPage() {
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState('');

  const collections = [
    { id: 'events', name: 'Events', icon: '📅' },
    { id: 'users', name: 'Users', icon: '👥' },
    { id: 'tickets', name: 'Tickets', icon: '🎫' },
    { id: 'payments', name: 'Payments', icon: '💳' },
    { id: 'event_templates', name: 'Event Templates', icon: '📝' },
    { id: 'waitlist', name: 'Waitlist', icon: '⏰' },
  ];

  const exportCollection = async (collectionId: string) => {
    setExporting(true);
    setExportProgress(`Exporting ${collectionId}...`);

    try {
      const { data, error } = await supabase.from(collectionId).select('*');
      if (error) throw error;

      // Convert to JSON
      const jsonData = JSON.stringify(data || [], null, 2);
      
      // Create download
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${collectionId}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportProgress(`✅ Exported ${data.length} ${collectionId} records`);
      setTimeout(() => setExportProgress(''), 3000);
    } catch (error: any) {
      console.error('Export error:', error);
      setExportProgress(`❌ Error: ${error.message}`);
    } finally {
      setExporting(false);
    }
  };

  const exportAllData = async () => {
    setExporting(true);
    setExportProgress('Creating full backup...');

    try {
      const backup: any = {};

      for (const col of collections) {
        setExportProgress(`Exporting ${col.name}...`);
        const { data, error } = await supabase.from(col.id).select('*');
        if (error) throw error;
        backup[col.id] = data || [];
      }

      // Create backup file
      const jsonData = JSON.stringify(backup, null, 2);
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `full_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportProgress('✅ Full backup completed!');
      setTimeout(() => setExportProgress(''), 3000);
    } catch (error: any) {
      console.error('Backup error:', error);
      setExportProgress(`❌ Error: ${error.message}`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <ProtectedRoute requireAdmin>
      <DashboardLayout currentPage="admin">
        <div className="container mx-auto p-6 max-w-6xl">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Backup & Export</h1>
            <p className="text-gray-600 mt-1">Export and backup your platform data</p>
          </div>

          {/* Full Backup Card */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-lg p-6 mb-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">📦 Full Platform Backup</h2>
                <p className="text-gray-700 mb-4">
                  Download a complete backup of all collections including events, users, tickets, and payments.
                </p>
                <button
                  onClick={exportAllData}
                  disabled={exporting}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold"
                >
                  {exporting ? 'Creating Backup...' : 'Create Full Backup'}
                </button>
              </div>
              <div className="text-6xl">💾</div>
            </div>
          </div>

          {/* Export Progress */}
          {exportProgress && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-blue-900 font-medium">{exportProgress}</p>
            </div>
          )}

          {/* Export by Collection */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Export by Collection</h2>
            <p className="text-gray-600 mb-6">Export individual collections as JSON files</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {collections.map(col => (
                <button
                  key={col.id}
                  onClick={() => exportCollection(col.id)}
                  disabled={exporting}
                  className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all disabled:opacity-50 text-left"
                >
                  <div className="text-3xl mb-2">{col.icon}</div>
                  <h3 className="font-semibold text-gray-900">{col.name}</h3>
                  <p className="text-sm text-gray-600">Export {col.id} data</p>
                </button>
              ))}
            </div>
          </div>

          {/* Info */}
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">Backup Recommendations:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Create full backups before major platform updates</li>
                  <li>Store backups in a secure location separate from the platform</li>
                  <li>Test restore procedures periodically</li>
                  <li>Consider automating weekly backups for production</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
