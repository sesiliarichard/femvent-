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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
     <h1 className="text-3xl font-black bg-gradient-to-r from-slate-900 via-blue-900 to-purple-900 bg-clip-text text-transparent mb-2">
        Attendees
      </h1>
      <p className="text-slate-600 mb-8 font-medium">Select an event to view and manage its attendees</p>

      {events.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <p className="text-slate-500">You haven't created any events yet.</p>
        </div>
      ) : (
        <div className="grid gap-4">
        {events.map((event) => (
          <button
            key={event.id}
            onClick={() => router.push(`/events/${event.id}/attendees`)}
            className="group text-left bg-white rounded-2xl border-2 border-slate-200 p-6 hover:border-blue-400 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-12 h-12 shrink-0 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-lg font-black shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                {event.title?.charAt(0).toUpperCase() || '?'}
              </div>
              <div className="min-w-0">
                <h3 className="text-lg font-black text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                  {event.title}
                </h3>
                <p className="text-sm text-slate-500 font-medium mt-1">
                  {event.event_date ? new Date(event.event_date).toLocaleDateString() : 'No date set'}
                </p>
              </div>
            </div>
            <svg
              className="w-5 h-5 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all duration-300 shrink-0"
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