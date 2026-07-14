import React, { useState, useEffect } from 'react';
import { getRecentActivity } from '../services/firestore';

export const RecentActivity: React.FC = () => {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const data = await getRecentActivity();
        setActivities(data);
      } catch (error) {
        console.error('Error fetching activities:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, []);

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_registration':
        return (
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        );
      case 'event_created':
        return (
          <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        );
      case 'payment_recorded':
        return (
          <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
        );
      case 'host_approved':
        return (
          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div style={{ 
        background: 'white', 
        borderRadius: '0.75rem', 
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', 
        border: '1px solid #e5e7eb' 
      }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid #e5e7eb' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', margin: 0 }}>Recent Activity</h3>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0.25rem 0 0 0' }}>Latest system activities and updates</p>
        </div>
        <div style={{ padding: '1.5rem', textAlign: 'center', color: '#6b7280' }}>
          Loading activities...
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      background: 'white', 
      borderRadius: '0.75rem', 
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', 
      border: '1px solid #e5e7eb' 
    }}>
      <div style={{ padding: '1.5rem', borderBottom: '1px solid #e5e7eb' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', margin: 0 }}>Recent Activity</h3>
        <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0.25rem 0 0 0' }}>Latest system activities and updates</p>
      </div>
      <div style={{ padding: '1.5rem' }}>
        {activities.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#6b7280', padding: '2rem' }}>
            No recent activity
          </div>
        ) : (
          <div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {activities.map((activity, activityIdx) => (
                <li key={activity.id}>
                  <div style={{ position: 'relative', paddingBottom: '2rem' }}>
                    {activityIdx !== activities.length - 1 && (
                      <span
                        style={{
                          position: 'absolute',
                          top: '1rem',
                          left: '0.75rem',
                          height: 'calc(100% - 1rem)',
                          width: '2px',
                          backgroundColor: '#e5e7eb'
                        }}
                      />
                    )}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                      <div style={{ flexShrink: 0 }}>
                        {getActivityIcon(activity.type)}
                      </div>
                      <div style={{ flex: 1, paddingTop: '0.375rem' }}>
                        <p style={{ fontSize: '0.875rem', color: '#111827', margin: 0 }}>
                          <span style={{ fontWeight: '600', color: '#111827' }}>{activity.user}</span>{' '}
                          {activity.description}
                        </p>
                        <div style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: '#6b7280' }}>
                          {formatTimestamp(activity.timestamp)}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div style={{ marginTop: '1.5rem' }}>
          <a 
            href="/activity" 
            style={{ 
              fontSize: '0.875rem', 
              fontWeight: '500', 
              color: '#6366f1', 
              textDecoration: 'none' 
            }}
          >
            View all activity →
          </a>
        </div>
      </div>
    </div>
  );
};
