import React from 'react';
import { AdminLayout } from '../components/AdminLayout';

export default function AnalyticsPage() {
  const topEvents = [
    { name: 'Tech Conference 2026', revenue: '$5,234', attendees: '234', growth: '+15%' },
    { name: 'Music Festival Summer', revenue: '$4,567', attendees: '567', growth: '+12%' },
    { name: 'Startup Pitch Night', revenue: '$1,890', attendees: '89', growth: '+8%' },
    { name: 'Art Exhibition Opening', revenue: '$1,125', attendees: '45', growth: '+5%' },
    { name: 'Fitness Bootcamp', revenue: '$575', attendees: '23', growth: '+3%' }
  ];

  const metrics = [
    {
      label: 'Total Revenue',
      value: '$12,345',
      iconBg: 'bg-primary-50',
      iconColor: 'text-primary-600',
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
    },
    {
      label: 'Growth Rate',
      value: '+23%',
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>,
    },
    {
      label: 'Page Views',
      value: '45,678',
      iconBg: 'bg-secondary-50',
      iconColor: 'text-secondary-600',
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>,
    },
    {
      label: 'Engagement',
      value: '89%',
      iconBg: 'bg-accent-50',
      iconColor: 'text-accent-600',
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>,
    },
  ];

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-100 px-8 py-6">
          <h1 className="text-2xl font-extrabold text-gray-900">Analytics Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">View insights and performance metrics</p>
        </div>

        {/* Main Content */}
        <div className="p-8 max-w-6xl mx-auto">
          {/* Key Metrics */}
          <div className="grid gap-4 mb-8" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            {metrics.map((m) => (
              <div key={m.label} className="bg-white rounded-2xl border border-gray-100 p-6">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 ${m.iconBg} ${m.iconColor} rounded-xl flex items-center justify-center flex-shrink-0`}>
                    {m.icon}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-500">{m.label}</p>
                    <p className="text-xl font-extrabold text-gray-900">{m.value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Charts Section */}
          <div className="grid gap-6 mb-8" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))' }}>
            {/* Revenue Chart */}
            <div className="bg-white rounded-2xl border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-base font-extrabold text-gray-900">Revenue Trend</h3>
              </div>
              <div className="p-6">
                <div className="h-36 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 text-sm font-semibold">
                  Chart — Revenue over time
                </div>
              </div>
            </div>

            {/* User Growth Chart */}
            <div className="bg-white rounded-2xl border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-base font-extrabold text-gray-900">User Growth</h3>
              </div>
              <div className="p-6">
                <div className="h-36 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 text-sm font-semibold">
                  Chart — User growth over time
                </div>
              </div>
            </div>
          </div>

          {/* Top Events */}
          <div className="bg-white rounded-2xl border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-base font-extrabold text-gray-900">Top Performing Events</h3>
            </div>
            <div className="p-6">
              {topEvents.map((event, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-4 py-4 ${index < topEvents.length - 1 ? 'border-b border-gray-100' : ''}`}
                >
                  <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-gray-900">{event.name}</h4>
                    <p className="text-xs text-gray-500 mt-0.5">{event.attendees} attendees</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">{event.revenue}</p>
                    <p className="text-xs text-emerald-600 font-semibold mt-0.5">{event.growth}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}