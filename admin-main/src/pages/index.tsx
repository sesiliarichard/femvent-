import React, { useEffect } from 'react';
import { GetServerSideProps } from 'next';
import { useAuth } from '../hooks/useAuth';
import { AdminLayout } from '../components/AdminLayout';
import { DashboardStats } from '../components/DashboardStats';
import { RecentActivity } from '../components/RecentActivity';
import { useRouter } from 'next/router';

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="inline-block w-9 h-9 border-4 border-gray-200 border-t-primary-600 rounded-full animate-spin" />
          <p className="mt-4 text-sm text-gray-500 font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-100 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900">FemVents Dashboard</h1>
              <p className="text-sm text-gray-500 mt-1">Empowering Women Through Events</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-500">Welcome back, {user.name}</div>
              <div className="w-9 h-9 bg-primary-50 border-2 border-secondary-500 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-secondary-600">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-8 max-w-6xl mx-auto">
          <DashboardStats />

          <div className="mt-8 grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))' }}>
            <RecentActivity />

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-base font-extrabold text-gray-900">Quick Actions</h3>
              </div>
              <div className="p-6 space-y-3">
                <a
                  href="/payments"
                  className="flex items-center p-4 rounded-xl border border-gray-100 hover:border-secondary-200 transition-colors"
                >
                  <div className="w-10 h-10 bg-secondary-500 rounded-lg flex items-center justify-center flex-shrink-0 mr-4">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">Payment Management</p>
                    <p className="text-xs text-gray-500 mt-0.5">Track and manage manual payments</p>
                  </div>
                </a>

                <a
                  href="/events"
                  className="flex items-center p-4 rounded-xl border border-gray-100 hover:border-primary-200 transition-colors"
                >
                  <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0 mr-4">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">Event Management</p>
                    <p className="text-xs text-gray-500 mt-0.5">Create and manage events</p>
                  </div>
                </a>

                <a
                  href="/users"
                  className="flex items-center p-4 rounded-xl border border-gray-100 hover:border-accent-200 transition-colors"
                >
                  <div className="w-10 h-10 bg-accent-500 rounded-lg flex items-center justify-center flex-shrink-0 mr-4">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">User Management</p>
                    <p className="text-xs text-gray-500 mt-0.5">Manage users and permissions</p>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  // Add server-side authentication check here
  return {
    props: {},
  };
};