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
      <h1 className="text-3xl font-bold text-slate-900 mb-2">Attendees</h1>
      <p className="text-slate-600 mb-8">Select an event to view and manage its attendees</p>

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
              className="text-left bg-white rounded-xl border border-slate-200 p-6 hover:border-blue-400 hover:shadow-md transition-all"
            >
              <h3 className="text-lg font-semibold text-slate-900">{event.title}</h3>
              <p className="text-sm text-slate-500 mt-1">
                {event.event_date ? new Date(event.event_date).toLocaleDateString() : 'No date set'}
              </p>
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