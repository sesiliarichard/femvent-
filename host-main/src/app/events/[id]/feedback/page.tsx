/**
 * EVENT FEEDBACK VIEWING (/events/[id]/feedback)
 * Read-only view for the host — attendees submit feedback from the app
 */
'use client';

import React, { use, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';

interface Feedback {
  id: string;
  event_id: string;
  user_id: string | null;
  rating: number;
  comment: string | null;
  created_at: string;
}

export default function FeedbackViewingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: eventId } = use(params);
  const { userProfile } = useAuth();
  const router = useRouter();

  const [event, setEvent] = useState<any>(null);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [ratingFilter, setRatingFilter] = useState<number | 'all'>('all');

  useEffect(() => {
    fetchEventAndFeedback();
  }, [eventId]);

  async function fetchEventAndFeedback() {
    setLoading(true);
    const [{ data: eventData }, { data: feedbackData, error }] = await Promise.all([
      supabase.from('events').select('*').eq('id', eventId).maybeSingle(),
      supabase
        .from('feedback')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false }),
    ]);

    if (error) console.error('Error loading feedback:', error);
    setEvent(eventData);
    setFeedback(feedbackData || []);
    setLoading(false);
  }

  const stats = useMemo(() => {
    if (feedback.length === 0) return { average: 0, total: 0, distribution: [0, 0, 0, 0, 0] };
    const total = feedback.length;
    const sum = feedback.reduce((acc, f) => acc + f.rating, 0);
    const distribution = [1, 2, 3, 4, 5].map(
      (star) => feedback.filter((f) => f.rating === star).length
    );
    return { average: sum / total, total, distribution };
  }, [feedback]);

  const filteredFeedback = useMemo(() => {
    if (ratingFilter === 'all') return feedback;
    return feedback.filter((f) => f.rating === ratingFilter);
  }, [feedback, ratingFilter]);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  // Star ratings stay amber/gold — that's a universal rating convention, not brand color
  const renderStars = (rating: number, size = 'text-base') => (
    <span className={`${size} text-amber-400`}>
      {'★'.repeat(rating)}
      <span className="text-gray-200">{'★'.repeat(5 - rating)}</span>
    </span>
  );

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout currentPage="events">
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
              <div className="relative w-16 h-16 mx-auto mb-5">
                <div className="absolute inset-0 rounded-full border-4 border-primary-100"></div>
                <div className="absolute inset-0 rounded-full border-4 border-primary-600 border-t-transparent animate-spin"></div>
              </div>
              <p className="text-lg font-bold text-gray-700">
                Loading feedback...
              </p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout currentPage="events">
        <div className="min-h-screen bg-gray-50">
          <div className="p-8 max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-7">
              <div className="flex items-center gap-4 mb-2">
                <button
                  onClick={() => router.push(`/events/${eventId}`)}
                  className="p-2.5 bg-white border border-gray-200 rounded-xl hover:border-primary-300 transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="flex-1">
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.98 21.539a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>
                    <span className="text-sm font-bold text-gray-500">{event?.title}</span>
                  </div>
                  <h1 className="text-2xl font-extrabold text-gray-900">
                    Feedback
                  </h1>
                </div>
              </div>
            </div>

            {/* Stats summary */}
            {stats.total > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-7 mb-7">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-7 items-center">
                  <div className="text-center md:border-r md:border-gray-200">
                    <p className="text-5xl font-extrabold text-amber-500">
                      {stats.average.toFixed(1)}
                    </p>
                    <div className="flex justify-center my-2">{renderStars(Math.round(stats.average), 'text-xl')}</div>
                    <p className="text-sm font-bold text-gray-500">
                      {stats.total} {stats.total === 1 ? 'response' : 'responses'}
                    </p>
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    {[5, 4, 3, 2, 1].map((star) => {
                      const count = stats.distribution[star - 1];
                      const pct = stats.total ? (count / stats.total) * 100 : 0;
                      return (
                        <button
                          key={star}
                          onClick={() => setRatingFilter(ratingFilter === star ? 'all' : star)}
                          className={`w-full flex items-center gap-3 ${
                            ratingFilter === star ? 'opacity-100' : 'opacity-80 hover:opacity-100'
                          }`}
                        >
                          <span className="text-xs font-bold text-gray-500 w-10 flex-shrink-0">{star} ★</span>
                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                ratingFilter === star ? 'bg-primary-600' : 'bg-amber-400'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-gray-400 w-8 flex-shrink-0 text-right">{count}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {ratingFilter !== 'all' && (
                  <button
                    onClick={() => setRatingFilter('all')}
                    className="mt-4 text-xs font-bold text-primary-600 hover:underline"
                  >
                    Clear filter ({ratingFilter} ★ only) ✕
                  </button>
                )}
              </div>
            )}

            {/* List */}
            {feedback.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-14 text-center">
                <div className="w-14 h-14 mb-4 mx-auto bg-primary-50 rounded-xl flex items-center justify-center text-primary-600">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.98 21.539a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>
                </div>
                <p className="text-lg font-extrabold text-gray-900 mb-1.5">No feedback yet</p>
                <p className="text-gray-500 text-sm">
                  Attendees can submit feedback from the app once your event is underway.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredFeedback.map((f) => (
                  <div
                    key={f.id}
                    className="bg-white rounded-2xl border border-gray-200 p-6"
                  >
                    <div className="flex items-start justify-between gap-4 mb-2">
                      {renderStars(f.rating)}
                      <span className="text-xs font-semibold text-gray-400 flex-shrink-0">{formatDate(f.created_at)}</span>
                    </div>
                    {f.comment ? (
                      <p className="text-gray-700 leading-relaxed">{f.comment}</p>
                    ) : (
                      <p className="text-gray-400 italic text-sm">No comment left</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}