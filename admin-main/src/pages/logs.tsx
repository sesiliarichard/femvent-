/**
 * LOG VIEWER PAGE (/logs)
 * Admin dashboard to view application logs from all apps
 */

import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../components/AdminLayout';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../services/supabase';

interface LogEntry {
  id: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  context?: string;
  operation?: string;
  userId?: string;
  userEmail?: string;
  userRole?: string;
  app: string;
  platform: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export default function LogsPage() {
  const { user, loading: authLoading } = useAuth();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    app: 'all',
    level: 'all',
    context: 'all',
    search: '',
  });
  const [pageSize] = useState(100);

  useEffect(() => {
    if (user && user.role === 'admin') {
      loadLogs();
    }
  }, [user, filters]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      let q = supabase
        .from('application_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(pageSize);

      // Apply filters
      if (filters.app !== 'all') {
        q = q.eq('app', filters.app);
      }
      if (filters.level !== 'all') {
        q = q.eq('level', filters.level);
      }
      if (filters.context !== 'all') {
        q = q.eq('context', filters.context);
      }

      const { data, error } = await q;
      if (error) throw error;

      const logsData: LogEntry[] = (data || []).map((row: any) => ({
        id: row.id,
        level: row.level,
        message: row.message,
        context: row.context,
        operation: row.operation,
        userId: row.user_id,
        userEmail: row.user_email,
        userRole: row.user_role,
        app: row.app,
        platform: row.platform,
        timestamp: row.created_at,
        metadata: row.metadata,
      }));

      // Apply search filter
      let filteredLogs = logsData;
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredLogs = logsData.filter(
          (log) =>
            log.message.toLowerCase().includes(searchLower) ||
            log.userEmail?.toLowerCase().includes(searchLower) ||
            log.context?.toLowerCase().includes(searchLower)
        );
      }

      setLogs(filteredLogs);
    } catch (error) {
      console.error('Error loading logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'warn':
        return 'bg-yellow-100 text-yellow-800';
      case 'info':
        return 'bg-blue-100 text-blue-800';
      case 'debug':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getAppColor = (app: string) => {
    switch (app) {
      case 'hostdweb':
        return 'bg-purple-100 text-purple-800';
      case 'admin':
        return 'bg-indigo-100 text-indigo-800';
      case 'events-app':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (authLoading || loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600">Loading logs...</div>
        </div>
      </AdminLayout>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600">Only administrators can view logs.</p>
        </div>
      </AdminLayout>
    );
  }

  const uniqueApps = Array.from(new Set(logs.map((log) => log.app)));
  const uniqueContexts = Array.from(new Set(logs.map((log) => log.context).filter(Boolean)));

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Application Logs</h1>
          <p className="text-gray-600">View logs from all applications (hostdweb, admin, events-app)</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">App</label>
              <select
                value={filters.app}
                onChange={(e) => setFilters({ ...filters, app: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Apps</option>
                {uniqueApps.map((app) => (
                  <option key={app} value={app}>
                    {app}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
              <select
                value={filters.level}
                onChange={(e) => setFilters({ ...filters, level: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Levels</option>
                <option value="error">Error</option>
                <option value="warn">Warning</option>
                <option value="info">Info</option>
                <option value="debug">Debug</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Context</label>
              <select
                value={filters.context}
                onChange={(e) => setFilters({ ...filters, context: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Contexts</option>
                {uniqueContexts.map((context) => (
                  <option key={context} value={context}>
                    {context}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="Search logs..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Level
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    App
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Context
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Message
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                      No logs found
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${getLevelColor(
                            log.level
                          )}`}
                        >
                          {log.level}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${getAppColor(
                            log.app
                          )}`}
                        >
                          {log.app}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.context || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-md truncate">
                        {log.message}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.userEmail || log.userId || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-600">
          Showing {logs.length} log entries (last {pageSize} entries)
        </div>
      </div>
    </AdminLayout>
  );
}

