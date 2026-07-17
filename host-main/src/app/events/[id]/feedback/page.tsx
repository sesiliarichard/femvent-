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

  const renderStars = (rating: number, size = 'text-base') => (
    <span className={`${size} text-amber-400`}>
      {'★'.repeat(rating)}
      <span className="text-slate-200">{'★'.repeat(5 - rating)}</span>
    </span>
  );

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout currentPage="events">
          <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 flex items-center justify-center">
            <div className="text-center">
              <div className="relative w-24 h-24 mx-auto mb-6">
                <div className="absolute inset-0 rounded-full border-4 border-blue-200"></div>
                <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
              </div>
              <p className="text-2xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
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
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 relative overflow-hidden">
          <div className="fixed inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-blob"></div>
            <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
          </div>

          <div className="relative z-10 p-8">
            {/* Header */}
            <div className="mb-10 animate-[fadeIn_0.8s_ease-out]">
              <div className="flex items-center gap-4 mb-2">
                <button
                  onClick={() => router.push(`/events/${eventId}`)}
                  className="group p-3 hover:bg-white/80 backdrop-blur-sm rounded-2xl transition-all duration-300 hover:scale-110 hover:shadow-lg border border-slate-200/50"
                >
                  <svg className="w-6 h-6 text-slate-700 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl">⭐</span>
                    <span className="text-sm font-bold text-slate-500">{event?.title}</span>
                  </div>
                  <h1 className="text-4xl font-black bg-gradient-to-r from-slate-900 via-blue-900 to-purple-900 bg-clip-text text-transparent">
                    Feedback
                  </h1>
                </div>
              </div>
            </div>

            {/* Stats summary */}
            {stats.total > 0 && (
              <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-slate-200/50 shadow-2xl p-8 mb-8 animate-[fadeIn_0.5s_ease-out]">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                  <div className="text-center md:border-r md:border-slate-200">
                    <p className="text-6xl font-black bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
                      {stats.average.toFixed(1)}
                    </p>
                    <div className="flex justify-center my-2">{renderStars(Math.round(stats.average), 'text-2xl')}</div>
                    <p className="text-sm font-bold text-slate-500">
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
                          className={`w-full flex items-center gap-3 group ${
                            ratingFilter === star ? 'opacity-100' : 'opacity-80 hover:opacity-100'
                          }`}
                        >
                          <span className="text-xs font-bold text-slate-500 w-10 flex-shrink-0">{star} ★</span>
                          <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                ratingFilter === star ? 'bg-blue-600' : 'bg-amber-400'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-slate-400 w-8 flex-shrink-0 text-right">{count}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {ratingFilter !== 'all' && (
                  <button
                    onClick={() => setRatingFilter('all')}
                    className="mt-4 text-xs font-bold text-blue-600 hover:underline"
                  >
                    Clear filter ({ratingFilter} ★ only) ✕
                  </button>
                )}
              </div>
            )}

            {/* List */}
            {feedback.length === 0 ? (
              <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-slate-200/50 shadow-2xl p-16 text-center">
                <div className="text-6xl mb-4">⭐</div>
                <p className="text-xl font-black text-slate-900 mb-2">No feedback yet</p>
                <p className="text-slate-500 font-medium">
                  Attendees can submit feedback from the app once your event is underway.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredFeedback.map((f, idx) => (
                  <div
                    key={f.id}
                    className="bg-white/80 backdrop-blur-xl rounded-3xl border border-slate-200/50 shadow-xl p-6 animate-[fadeIn_0.5s_ease-out]"
                    style={{ animationDelay: `${idx * 0.05}s` }}
                  >
                    <div className="flex items-start justify-between gap-4 mb-2">
                      {renderStars(f.rating)}
                      <span className="text-xs font-semibold text-slate-400 flex-shrink-0">{formatDate(f.created_at)}</span>
                    </div>
                    {f.comment ? (
                      <p className="text-slate-700 font-medium leading-relaxed">{f.comment}</p>
                    ) : (
                      <p className="text-slate-400 font-medium italic text-sm">No comment left</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <style jsx global>{`
            @keyframes fadeIn {
              from { opacity: 0; transform: translateY(20px); }
              to { opacity: 1; transform: translateY(0); }
            }
            @keyframes blob {
              0%, 100% { transform: translate(0, 0) scale(1); }
              33% { transform: translate(30px, -50px) scale(1.1); }
              66% { transform: translate(-20px, 20px) scale(0.9); }
            }
            .animate-blob { animation: blob 7s infinite; }
            .animation-delay-2000 { animation-delay: 2s; }
          `}</style>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}