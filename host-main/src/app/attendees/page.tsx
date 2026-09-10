'use client';

import React, { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

function AttendeesPickerContent() {
  const { userProfile } = useAuth();
  const router = useRouter();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userProfile?.id) return;

    const loadEvents = async () => {
      const { data } = await supabase
        .from('events')
        .select('*')
        .eq('host_id', userProfile.id)
        .order('created_at', { ascending: false });
      setEvents(data || []);
      setLoading(false);
    };

    loadEvents();
  }, [userProfile?.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-extrabold text-gray-900 mb-1.5">
        Attendees
      </h1>
      <p className="text-gray-500 mb-7 text-sm">Select an event to view and manage its attendees</p>

      {events.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-500">You haven't created any events yet.</p>
        </div>
      ) : (
        <div className="grid gap-3">
        {events.map((event) => (
          <button
            key={event.id}
            onClick={() => router.push(`/events/${event.id}/attendees`)}
            className="text-left bg-white rounded-2xl border border-gray-200 p-5 hover:border-primary-300 transition-colors flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-11 h-11 shrink-0 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600 text-base font-extrabold">
                {event.title?.charAt(0).toUpperCase() || '?'}
              </div>
              <div className="min-w-0">
                <h3 className="text-[15px] font-bold text-gray-900 truncate">
                  {event.title}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {event.event_date ? new Date(event.event_date).toLocaleDateString() : 'No date set'}
                </p>
              </div>
            </div>
            <svg
              className="w-4 h-4 text-gray-300 shrink-0"
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ))}
      </div>
      )}
    </div>
  );
}

export default function AttendeesPickerPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout currentPage="attendees">
        <AttendeesPickerContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}