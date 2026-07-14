/**
 * ENHANCED EVENT DETAIL PAGE (/events/[id])
 * Premium event detail view with comprehensive information display
 */
'use client';

import React, { use } from 'react';
import { supabase } from '@/lib/supabase';
import { notFound, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import SaveAsTemplateModal from '@/components/SaveAsTemplateModal';
import CloneEventModal from '@/components/CloneEventModal';

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: eventId } = use(params);
  const { userProfile } = useAuth();
  const router = useRouter();
  const [event, setEvent] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [showTemplateModal, setShowTemplateModal] = React.useState(false);
  const [showCloneModal, setShowCloneModal] = React.useState(false);

  React.useEffect(() => {
    async function fetchEvent() {
      try {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .eq('id', eventId)
          .maybeSingle();

        if (error) throw error;
        setEvent(data);
      } catch (error) {
        setEvent(null);
      } finally {
        setLoading(false);
      }
    }
    fetchEvent();
  }, [eventId]);

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
                Loading event...
              </p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (!event) return notFound();

  const formatDate = (value: any) => {
    if (!value) return 'N/A';
    const date = new Date(value);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getEventTypeIcon = (type: string) => {
    const icons: { [key: string]: string } = {
      'Conference': '🎤',
      'Workshop': '🛠️',
      'Meetup': '🤝',
      'Webinar': '💻',
      'Exhibition': '🎨',
      'Networking': '🌐',
    };
    return icons[type] || '📅';
  };

  const getEventTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      'Conference': 'from-blue-500 to-cyan-500',
      'Workshop': 'from-purple-500 to-pink-500',
      'Meetup': 'from-emerald-500 to-teal-500',
      'Webinar': 'from-orange-500 to-red-500',
      'Exhibition': 'from-violet-500 to-purple-500',
      'Networking': 'from-amber-500 to-orange-500',
    };
    return colors[type] || 'from-blue-500 to-purple-500';
  };

  const isEventOwner = userProfile?.id === event.host_id;

  return (
    <ProtectedRoute>
      <DashboardLayout currentPage="events">
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 relative overflow-hidden">
          <div className="fixed inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-blob"></div>
            <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
          </div>

          <div className="relative z-10 p-8">
            <div className="mb-10 animate-[fadeIn_0.8s_ease-out]">
              <div className="flex items-center gap-4 mb-6">
                <button
                  onClick={() => router.back()}
                  className="group p-3 hover:bg-white/80 backdrop-blur-sm rounded-2xl transition-all duration-300 hover:scale-110 hover:shadow-lg border border-slate-200/50"
                >
                  <svg className="w-6 h-6 text-slate-700 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-4xl">{getEventTypeIcon(event.type)}</span>
                    <span className={`px-4 py-2 rounded-full text-sm font-black text-white bg-gradient-to-r ${getEventTypeColor(event.type)} shadow-lg`}>
                      {event.type}
                    </span>
                    {event.multi_day && (
                      <span className="px-4 py-2 rounded-full text-sm font-black text-purple-700 bg-purple-100 border-2 border-purple-300">
                        Multi-Day Event
                      </span>
                    )}
                  </div>
                  <h1 className="text-5xl font-black bg-gradient-to-r from-slate-900 via-blue-900 to-purple-900 bg-clip-text text-transparent mb-3">
                    {event.title}
                  </h1>
                </div>
                {isEventOwner && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowTemplateModal(true)}
                      className="group flex items-center gap-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-8 py-4 rounded-2xl font-bold hover:shadow-2xl hover:shadow-emerald-500/40 hover:scale-105 transition-all duration-300"
                    >
                      <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>Save as Template</span>
                    </button>
                    <button
                      onClick={() => setShowCloneModal(true)}
                      className="group flex items-center gap-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-8 py-4 rounded-2xl font-bold hover:shadow-2xl hover:shadow-violet-500/40 hover:scale-105 transition-all duration-300"
                    >
                      <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <span>Clone Event</span>
                    </button>
                    <button
                      onClick={() => router.push(`/events/${eventId}/edit`)}
                      className="group flex items-center gap-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-2xl font-bold hover:shadow-2xl hover:shadow-blue-500/40 hover:scale-105 transition-all duration-300"
                    >
                      <svg className="w-5 h-5 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <span>Edit Event</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                {event.poster_url && (
                  <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-slate-200/50 shadow-2xl overflow-hidden animate-[fadeIn_0.5s_ease-out]">
                    <img src={event.poster_url} alt={event.title} className="w-full h-96 object-cover" />
                  </div>
                )}

                <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-slate-200/50 shadow-2xl p-8 animate-[fadeIn_0.5s_ease-out_0.1s_backwards]">
                  <h2 className="text-2xl font-black text-slate-900 mb-4 flex items-center gap-3">
                    <span className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center text-white">📝</span>
                    About This Event
                  </h2>
                  <p className="text-lg text-slate-700 leading-relaxed font-medium whitespace-pre-wrap">
                    {event.description}
                  </p>
                </div>

                {event.speakers && event.speakers.length > 0 && (
                  <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-slate-200/50 shadow-2xl p-8 animate-[fadeIn_0.5s_ease-out_0.2s_backwards]">
                    <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
                      <span className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center text-white">🎤</span>
                      Featured Speakers
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {event.speakers.map((speaker: any, idx: number) => (
                        <div key={idx} className="group bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl p-6 border-2 border-slate-200 hover:border-purple-300 hover:shadow-xl transition-all duration-300">
                          <div className="flex items-start gap-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center text-white text-2xl font-black shadow-lg">
                              {speaker.name.charAt(0)}
                            </div>
                            <div className="flex-1">
                              <h3 className="text-xl font-black text-slate-900 mb-1">{speaker.name}</h3>
                              <p className="text-sm font-bold text-purple-600 mb-2">{speaker.title}</p>
                              {speaker.company && <p className="text-sm text-slate-600 font-medium mb-2">{speaker.company}</p>}
                              {speaker.bio && <p className="text-sm text-slate-600 font-medium">{speaker.bio}</p>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {event.agenda && event.agenda.length > 0 && (
                  <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-slate-200/50 shadow-2xl p-8 animate-[fadeIn_0.5s_ease-out_0.3s_backwards]">
                    <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
                      <span className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-xl flex items-center justify-center text-white">📅</span>
                      Event Agenda
                    </h2>
                    <div className="space-y-4">
                      {event.agenda.map((item: any, idx: number) => {
                        const time = new Date(item.time);
                        return (
                          <div key={idx} className="group flex gap-6 p-6 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border-2 border-emerald-200 hover:border-emerald-300 hover:shadow-lg transition-all duration-300">
                            <div className="flex-shrink-0">
                              <div className="w-20 h-20 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-xl flex flex-col items-center justify-center text-white shadow-lg">
                                <span className="text-2xl font-black">
                                  {time.getHours().toString().padStart(2, '0')}:{time.getMinutes().toString().padStart(2, '0')}
                                </span>
                                {item.duration && <span className="text-xs font-bold opacity-90">{item.duration}</span>}
                              </div>
                            </div>
                            <div className="flex-1">
                              <h3 className="text-xl font-black text-slate-900 mb-2">{item.title}</h3>
                              {item.speaker && <p className="text-sm font-bold text-emerald-700 mb-2">👤 {item.speaker}</p>}
                              {item.description && <p className="text-sm text-slate-600 font-medium">{item.description}</p>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {event.partners && event.partners.length > 0 && (
                  <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-slate-200/50 shadow-2xl p-8 animate-[fadeIn_0.5s_ease-out_0.4s_backwards]">
                    <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
                      <span className="w-10 h-10 bg-gradient-to-br from-amber-600 to-orange-600 rounded-xl flex items-center justify-center text-white">🤝</span>
                      Event Partners
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {event.partners.map((partner: any, idx: number) => (
                        
                          key={idx}
                          href={partner.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group flex flex-col items-center justify-center p-6 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border-2 border-amber-200 hover:border-amber-400 hover:shadow-xl transition-all duration-300 hover:scale-105"
                        >
                          <div className="w-16 h-16 bg-gradient-to-br from-amber-600 to-orange-600 rounded-xl flex items-center justify-center text-white text-2xl font-black shadow-lg mb-3">
                            {partner.name.charAt(0)}
                          </div>
                          <p className="text-center text-sm font-black text-slate-900 group-hover:text-amber-600 transition-colors">{partner.name}</p>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-slate-200/50 shadow-2xl p-8 sticky top-8 animate-[fadeIn_0.5s_ease-out_0.1s_backwards]">
                  <h2 className="text-2xl font-black text-slate-900 mb-6">Event Details</h2>

                  <div className="space-y-6">
                    <div className="pb-6 border-b-2 border-slate-100">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center text-white text-xl shadow-lg flex-shrink-0">📆</div>
                        <div>
                          <p className="text-xs font-black text-slate-500 uppercase tracking-wide mb-1">Start Date</p>
                          <p className="text-sm font-bold text-slate-900">{formatDate(event.start_at)}</p>
                        </div>
                      </div>
                      {event.multi_day && event.end_at && (
                        <div className="flex items-start gap-4 mt-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center text-white text-xl shadow-lg flex-shrink-0">🏁</div>
                          <div>
                            <p className="text-xs font-black text-slate-500 uppercase tracking-wide mb-1">End Date</p>
                            <p className="text-sm font-bold text-slate-900">{formatDate(event.end_at)}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {event.venue && (
                      <div className="pb-6 border-b-2 border-slate-100">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-xl flex items-center justify-center text-white text-xl shadow-lg flex-shrink-0">📍</div>
                          <div>
                            <p className="text-xs font-black text-slate-500 uppercase tracking-wide mb-1">Location</p>
                            <p className="text-sm font-bold text-slate-900">{event.venue?.name || event.venue}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {event.capacity && (
                      <div className="pb-6 border-b-2 border-slate-100">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-violet-600 to-purple-600 rounded-xl flex items-center justify-center text-white text-xl shadow-lg flex-shrink-0">👥</div>
                          <div>
                            <p className="text-xs font-black text-slate-500 uppercase tracking-wide mb-1">Capacity</p>
                            <p className="text-sm font-bold text-slate-900">{event.capacity} attendees</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {event.price_options && event.price_options.length > 0 && (
                      <div className="pb-6 border-b-2 border-slate-100">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-amber-600 to-orange-600 rounded-xl flex items-center justify-center text-white text-xl shadow-lg flex-shrink-0">💰</div>
                          <div>
                            <p className="text-xs font-black text-slate-500 uppercase tracking-wide mb-1">Price</p>
                            <p className="text-sm font-bold text-slate-900">
                              {event.price_options[0].price === 0 ? 'Free' : `$${event.price_options[0].price}`}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {event.registration_url && (
                      
                        href={event.registration_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group w-full flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-5 rounded-2xl font-black text-lg hover:shadow-2xl hover:shadow-blue-500/40 hover:scale-105 transition-all duration-300"
                      >
                        <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                        </svg>
                        <span>Register Now</span>
                      </a>
                    )}
                  </div>
                </div>

                <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-slate-200/50 shadow-2xl p-8 animate-[fadeIn_0.5s_ease-out_0.2s_backwards]">
                  <h2 className="text-xl font-black text-slate-900 mb-4">Share Event</h2>
                  <div className="flex gap-3">
                    <button className="flex-1 p-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-300 hover:scale-105 font-bold">Twitter</button>
                    <button className="flex-1 p-4 bg-blue-800 text-white rounded-xl hover:bg-blue-900 transition-all duration-300 hover:scale-105 font-bold">Facebook</button>
                    <button className="flex-1 p-4 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all duration-300 hover:scale-105 font-bold">WhatsApp</button>
                  </div>
                </div>
              </div>
            </div>
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

        <SaveAsTemplateModal
          isOpen={showTemplateModal}
          onClose={() => setShowTemplateModal(false)}
          eventData={{ ...event, id: eventId }}
          onSave={async (templateData) => {
            console.log('Saving template:', templateData);
          }}
        />

        <CloneEventModal
          isOpen={showCloneModal}
          onClose={() => setShowCloneModal(false)}
          eventId={eventId}
          eventTitle={event?.title || ''}
          onCloneSuccess={(newEventId) => {
            router.push(`/events/${newEventId}`);
          }}
        />
      </DashboardLayout>
    </ProtectedRoute>
  );
}