import React from 'react';
import { AdminLayout } from '../components/AdminLayout';

export default function AnalyticsPage() {
  return (
    <AdminLayout>
      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
        {/* Header */}
        <div style={{ 
          background: 'white', 
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', 
          borderBottom: '1px solid #e5e7eb',
          padding: '1.5rem 2rem'
        }}>
          <div>
            <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#111827', margin: 0 }}>Analytics Dashboard</h1>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: '#6b7280' }}>View insights and performance metrics</p>
          </div>
        </div>

        {/* Main Content */}
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
          {/* Key Metrics */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '1.5rem',
            marginBottom: '2rem'
          }}>
            <div style={{ 
              background: 'white', 
              borderRadius: '0.75rem', 
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', 
              border: '1px solid #e5e7eb',
              padding: '1.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ 
                  width: '3rem', 
                  height: '3rem', 
                  backgroundColor: '#3b82f6', 
                  borderRadius: '0.75rem', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  marginRight: '1rem'
                }}>
                  <svg style={{ width: '1.5rem', height: '1.5rem', color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#6b7280', margin: 0 }}>Total Revenue</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827', margin: 0 }}>$12,345</p>
                </div>
              </div>
            </div>

            <div style={{ 
              background: 'white', 
              borderRadius: '0.75rem', 
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', 
              border: '1px solid #e5e7eb',
              padding: '1.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ 
                  width: '3rem', 
                  height: '3rem', 
                  backgroundColor: '#10b981', 
                  borderRadius: '0.75rem', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  marginRight: '1rem'
                }}>
                  <svg style={{ width: '1.5rem', height: '1.5rem', color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div>
                  <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#6b7280', margin: 0 }}>Growth Rate</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827', margin: 0 }}>+23%</p>
                </div>
              </div>
            </div>

            <div style={{ 
              background: 'white', 
              borderRadius: '0.75rem', 
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', 
              border: '1px solid #e5e7eb',
              padding: '1.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ 
                  width: '3rem', 
                  height: '3rem', 
                  backgroundColor: '#f59e0b', 
                  borderRadius: '0.75rem', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  marginRight: '1rem'
                }}>
                  <svg style={{ width: '1.5rem', height: '1.5rem', color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <div>
                  <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#6b7280', margin: 0 }}>Page Views</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827', margin: 0 }}>45,678</p>
                </div>
              </div>
            </div>

            <div style={{ 
              background: 'white', 
              borderRadius: '0.75rem', 
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', 
              border: '1px solid #e5e7eb',
              padding: '1.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ 
                  width: '3rem', 
                  height: '3rem', 
                  backgroundColor: '#8b5cf6', 
                  borderRadius: '0.75rem', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  marginRight: '1rem'
                }}>
                  <svg style={{ width: '1.5rem', height: '1.5rem', color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <div>
                  <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#6b7280', margin: 0 }}>Engagement</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827', margin: 0 }}>89%</p>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
            gap: '1.5rem',
            marginBottom: '2rem'
          }}>
            {/* Revenue Chart */}
            <div style={{ 
              background: 'white', 
              borderRadius: '0.75rem', 
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', 
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ padding: '1.5rem', borderBottom: '1px solid #e5e7eb' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', margin: 0 }}>Revenue Trend</h3>
              </div>
              <div style={{ padding: '1.5rem', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ 
                  width: '100%', 
                  height: '150px', 
                  backgroundColor: '#f3f4f6', 
                  borderRadius: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#6b7280',
                  fontSize: '0.875rem'
                }}>
                  📊 Chart Placeholder - Revenue over time
                </div>
              </div>
            </div>

            {/* User Growth Chart */}
            <div style={{ 
              background: 'white', 
              borderRadius: '0.75rem', 
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', 
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ padding: '1.5rem', borderBottom: '1px solid #e5e7eb' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', margin: 0 }}>User Growth</h3>
              </div>
              <div style={{ padding: '1.5rem', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ 
                  width: '100%', 
                  height: '150px', 
                  backgroundColor: '#f3f4f6', 
                  borderRadius: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#6b7280',
                  fontSize: '0.875rem'
                }}>
                  📈 Chart Placeholder - User growth over time
                </div>
              </div>
            </div>
          </div>

          {/* Top Events */}
          <div style={{ 
            background: 'white', 
            borderRadius: '0.75rem', 
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', 
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid #e5e7eb' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', margin: 0 }}>Top Performing Events</h3>
            </div>
            <div style={{ padding: '1.5rem' }}>
              {[
                { name: 'Tech Conference 2024', revenue: '$5,234', attendees: '234', growth: '+15%' },
                { name: 'Music Festival Summer', revenue: '$4,567', attendees: '567', growth: '+12%' },
                { name: 'Startup Pitch Night', revenue: '$1,890', attendees: '89', growth: '+8%' },
                { name: 'Art Exhibition Opening', revenue: '$1,125', attendees: '45', growth: '+5%' },
                { name: 'Fitness Bootcamp', revenue: '$575', attendees: '23', growth: '+3%' }
              ].map((event, index) => (
                <div key={index} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  padding: '1rem',
                  borderBottom: index < 4 ? '1px solid #e5e7eb' : 'none'
                }}>
                  <div style={{ 
                    width: '2rem', 
                    height: '2rem', 
                    backgroundColor: '#6366f1', 
                    borderRadius: '0.5rem', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    marginRight: '1rem',
                    color: 'white',
                    fontWeight: '600',
                    fontSize: '0.875rem'
                  }}>
                    {index + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#111827', margin: 0 }}>{event.name}</h4>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0.25rem 0 0 0' }}>{event.attendees} attendees</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '1rem', fontWeight: '600', color: '#111827', margin: 0 }}>{event.revenue}</p>
                    <p style={{ fontSize: '0.875rem', color: '#059669', margin: '0.25rem 0 0 0' }}>{event.growth}</p>
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
