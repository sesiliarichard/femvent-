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
          <div className="w-8 h-8 bg-emerald-50 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        );
      case 'event_created':
        return (
          <div className="w-8 h-8 bg-primary-50 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        );
      case 'payment_recorded':
        return (
          <div className="w-8 h-8 bg-accent-50 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
        );
      case 'host_approved':
        return (
          <div className="w-8 h-8 bg-secondary-50 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-base font-extrabold text-gray-900">Recent Activity</h3>
          <p className="text-sm text-gray-500 mt-1">Latest system activities and updates</p>
        </div>
        <div className="p-6 text-center text-gray-500 text-sm">Loading activities...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100">
      <div className="p-6 border-b border-gray-100">
        <h3 className="text-base font-extrabold text-gray-900">Recent Activity</h3>
        <p className="text-sm text-gray-500 mt-1">Latest system activities and updates</p>
      </div>
      <div className="p-6">
        {activities.length === 0 ? (
          <div className="text-center text-gray-500 text-sm py-8">No recent activity</div>
        ) : (
          <ul className="list-none p-0 m-0">
            {activities.map((activity, activityIdx) => (
              <li key={activity.id}>
                <div className="relative pb-8">
                  {activityIdx !== activities.length - 1 && (
                    <span className="absolute top-4 left-3 h-[calc(100%-1rem)] w-0.5 bg-gray-100" />
                  )}
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">{getActivityIcon(activity.type)}</div>
                    <div className="flex-1 pt-1.5">
                      <p className="text-sm text-gray-900">
                        <span className="font-bold">{activity.user}</span> {activity.description}
                      </p>
                      <div className="mt-1 text-xs text-gray-500">{formatTimestamp(activity.timestamp)}</div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-6">
          <a href="/activity" className="text-sm font-bold text-primary-600 hover:text-primary-700 no-underline">
            View all activity →
          </a>
        </div>
      </div>
    </div>
  );
};