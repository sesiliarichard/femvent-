import React from 'react';
import { GetServerSideProps } from 'next';
import { useAuth } from '../hooks/useAuth';
import { AdminLayout } from '../components/AdminLayout';
import { DashboardStats } from '../components/DashboardStats';
import { RecentActivity } from '../components/RecentActivity';

export default function AdminDashboard() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user || user.role !== 'admin') {
    return <div>Access denied. Admin privileges required.</div>;
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>
        
        <DashboardStats />
        
        <div className="mt-8">
          <RecentActivity />
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
