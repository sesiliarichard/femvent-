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
    return <div>Loading...</div>;
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  // Temporarily allow all authenticated users (remove role check for now)
  // if (user.role !== 'admin') {
  //   return <div>Access denied. Admin privileges required.</div>;
  // }

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-rose-50 relative overflow-hidden">
        {/* Animated Background Blobs */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary-400/10 rounded-full blur-3xl animate-blob"></div>
          <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-secondary-400/10 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-accent-400/10 rounded-full blur-3xl animate-blob animation-delay-4000"></div>
        </div>

        {/* Header */}
        <div style={{
          background: 'white',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          borderBottom: '1px solid #e5e7eb',
          padding: '1.5rem 2rem',
          position: 'relative',
          zIndex: 10
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', background: 'linear-gradient(to right, #6B5B9A, #C9507B, #F08070)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>FemVents Dashboard</h1>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: '#6b7280' }}>Empowering Women Through Events</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                Welcome back, {user.name}
              </div>
              <div style={{
                width: '2rem',
                height: '2rem',
                background: 'linear-gradient(135deg, #f3e8ff 0%, #fce7f3 100%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid #C9507B'
              }}>
                <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#C9507B' }}>
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 10 }}>
          <DashboardStats />

          <div style={{
            marginTop: '2rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
            gap: '2rem'
          }}>
            <RecentActivity />

            {/* Quick Actions */}
            <div style={{
              background: 'white',
              borderRadius: '0.75rem',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ padding: '1.5rem', borderBottom: '1px solid #e5e7eb' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', margin: 0 }}>Quick Actions</h3>
              </div>
              <div style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <a
                    href="/payments"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '1rem',
                      background: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)',
                      borderRadius: '0.5rem',
                      textDecoration: 'none',
                      transition: 'all 0.2s',
                      border: '1px solid #fbcfe8'
                    }}
                  >
                    <div style={{
                      width: '2.5rem',
                      height: '2.5rem',
                      background: 'linear-gradient(135deg, #C9507B 0%, #B4406C 100%)',
                      borderRadius: '0.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: '1rem',
                      flexShrink: 0
                    }}>
                      <svg style={{ width: '1.25rem', height: '1.25rem', color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div>
                      <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#111827', margin: 0 }}>Payment Management</p>
                      <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>Track and manage manual payments</p>
                    </div>
                  </a>

                  <a
                    href="/events"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '1rem',
                      background: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)',
                      borderRadius: '0.5rem',
                      textDecoration: 'none',
                      transition: 'all 0.2s',
                      border: '1px solid #e9d5ff'
                    }}
                  >
                    <div style={{
                      width: '2.5rem',
                      height: '2.5rem',
                      background: 'linear-gradient(135deg, #6B5B9A 0%, #5B4B8A 100%)',
                      borderRadius: '0.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: '1rem',
                      flexShrink: 0
                    }}>
                      <svg style={{ width: '1.25rem', height: '1.25rem', color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#111827', margin: 0 }}>Event Management</p>
                      <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>Create and manage events</p>
                    </div>
                  </a>

                  <a
                    href="/users"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '1rem',
                      background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
                      borderRadius: '0.5rem',
                      textDecoration: 'none',
                      transition: 'all 0.2s',
                      border: '1px solid #fed7aa'
                    }}
                  >
                    <div style={{
                      width: '2.5rem',
                      height: '2.5rem',
                      background: 'linear-gradient(135deg, #F08070 0%, #E87461 100%)',
                      borderRadius: '0.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: '1rem',
                      flexShrink: 0
                    }}>
                      <svg style={{ width: '1.25rem', height: '1.25rem', color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                    </div>
                    <div>
                      <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#111827', margin: 0 }}>User Management</p>
                      <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>Manage users and permissions</p>
                    </div>
                  </a>
                </div>
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
